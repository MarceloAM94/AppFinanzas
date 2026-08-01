"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function obtenerGastos(mes: number, anio: number) {
  const supabase = await createClient();
  const fechaInicio = `${anio}-${String(mes + 1).padStart(2, "0")}-01`;
  const fechaFin = mes === 11 ? `${anio + 1}-01-01` : `${anio}-${String(mes + 2).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("gastos")
    .select("*, categorias(nombre, icono_color)")
    .is("deleted_at", null)
    .gte("fecha", fechaInicio)
    .lt("fecha", fechaFin)
    .order("fecha", { ascending: false });

  if (error) throw error;
  return data;
}

export async function totalGastosDelMes(mes: number, anio: number) {
  const gastos = await obtenerGastos(mes, anio);
  return gastos.reduce((sum, g) => sum + Number(g.monto), 0);
}

export async function gastosPorTipo(mes: number, anio: number) {
  const gastos = await obtenerGastos(mes, anio);
  return {
    fijo: gastos.filter((g) => g.tipo === "fijo").reduce((s, g) => s + Number(g.monto), 0),
    hormiga: gastos.filter((g) => g.tipo === "hormiga").reduce((s, g) => s + Number(g.monto), 0),
    variable: gastos.filter((g) => g.tipo === "variable").reduce((s, g) => s + Number(g.monto), 0),
  };
}

export async function agregarGasto(
  monto: number,
  tipo: "fijo" | "hormiga" | "variable",
  categoria_id: string,
  fecha: string,
  nota?: string,
  gasto_fijo_id?: string
) {
  const supabase = await createClient();
  const { error } = await supabase.from("gastos").insert({
    monto,
    tipo,
    categoria_id,
    fecha,
    nota: nota || null,
    gasto_fijo_id: gasto_fijo_id || null,
  });

  if (error) throw error;
  revalidatePath("/gastos");
  revalidatePath("/dashboard");
}

export async function editarGasto(
  id: string,
  updates: { monto?: number; tipo?: string; categoria_id?: string; nota?: string }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("gastos").update(updates).eq("id", id);

  if (error) throw error;
  revalidatePath("/gastos");
  revalidatePath("/dashboard");
}

export async function eliminarGasto(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("gastos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/gastos");
  revalidatePath("/dashboard");
}

export async function gastosPorCategoria(mes: number, anio: number) {
  const gastos = await obtenerGastos(mes, anio);
  const agrupado: Record<string, { categoria: string; icono_color: string; total: number }> = {};

  for (const g of gastos) {
    const cat = (g as any).categorias;
    const key = g.categoria_id;
    if (!agrupado[key]) {
      agrupado[key] = {
        categoria: cat?.nombre || "Sin categoría",
        icono_color: cat?.icono_color || "📁",
        total: 0,
      };
    }
    agrupado[key].total += Number(g.monto);
  }

  return Object.values(agrupado).sort((a, b) => b.total - a.total);
}

export async function obtenerBalanceAcumulado(mes: number, anio: number) {
  const supabase = await createClient();
  const fechaInicio = `${anio}-01-01`;
  const fechaFin = mes === 11 ? `${anio + 1}-01-01` : `${anio}-${String(mes + 2).padStart(2, "0")}-01`;

  const [{ data: ingresosData, error: ingresosError }, { data: gastosData, error: gastosError }] = await Promise.all([
    supabase.from("ingresos").select("monto").is("deleted_at", null).gte("fecha", fechaInicio).lt("fecha", fechaFin),
    supabase.from("gastos").select("monto").is("deleted_at", null).gte("fecha", fechaInicio).lt("fecha", fechaFin),
  ]);

  if (ingresosError) throw ingresosError;
  if (gastosError) throw gastosError;

  const ingresos = (ingresosData || []).reduce((sum, i) => sum + Number(i.monto), 0);
  const gastos = (gastosData || []).reduce((sum, g) => sum + Number(g.monto), 0);

  return ingresos - gastos;
}

export async function gastosMensuales(anio: number) {
  const supabase = await createClient();
  const fechaInicio = `${anio}-01-01`;
  const fechaFin = `${anio + 1}-01-01`;

  const { data, error } = await supabase
    .from("gastos")
    .select("monto, fecha")
    .is("deleted_at", null)
    .gte("fecha", fechaInicio)
    .lt("fecha", fechaFin);

  if (error) throw error;

  const porMes: Record<number, number> = {};
  for (let m = 0; m < 12; m++) porMes[m] = 0;

  for (const g of data || []) {
    const mes = new Date(g.fecha).getMonth();
    porMes[mes] += Number(g.monto);
  }

  return Object.entries(porMes).map(([mes, total]) => ({
    mes: Number(mes),
    total,
  }));
}

export async function gastosPorTipoMensual(anio: number) {
  const supabase = await createClient();
  const fechaInicio = `${anio}-01-01`;
  const fechaFin = `${anio + 1}-01-01`;

  const { data, error } = await supabase
    .from("gastos")
    .select("monto, tipo, fecha")
    .is("deleted_at", null)
    .gte("fecha", fechaInicio)
    .lt("fecha", fechaFin);

  if (error) throw error;

  const porMes: Record<number, { fijo: number; hormiga: number; variable: number }> = {};
  for (let m = 0; m < 12; m++) porMes[m] = { fijo: 0, hormiga: 0, variable: 0 };

  for (const g of data || []) {
    const mes = new Date(g.fecha).getMonth();
    const tipo = g.tipo as "fijo" | "hormiga" | "variable";
    if (porMes[mes][tipo] !== undefined) {
      porMes[mes][tipo] += Number(g.monto);
    }
  }

  return Object.entries(porMes).map(([mes, tipos]) => ({
    mes: Number(mes),
    ...tipos,
  }));
}
