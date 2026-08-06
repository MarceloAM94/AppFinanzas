export type TipoMovimiento = "gasto" | "ingreso";
export type TipoGastoSugerido = "fijo" | "hormiga" | "variable";

export interface ParseResult {
  ok: boolean;
  error?: string;
  monto?: number;
  comercio?: string;
  fecha?: string;
  tipoMovimiento?: TipoMovimiento;
  tipoGastoSugerido?: TipoGastoSugerido;
  movimiento?: string;
}

const MONTO_REGEX = /S\/\s*([0-9][0-9.,]*)/i;
const MONTO_POR_CAMPO = /\b(?:monto|importe|total|valor)\s*[:–]?\s*S\/\s*([0-9][0-9.,]*)/i;
const FECHA_DMY = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/;
const FECHA_ISO = /(\d{4})-(\d{2})-(\d{2})/;

const MESES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
};
const FECHA_LARGA = new RegExp(
  `(\\d{1,2})\\s+de\\s+(${Object.keys(MESES).join("|")})\\s+de\\s+(\\d{4})(?:\\s*[-–]\\s*(\\d{1,2}):(\\d{2})\\s*(AM|PM|a\\.m\\.|p\\.m\\.))?`,
  "i"
);
const PERU_UTC_OFFSET_HORAS = 5;

const LABEL_SIGUIENTE =
  /\s(?:S\/|monto\b|fecha\b|hora\b|c[oó]digo\b|operaci[oó]n\b|referencia\b|estado\b|n[uú]mero\b|tipo\b)/i;

const LIMITE_COMERCIO = "(?:\\s*S\\/|\\s*(?:monto|fecha|hora|c[oó]digo|operaci[oó]n|referencia|estado|n[uú]mero|tipo)\\b|$)";

const CAMPOS_COMERCIO = [
  new RegExp(
    `(?:comercio|establecimiento|destinatario|beneficiario|negocio|concepto|empresa)\\s*[:–\\-]?\\s*([^\\n\\r|]{3,60}?)(?=${LIMITE_COMERCIO})`,
    "i"
  ),
  new RegExp(
    `(?:yapeaste\\s+a|recibiste\\s+un\\s+yape\\s+de|recibiste\\s+un\\s+yapeo\\s+de)\\s*[:–\\-]?\\s*([^\\n\\r|]{3,60}?)(?=${LIMITE_COMERCIO})`,
    "i"
  ),
];

const PREFIJO_CONSUMO_EN =
  /(?:consumo|compra|pago|transferencia|yape)\s+(?:de\s+)?S\/[0-9][0-9.,]*\s+con\s+(?:tu\s+)?[^.\n\r|]{2,60}?\s+en\s+([A-Za-zÁÉÍÓÚÑáéíóúñ0-9*#][^.\n\r|]{2,50}?)(?=\.|,|\s*(?:Monto|Fecha|Total)|$)/i;

const PATRONES_MOVIMIENTO: Array<{ regex: RegExp; tipo: TipoMovimiento; etiqueta: string }> = [
  { regex: /recibiste\s+un\s+yape\b/i, tipo: "ingreso", etiqueta: "Yapeo recibido" },
  { regex: /yape\s+de\b/i, tipo: "ingreso", etiqueta: "Yapeo recibido" },
  { regex: /yapeo\s+de\b/i, tipo: "ingreso", etiqueta: "Yapeo recibido" },
  { regex: /yape\s+recibido\b/i, tipo: "ingreso", etiqueta: "Yapeo recibido" },
  { regex: /yapeo\s+a\b|yapeaste\s+a\b/i, tipo: "gasto", etiqueta: "Yapeo" },
  { regex: /devoluci[oó]n/i, tipo: "ingreso", etiqueta: "Devolución" },
  { regex: /abono\b/i, tipo: "ingreso", etiqueta: "Abono" },
  { regex: /recibido\b/i, tipo: "ingreso", etiqueta: "Transferencia recibida" },
  { regex: /transferencia\s+de\b/i, tipo: "ingreso", etiqueta: "Transferencia recibida" },
  { regex: /transferencia\s+a\b/i, tipo: "gasto", etiqueta: "Transferencia" },
  { regex: /(?:compra|consumo)\s+(?:en|con|de|efectuada)/i, tipo: "gasto", etiqueta: "Compra" },
  { regex: /consumo\s+con\s+tarjeta/i, tipo: "gasto", etiqueta: "Consumo tarjeta" },
  { regex: /retiro\s+en/i, tipo: "gasto", etiqueta: "Retiro" },
  { regex: /recarga\b/i, tipo: "gasto", etiqueta: "Recarga" },
  { regex: /plin\b/i, tipo: "gasto", etiqueta: "Plin" },
  { regex: /pago\b/i, tipo: "gasto", etiqueta: "Pago" },
];

const RECURRENTES =
  /luz|agua|internet|tel[eé]fono|plan\b|suscripci[oó]n|colegiatura|pensi[oón]|gimnasio|alquiler|renta|netflix|spotify|membres[ií]a|seguro/i;

const PREFIJO_COMERCIO = new RegExp(
  `(?:yapeo a|yapeaste a|pago(?: a| de)?|compra en|consumo en|transferencia a|recarga(?: yape)?|retiro en|en el establecimiento|recibiste un yape de)\\s*[:–\\-]?\\s+([A-Za-zÁÉÍÓÚÑáéíóúñ0-9][^\\n\\r|]{2,50}?)(?=${LIMITE_COMERCIO})`,
  "i"
);

export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|tr|h[1-6]|li|table)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function parseMonto(raw: string): number | null {
  const s = raw.trim().replace(/\s+/g, "");
  if (!s || !/^[0-9.,]+$/.test(s)) return null;

  const hasDot = s.includes(".");
  const hasComma = s.includes(",");
  let decimal: string | null = null;

  if (hasDot && hasComma) {
    decimal = s.lastIndexOf(",") > s.lastIndexOf(".") ? "," : ".";
  } else if (hasComma) {
    const idx = s.lastIndexOf(",");
    decimal = s.length - idx - 1 === 3 ? null : ",";
  } else if (hasDot) {
    const idx = s.lastIndexOf(".");
    decimal = s.length - idx - 1 === 3 ? null : ".";
  }

  if (decimal) {
    const sep = decimal === "," ? "," : ".";
    const otroSep = decimal === "," ? "." : ",";
    const [intPart, decPart] = s.split(sep);
    const entero = Number(intPart.split(otroSep).join(""));
    const decimalN = Number("0." + decPart);
    return entero + decimalN;
  }

  return Number(s.split(".").join("").split(",").join(""));
}

function limpiar(texto: string): string {
  return texto
    .replace(/\s+/g, " ")
    .replace(/^[:\s\-–|]+/, "")
    .replace(/[:\s\-–|]+$/, "")
    .trim();
}

function extraerComercio(texto: string, monto: number | null): string | null {
  const normalizar = (s: string): string => {
    const limpio = limpiar(s).split(LABEL_SIGUIENTE)[0];
    return limpiar(limpio);
  };

  for (const campo of CAMPOS_COMERCIO) {
    const m = texto.match(campo);
    if (m) {
      const limpio = normalizar(m[1]);
      if (limpio.length >= 3) return limpio.slice(0, 60);
    }
  }

  const consumoEn = texto.match(PREFIJO_CONSUMO_EN);
  if (consumoEn) {
    const limpio = normalizar(consumoEn[1]);
    if (limpio.length >= 3) return limpio.slice(0, 60);
  }

  const prefijo = texto.match(PREFIJO_COMERCIO);
  if (prefijo) {
    const limpio = normalizar(prefijo[1]);
    if (limpio.length >= 3) return limpio.slice(0, 60);
  }

  if (monto !== null) {
    const idx = texto.search(MONTO_REGEX);
    if (idx > 0) {
      const antes = normalizar(texto.slice(Math.max(0, idx - 60), idx));
      if (antes.length >= 3 && antes.length <= 60) return antes;
    }
  }

  return null;
}

function sugerirTipo(texto: string, comercio: string, monto: number): TipoGastoSugerido {
  if (RECURRENTES.test(`${texto} ${comercio}`)) return "fijo";
  if (monto < 25) return "hormiga";
  return "variable";
}

export function parseBcpEmail(input: string): ParseResult {
  const texto = htmlToText(input);

  let movimiento: { tipo: TipoMovimiento; etiqueta: string } | null = null;
  for (const p of PATRONES_MOVIMIENTO) {
    if (p.regex.test(texto)) {
      movimiento = { tipo: p.tipo, etiqueta: p.etiqueta };
      break;
    }
  }

  const matchMonto = texto.match(MONTO_POR_CAMPO) || texto.match(MONTO_REGEX);
  const monto = matchMonto ? parseMonto(matchMonto[1]) : null;

  const matchFechaLarga = texto.match(FECHA_LARGA);
  let fecha: string | undefined;
  if (matchFechaLarga) {
    const mes = MESES[matchFechaLarga[2].toLowerCase()];
    const hora = Number(matchFechaLarga[4] ?? 0);
    const minuto = Number(matchFechaLarga[5] ?? 0);
    const esPM = /PM|p\.m\./i.test(matchFechaLarga[6] ?? "");
    const hora24 = (hora % 12) + (esPM ? 12 : 0);
    const iso = new Date(
      Date.UTC(Number(matchFechaLarga[3]), mes - 1, Number(matchFechaLarga[1]), hora24 + PERU_UTC_OFFSET_HORAS, minuto)
    );
    if (!Number.isNaN(iso.getTime())) fecha = iso.toISOString();
  } else {
    const matchFecha = texto.match(FECHA_DMY) || texto.match(FECHA_ISO);
    if (matchFecha) {
      if (matchFecha[4] !== undefined) {
        const iso = new Date(
          Date.UTC(Number(matchFecha[3]), Number(matchFecha[2]) - 1, Number(matchFecha[1]), Number(matchFecha[4]), Number(matchFecha[5]))
        );
        if (!Number.isNaN(iso.getTime())) fecha = iso.toISOString();
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(matchFecha[0])) {
        const iso = new Date(Date.UTC(Number(matchFecha[1]), Number(matchFecha[2]) - 1, Number(matchFecha[3])));
        if (!Number.isNaN(iso.getTime())) fecha = iso.toISOString();
      } else {
        const iso = new Date(Date.UTC(Number(matchFecha[3]), Number(matchFecha[2]) - 1, Number(matchFecha[1])));
        if (!Number.isNaN(iso.getTime())) fecha = iso.toISOString();
      }
    }
  }

  const comercio = extraerComercio(texto, monto);

  if (monto === null) {
    return { ok: false, error: "No se encontró un monto en formato S/ x.xx" };
  }
  if (!comercio) {
    return { ok: false, error: "No se pudo identificar el comercio o destinatario" };
  }

  const tipoMovimiento = movimiento?.tipo ?? "gasto";

  return {
    ok: true,
    monto,
    comercio,
    fecha,
    tipoMovimiento,
    movimiento: movimiento?.etiqueta,
    tipoGastoSugerido: tipoMovimiento === "gasto" ? sugerirTipo(texto, comercio, monto) : undefined,
  };
}
