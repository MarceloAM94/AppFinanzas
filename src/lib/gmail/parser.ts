export type TipoMovimiento = "gasto" | "ingreso";
export type TipoGastoSugerido = "fijo" | "hormiga" | "variable";

export interface ParseResult {
  ok: boolean;
  omitir?: boolean;
  error?: string;
  monto?: number;
  comercio?: string;
  fecha?: string;
  tipoMovimiento?: TipoMovimiento;
  tipoGastoSugerido?: TipoGastoSugerido;
  movimiento?: string;
}

const MONTO_REGEX = /S\/\s*([0-9][0-9.,]*)/i;
const MONTO_POR_CAMPO =
  /\b(?:monto|importe|total|valor)\b(?:(?!S\/).){0,20}?\bS\/\s*([0-9][0-9.,]*)/i;
const FECHA_DMY = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/;
const FECHA_ISO = /(\d{4})-(\d{2})-(\d{2})/;

const MESES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
};
const FECHA_LARGA = new RegExp(
  `(?<dia>\\d{1,2})\\s+(?:de\\s+)?(?<mes>${Object.keys(MESES).join("|")})\\s+(?:de\\s+)?(?<anio>\\d{4})(?:\\s*[-–]\\s*(?<hora>\\d{1,2}):(?<min>\\d{2})(?::\\d{2})?\\s*(?<ampm>(?:A|P)\\.?\\s*M\\.?)?)?`,
  "i"
);
const PERU_UTC_OFFSET_HORAS = 5;

const LIMITE_COMERCIO =
  "(?:\\s*S\\/|\\s*(?:monto|importe|total|fecha|hora|c[oó]digo|operaci[oó]n|referencia|estado|n[uú]mero|tipo|servicio|titular|comisi[oó]n|cuenta|vigencia|valor|igv|subtotal|moneda|destino|desde|canal|mensaje|enviado|empresa|recibido|emitido)\\b|$)";

const CAMPOS_COMERCIO = [
  new RegExp(
    `(?:comercio|establecimiento|destinatario|beneficiario|negocio|concepto|empresa)\\s*[:–\\-]?\\s*([^\\n\\r|]{3,60}?)(?=${LIMITE_COMERCIO})`,
    "i"
  ),
];

const PREFIJO_YAPE_RECIBIDO_DE =
  /recibiste\s+un\s+yapeo?\s+de\s+S\/\s*[0-9][0-9.,]*\s+de\s+([A-Za-zÁÉÍÓÚÑáéíóúñ][^\n\r|]{2,50}?)(?=\.|$|Monto|Fecha)/i;

const PREFIJO_ENVIADO_A =
  /enviado\s+a\s+([A-Za-zÁÉÍÓÚÑáéíóúñ0-9*#][^\n\r|]{2,60}?)(?=\.(?:\s|$))/i;

const PREFIJO_WARDADITO =
  /en\s+tu\s+wardadito\s+([A-Za-zÁÉÍÓÚÑáéíóúñ0-9][^\n\r|.]{2,30}?)(?=\.|$)/i;

const PREFIJO_CONSUMO_EN =
  /(?:consumo|compra|pago|transferencia|yape)\s+(?:de\s+)?S\/\s*[0-9][0-9.,]*\s+con\s+(?:tu\s+)?[^.\n\r|]{2,60}?\s+en\s+([A-Za-zÁÉÍÓÚÑáéíóúñ0-9*#][^.\n\r|]{2,50}?)(?=\.|,|\s*(?:Monto|Fecha|Total)|$)/i;

const PREFIJO_COMERCIO = new RegExp(
  `(?:yapeo a|yapeaste a|pago(?: a| de)?|compra en|consumo en|transferencia a|recarga(?: yape)?|retiro en|en el establecimiento|recibiste un yape de)\\s*[:–\\-]?\\s+([A-Za-zÁÉÍÓÚÑáéíóúñ0-9][^\\n\\r|]{2,50}?)(?=${LIMITE_COMERCIO})`,
  "i"
);

const RECURRENTES =
  /luz|agua|internet|tel[eé]fono|plan\b|suscripci[oó]n|colegiatura|pensi[oó]n|gimnasio|alquiler|renta|netflix|spotify|membres[ií]a|seguro|bitel|claro|movistar|entel/i;

const REGLAS_MOVIMIENTO: Array<{
  regex: RegExp;
  tipo: TipoMovimiento | "omitir";
  etiqueta: string;
}> = [
  { regex: /transferencia\s+entre\s+mis\s+cuentas/i, tipo: "omitir", etiqueta: "Transferencia interna" },
  {
    regex: /(?:no\s+te\s+olvides|recuerda\s+que\s+tu)[^.]{0,80}(?:d[ée]bito|aporte|autom[áa]tico)/i,
    tipo: "omitir",
    etiqueta: "Recordatorio débito automático",
  },
  { regex: /recibiste\s+un\s+yapeo?\s+de\b/i, tipo: "ingreso", etiqueta: "Yapeo recibido" },
  { regex: /recepci[óo]n\s+de\s+yapeo\s+a\s+celular/i, tipo: "ingreso", etiqueta: "Yapeo recibido" },
  { regex: /yape\s+recibido\b/i, tipo: "ingreso", etiqueta: "Yapeo recibido" },
  { regex: /devoluci[óo]n\s+de\b/i, tipo: "ingreso", etiqueta: "Devolución" },
  { regex: /recibiste\s+una\s+transferencia\s+de\b/i, tipo: "ingreso", etiqueta: "Transferencia recibida" },
  { regex: /abono\s+(?:de\s+)?S\//i, tipo: "ingreso", etiqueta: "Abono" },
  { regex: /pago\s+con\s+qr/i, tipo: "gasto", etiqueta: "Pago QR" },
  { regex: /realizaste\s+un\s+yapeo\s+a\s+celular\b/i, tipo: "gasto", etiqueta: "Yapeo" },
  { regex: /yapeo\s+a\s+celular\s+de\s+S\//i, tipo: "gasto", etiqueta: "Yapeo" },
  { regex: /constancia\s+de\s+yapeo\s+a\s+celular/i, tipo: "gasto", etiqueta: "Yapeo" },
  { regex: /realizaste\s+un\s+consumo\b|consumo\s+con\s+tu\s+tarjeta/i, tipo: "gasto", etiqueta: "Consumo" },
  { regex: /pago\s+de\s+servicio/i, tipo: "gasto", etiqueta: "Pago de servicio" },
  { regex: /retiro\s+de\s+tu\s+wardadito|realizaste\s+un\s+retiro\b|retiro\s+en\b/i, tipo: "gasto", etiqueta: "Retiro" },
  { regex: /transferencia\s+a\b/i, tipo: "gasto", etiqueta: "Transferencia" },
  { regex: /recarga\b/i, tipo: "gasto", etiqueta: "Recarga" },
  { regex: /plin\b/i, tipo: "gasto", etiqueta: "Plin" },
  { regex: /compra\b|consumo\b/i, tipo: "gasto", etiqueta: "Compra" },
  { regex: /pago\b/i, tipo: "gasto", etiqueta: "Pago" },
];

export function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, " ")
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

export function parsearMonto(texto: string): number | undefined {
  const m = MONTO_POR_CAMPO.exec(texto) ?? MONTO_REGEX.exec(texto);
  if (!m) return undefined;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

export function parsearFecha(texto: string): string | undefined {
  const larga = FECHA_LARGA.exec(texto);
  if (larga?.groups) {
    const { dia, mes, anio, hora, min, ampm } = larga.groups;
    const numeroMes = MESES[mes.toLowerCase()];
    if (!numeroMes) return undefined;
    let h = hora ? Number(hora) : 0;
    if (ampm && /^p/i.test(ampm)) h = h < 12 ? h + 12 : h;
    if (ampm && /^a/i.test(ampm)) h = h === 12 ? 0 : h;
    return new Date(
      Date.UTC(
        Number(anio),
        numeroMes - 1,
        Number(dia),
        h + PERU_UTC_OFFSET_HORAS,
        Number(min || 0)
      )
    ).toISOString();
  }

  const dmy = FECHA_DMY.exec(texto);
  if (dmy) {
    return new Date(
      Date.UTC(
        Number(dmy[3]),
        Number(dmy[2]) - 1,
        Number(dmy[1]),
        Number(dmy[4] || 0) + PERU_UTC_OFFSET_HORAS,
        Number(dmy[5] || 0)
      )
    ).toISOString();
  }

  const iso = FECHA_ISO.exec(texto);
  if (iso) {
    return new Date(
      Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), PERU_UTC_OFFSET_HORAS)
    ).toISOString();
  }

  return undefined;
}

function limpiarComercio(s: string): string {
  return s
    .replace(/^[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9*#]+/, "")
    .replace(/\s+[a-f0-9]{8,}\s*/gi, " ")
    .replace(/[.,;:\s]+$/g, "")
    .trim();
}

export function extraerComercio(texto: string): string | undefined {
  for (const re of [
    PREFIJO_YAPE_RECIBIDO_DE,
    PREFIJO_ENVIADO_A,
    PREFIJO_WARDADITO,
    PREFIJO_CONSUMO_EN,
    ...CAMPOS_COMERCIO,
    PREFIJO_COMERCIO,
  ]) {
    const m = re.exec(texto);
    if (m && m[1]) return limpiarComercio(m[1]);
  }
  return undefined;
}

export function clasificarMovimiento(
  texto: string,
  asunto?: string
): { tipo: TipoMovimiento; omitir: boolean; etiqueta: string } {
  const fuente = `${asunto ?? ""}\n${texto}`;
  for (const regla of REGLAS_MOVIMIENTO) {
    if (regla.regex.test(fuente)) {
      return {
        tipo: regla.tipo === "omitir" ? "gasto" : regla.tipo,
        omitir: regla.tipo === "omitir",
        etiqueta: regla.etiqueta,
      };
    }
  }
  return { tipo: "gasto", omitir: false, etiqueta: "Movimiento" };
}

export function parseBcpEmail(input: string, asunto?: string): ParseResult {
  const texto = htmlToText(input);
  const { tipo, omitir, etiqueta } = clasificarMovimiento(texto, asunto);
  if (omitir) return { ok: false, omitir: true, movimiento: etiqueta };

  const monto = parsearMonto(texto);
  if (monto === undefined) {
    return {
      ok: false,
      error: "No se encontró un monto S/ en el correo",
      movimiento: etiqueta,
    };
  }

  const comercio = extraerComercio(texto);
  const fecha = parsearFecha(texto);
  const tipoGastoSugerido =
    tipo === "gasto" && RECURRENTES.test(comercio ?? "") ? "fijo" : "hormiga";

  return {
    ok: true,
    monto,
    comercio,
    fecha,
    tipoMovimiento: tipo,
    tipoGastoSugerido,
    movimiento: etiqueta,
  };
}
