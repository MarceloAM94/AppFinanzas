"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Frecuencia = "semanal" | "quincenal" | "mensual";

export async function obtenerGastosFijos() {
  const supabase = await createClient();
  const { data: gastosFijos, error } = await supabase
    .from("gastos_fijos")
    .select("*, categorias(nombre, icono_color)")
    .is("deleted_at", null)
    .order("dia_del_mes");

  if (error) throw error;
  if (!gastosFijos || gastosFijos.length === 0) return [];

  const hoy = new Date();
  const resultados = await Promise.all(
    gastosFijos.map(async (gf) => {
      const pagado = await verificarPagado(gf.id, gf.frecuencia as Frecuencia, hoy);
      return { ...gf, pagado };
    })
  );

  return resultados;
}

async function verificarPagado(gastoFijoId: string, frecuencia: Frecuencia, fechaReferencia: Date): Promise<boolean> {
  const supabase = await createClient();
  const hoy = fechaReferencia.toISOString().split("T")[0];

  let fechaInicio: string;
  const fechaFin = hoy;

  switch (frecuencia) {
    case "semanal": {
      const lunes = new Date(fechaReferencia);
      lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
      fechaInicio = lunes.toISOString().split("T")[0];
      break;
    }
    case "quincenal": {
      const inicio = new Date(fechaReferencia);
      inicio.setDate(inicio.getDate() - 14);
      fechaInicio = inicio.toISOString().split("T")[0];
      break;
    }
    case "mensual": {
      const inicio = new Date(fechaReferencia.getFullYear(), fechaReferencia.getMonth(), 1);
      fechaInicio = inicio.toISOString().split("T")[0];
      break;
    }
  }

  const { count } = await supabase
    .from("gastos")
    .select("*", { count: "exact", head: true })
    .eq("gasto_fijo_id", gastoFijoId)
    .is("deleted_at", null)
    .gte("fecha", fechaInicio)
    .lte("fecha", fechaFin);

  return (count ?? 0) > 0;
}

export async function gastosFijosActivos() {
  const todos = await obtenerGastosFijos();
  return todos.filter((gf) => gf.activo);
}

export async function agregarGastoFijo(
  nombre: string,
  monto_estimado: number,
  categoria_id: string,
  dia_del_mes: number,
  frecuencia: Frecuencia = "mensual"
) {
  const supabase = await createClient();
  const { error } = await supabase.from("gastos_fijos").insert({
    nombre,
    monto_estimado,
    categoria_id,
    dia_del_mes,
    frecuencia,
    activo: true,
  });

  if (error) throw error;
  revalidatePath("/gastos-fijos");
}

export async function desactivarGastoFijo(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("gastos_fijos")
    .update({ activo: false })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/gastos-fijos");
}

export async function pagarGastoFijo(gastoFijoId: string) {
  const supabase = await createClient();

  const { data: gf, error: fetchError } = await supabase
    .from("gastos_fijos")
    .select("*")
    .eq("id", gastoFijoId)
    .single();

  if (fetchError) throw fetchError;

  const hoy = new Date();
  const yaPagado = await verificarPagado(gf.id, gf.frecuencia as Frecuencia, hoy);

  if (yaPagado) {
    throw new Error(
      `Ya se pagó este gasto fijo en el período actual (${gf.frecuencia}). No se puede pagar dos veces.`
    );
  }

  const fechaStr = hoy.toISOString().split("T")[0];

  const { error: insertError } = await supabase.from("gastos").insert({
    monto: gf.monto_estimado,
    tipo: "fijo",
    categoria_id: gf.categoria_id,
    fecha: fechaStr,
    nota: gf.nombre,
    gasto_fijo_id: gf.id,
  });

  if (insertError) throw insertError;
  revalidatePath("/gastos-fijos");
  revalidatePath("/gastos");
  revalidatePath("/dashboard");
}
