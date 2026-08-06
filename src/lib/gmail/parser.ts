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
const FECHA_DMY = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/;
const FECHA_ISO = /(\d{4})-(\d{2})-(\d{2})/;

const CAMPOS_COMERCIO = [
  /(?:comercio|establecimiento|destinatario|beneficiario|negocio|concepto)\s*[:–\-]\s*([^\n\r|]{3,60})/i,
];

const PATRONES_MOVIMIENTO: Array<{ regex: RegExp; tipo: TipoMovimiento; etiqueta: string }> = [
  { regex: /yapeo\s+a\b/i, tipo: "gasto", etiqueta: "Yapeo" },
  { regex: /yapeo\s+de\b/i, tipo: "ingreso", etiqueta: "Yapeo recibido" },
  { regex: /devoluci[oó]n/i, tipo: "ingreso", etiqueta: "Devolución" },
  { regex: /abono\b/i, tipo: "ingreso", etiqueta: "Abono" },
  { regex: /recibido\b/i, tipo: "ingreso", etiqueta: "Transferencia recibida" },
  { regex: /transferencia\s+de\b/i, tipo: "ingreso", etiqueta: "Transferencia recibida" },
  { regex: /transferencia\s+a\b/i, tipo: "gasto", etiqueta: "Transferencia" },
  { regex: /(?:compra|consumo)\s+(?:en|con|efectuada)/i, tipo: "gasto", etiqueta: "Compra" },
  { regex: /consumo\s+con\s+tarjeta/i, tipo: "gasto", etiqueta: "Consumo tarjeta" },
  { regex: /retiro\s+en/i, tipo: "gasto", etiqueta: "Retiro" },
  { regex: /recarga\b/i, tipo: "gasto", etiqueta: "Recarga" },
  { regex: /plin\b/i, tipo: "gasto", etiqueta: "Plin" },
  { regex: /pago\b/i, tipo: "gasto", etiqueta: "Pago" },
];

const RECURRENTES =
  /luz|agua|internet|tel[eé]fono|plan\b|suscripci[oó]n|colegiatura|pensi[oón]|gimnasio|alquiler|renta|netflix|spotify|membres[ií]a|seguro/i;

const PREFIJO_COMERCIO =
  /(?:yapeo a|pago(?: a| de)?|compra en|consumo en|transferencia a|recarga(?: yape)?|retiro en|en el establecimiento)\s+([A-Za-zÁÉÍÓÚÑáéíóúñ0-9][^\n\r|]{2,50})/i;

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
  for (const campo of CAMPOS_COMERCIO) {
    const m = texto.match(campo);
    if (m) {
      const limpio = limpiar(m[1]);
      if (limpio.length >= 3) return limpio.slice(0, 60);
    }
  }

  const prefijo = texto.match(PREFIJO_COMERCIO);
  if (prefijo) {
    const limpio = limpiar(prefijo[1]);
    if (limpio.length >= 3) return limpio.slice(0, 60);
  }

  if (monto !== null) {
    const idx = texto.search(MONTO_REGEX);
    if (idx > 0) {
      const antes = limpiar(texto.slice(Math.max(0, idx - 60), idx));
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

  const matchMonto = texto.match(MONTO_REGEX);
  const monto = matchMonto ? parseMonto(matchMonto[1]) : null;

  const matchFecha = texto.match(FECHA_DMY) || texto.match(FECHA_ISO);
  let fecha: string | undefined;
  if (matchFecha) {
    if (matchFecha[4] !== undefined) {
      const iso = new Date(
        Number(matchFecha[3]),
        Number(matchFecha[2]) - 1,
        Number(matchFecha[1]),
        Number(matchFecha[4]),
        Number(matchFecha[5])
      );
      if (!Number.isNaN(iso.getTime())) fecha = iso.toISOString();
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(matchFecha[0])) {
      const iso = new Date(Number(matchFecha[1]), Number(matchFecha[2]) - 1, Number(matchFecha[3]));
      if (!Number.isNaN(iso.getTime())) fecha = iso.toISOString();
    } else {
      const iso = new Date(Number(matchFecha[3]), Number(matchFecha[2]) - 1, Number(matchFecha[1]));
      if (!Number.isNaN(iso.getTime())) fecha = iso.toISOString();
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
