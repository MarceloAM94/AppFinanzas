import { createServiceClient } from "@/lib/supabase/service";

export async function guardarCredencial(nombre: string, valor: string) {
  const service = createServiceClient();
  const { error } = await service.rpc("guardar_secreto", {
    p_nombre: nombre,
    p_secreto: valor,
  });
  if (error) {
    throw new Error(`No se pudo guardar el secreto "${nombre}": ${error.message}`);
  }
}

export async function obtenerCredencial(nombre: string): Promise<string | null> {
  const service = createServiceClient();
  const { data, error } = await service.rpc("obtener_secreto", {
    p_nombre: nombre,
  });
  if (error) {
    throw new Error(`No se pudo leer el secreto "${nombre}": ${error.message}`);
  }
  return (data as string | null) ?? null;
}
