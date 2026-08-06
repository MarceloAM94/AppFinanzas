import { obtenerCredencial } from "@/lib/gmail/vault";
import { obtenerCorreosBcp } from "@/lib/gmail/imap";
import { parseBcpEmail } from "@/lib/gmail/parser";
import { createClient } from "@/lib/supabase/server";

const REMITENTES = (
  process.env.GMAIL_SENDER_FROM ||
  "notificaciones@notificacionesbcp.com.pe,notificaciones@yape.pe"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const DIAS_ANALISIS = 45;
const MARGEN_REVISION_MS = 3 * 24 * 60 * 60 * 1000;

export interface ResultadoProceso {
  ok: boolean;
  motivo?: string;
  revisados?: number;
  gastosNuevos?: number;
  ingresos?: number;
  noParseables?: number;
  yaProcesados?: number;
}

export async function procesarCorreosBcp(): Promise<ResultadoProceso> {
  const supabase = await createClient();

  const user = await obtenerCredencial("gmail_imap_user");
  const pass = await obtenerCredencial("gmail_imap_app_password");
  if (!user || !pass) {
    return { ok: false, motivo: "no_configurado" };
  }

  const { data: integracion } = await supabase
    .from("integraciones")
    .select("ultima_revision")
    .eq("servicio", "gmail_bcp")
    .maybeSingle();

  const ahora = new Date();
  const ultima = integracion?.ultima_revision
    ? new Date(integracion.ultima_revision as string)
    : null;

  const tope = ahora.getTime() - DIAS_ANALISIS * 24 * 60 * 60 * 1000;
  const desde = ultima
    ? new Date(Math.max(ultima.getTime() - MARGEN_REVISION_MS, tope))
    : new Date(tope);

  const correos = await obtenerCorreosBcp({ user, pass, remitentes: REMITENTES, desde });

  let gastosNuevos = 0;
  let ingresos = 0;
  let noParseables = 0;
  let yaProcesados = 0;

  for (const correo of correos) {
    const messageId = correo.messageId;

    try {
      const { data: existe } = await supabase
        .from("correos_procesados")
        .select("id")
        .eq("message_id", messageId)
        .maybeSingle();

      if (existe) {
        yaProcesados++;
        continue;
      }

      const resultado = parseBcpEmail(correo.html || correo.texto);

      if (!resultado.ok) {
        await supabase.from("gastos_automaticos").insert({
          monto: null,
          comercio: null,
          fecha: null,
          origen: "correo_bcp",
          estado: "error_parseo",
          tipo_gasto_sugerido: null,
          message_id: messageId,
          cuerpo_html: correo.html || correo.texto,
          parse_error: resultado.error,
        });
        await supabase
          .from("correos_procesados")
          .insert({ message_id: messageId, resultado: "no_parseable", detalle: resultado.error });
        noParseables++;
        continue;
      }

      if (resultado.tipoMovimiento === "ingreso") {
        await supabase
          .from("correos_procesados")
          .insert({ message_id: messageId, resultado: "ingreso", detalle: resultado.comercio });
        ingresos++;
        continue;
      }

      await supabase.from("gastos_automaticos").insert({
        monto: resultado.monto,
        comercio: resultado.comercio,
        fecha: resultado.fecha ?? correo.fecha?.toISOString() ?? null,
        origen: "correo_bcp",
        estado: "pendiente",
        tipo_gasto_sugerido: resultado.tipoGastoSugerido,
        message_id: messageId,
        cuerpo_html: correo.html,
      });
      await supabase
        .from("correos_procesados")
        .insert({ message_id: messageId, resultado: "gasto", detalle: resultado.comercio });
      gastosNuevos++;
    } catch {
      try {
        await supabase
          .from("correos_procesados")
          .upsert(
            { message_id: messageId, resultado: "error", detalle: "Error procesando el correo" },
            { onConflict: "message_id" }
          );
      } catch {
        // ignorar fallo de auditoría
      }
    }
  }

  await supabase
    .from("integraciones")
    .upsert(
      { servicio: "gmail_bcp", ultima_revision: ahora.toISOString(), conectado: true },
      { onConflict: "servicio" }
    );

  return {
    ok: true,
    revisados: correos.length,
    gastosNuevos,
    ingresos,
    noParseables,
    yaProcesados,
  };
}
