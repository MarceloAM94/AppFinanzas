"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { guardarCredencial } from "@/lib/gmail/vault";
import { validarConexionImap } from "@/lib/gmail/imap";
import { procesarCorreosBcp } from "@/lib/gmail/process";
import type { GastoAutomatico, Integracion } from "@/types";

export async function contarGastosPendientes() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("gastos_automaticos")
    .select("id", { count: "exact", head: true })
    .in("estado", ["pendiente", "error_parseo"]);
  return count ?? 0;
}

export async function obtenerGastosPendientes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gastos_automaticos")
    .select("*")
    .in("estado", ["pendiente", "error_parseo"])
    .order("creado_en", { ascending: false });

  if (error) throw error;
  return (data ?? []) as GastoAutomatico[];
}

export async function obtenerEstadoIntegracion() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integraciones")
    .select("*")
    .eq("servicio", "gmail_bcp")
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as Integracion | null;
}

export async function guardarCredencialImap(email: string, appPassword: string) {
  const emailLimpio = email.trim();
  const passLimpia = appPassword.trim();

  if (!emailLimpio || !passLimpia) {
    throw new Error("Email y app password son obligatorios");
  }

  const conecta = await validarConexionImap({ user: emailLimpio, pass: passLimpia });
  if (!conecta) {
    throw new Error(
      "No se pudo conectar a Gmail. Verifica el email y que la app password sea correcta."
    );
  }

  await guardarCredencial("gmail_imap_user", emailLimpio);
  await guardarCredencial("gmail_imap_app_password", passLimpia);

  const supabase = await createClient();
  const { data: existente } = await supabase
    .from("integraciones")
    .select("id")
    .eq("servicio", "gmail_bcp")
    .maybeSingle();

  if (existente) {
    await supabase
      .from("integraciones")
      .update({ email: emailLimpio, conectado: true })
      .eq("servicio", "gmail_bcp");
  } else {
    await supabase
      .from("integraciones")
      .insert({ servicio: "gmail_bcp", email: emailLimpio, conectado: true });
  }

  revalidatePath("/gastos-pendientes");
  return true;
}

export async function confirmarGastoAutomatico(
  id: string,
  datos: {
    monto: number;
    comercio?: string;
    tipo: "fijo" | "hormiga" | "variable";
    categoria_id: string;
    fecha: string;
    nota?: string;
  }
) {
  const supabase = await createClient();
  const { data: pendiente } = await supabase
    .from("gastos_automaticos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!pendiente) throw new Error("No se encontró el gasto pendiente");

  const fecha = datos.fecha || pendiente.fecha?.slice(0, 10) || new Date().toISOString().slice(0, 10);
  const nota = datos.nota || datos.comercio || pendiente.comercio || "Gasto automático";

  const { error } = await supabase.from("gastos").insert({
    monto: datos.monto,
    tipo: datos.tipo,
    categoria_id: datos.categoria_id,
    fecha,
    nota,
  });
  if (error) throw error;

  await supabase
    .from("gastos_automaticos")
    .update({ estado: "confirmado", monto: datos.monto, comercio: nota })
    .eq("id", id);

  revalidatePath("/gastos-pendientes");
  revalidatePath("/gastos");
  revalidatePath("/dashboard");
  return true;
}

export async function actualizarGastoAutomatico(
  id: string,
  cambios: { monto?: number; comercio?: string; fecha?: string }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("gastos_automaticos").update(cambios).eq("id", id);
  if (error) throw error;
  revalidatePath("/gastos-pendientes");
  return true;
}

export async function descartarGastoAutomatico(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("gastos_automaticos")
    .update({ estado: "descartado" })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/gastos-pendientes");
  return true;
}

export async function procesarAhora() {
  const resultado = await procesarCorreosBcp();
  revalidatePath("/gastos-pendientes");
  return resultado;
}
