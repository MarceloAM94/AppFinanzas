"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function obtenerIngresos(mes: number, anio: number) {
  const supabase = await createClient();
  const fechaInicio = `${anio}-${String(mes + 1).padStart(2, "0")}-01`;
  const fechaFin = mes === 11 ? `${anio + 1}-01-01` : `${anio}-${String(mes + 2).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("ingresos")
    .select("*")
    .is("deleted_at", null)
    .gte("fecha", fechaInicio)
    .lt("fecha", fechaFin)
    .order("fecha", { ascending: false });

  if (error) throw error;
  return data;
}

export async function totalIngresosDelMes(mes: number, anio: number) {
  const ingresos = await obtenerIngresos(mes, anio);
  return ingresos.reduce((sum, i) => sum + Number(i.monto), 0);
}

export async function agregarIngreso(monto: number, descripcion: string, fecha: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("ingresos").insert({
    monto,
    descripcion,
    fecha,
  });

  if (error) throw error;
  revalidatePath("/ingresos");
  revalidatePath("/dashboard");
}

export async function editarIngreso(id: string, updates: { monto?: number; descripcion?: string }) {
  const supabase = await createClient();
  const { error } = await supabase.from("ingresos").update(updates).eq("id", id);

  if (error) throw error;
  revalidatePath("/ingresos");
  revalidatePath("/dashboard");
}

export async function eliminarIngreso(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("ingresos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/ingresos");
  revalidatePath("/dashboard");
}

export async function ingresosMensuales(anio: number) {
  const supabase = await createClient();
  const fechaInicio = `${anio}-01-01`;
  const fechaFin = `${anio + 1}-01-01`;

  const { data, error } = await supabase
    .from("ingresos")
    .select("monto, fecha")
    .is("deleted_at", null)
    .gte("fecha", fechaInicio)
    .lt("fecha", fechaFin);

  if (error) throw error;

  const porMes: Record<number, number> = {};
  for (let m = 0; m < 12; m++) porMes[m] = 0;

  for (const i of data || []) {
    const mes = new Date(i.fecha).getMonth();
    porMes[mes] += Number(i.monto);
  }

  return Object.entries(porMes).map(([mes, total]) => ({
    mes: Number(mes),
    total,
  }));
}
