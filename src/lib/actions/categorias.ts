"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function obtenerCategorias() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .is("deleted_at", null)
    .order("nombre");

  if (error) throw error;
  return data;
}

export async function agregarCategoria(nombre: string, icono_color?: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categorias").insert({
    nombre,
    icono_color: icono_color || null,
    activo: true,
  });

  if (error) throw error;
  revalidatePath("/categorias");
}

export async function desactivarCategoria(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("categorias")
    .update({ activo: false })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/categorias");
}
