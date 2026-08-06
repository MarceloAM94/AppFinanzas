export interface Categoria {
  id: string;
  nombre: string;
  icono_color: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Ingreso {
  id: string;
  monto: number;
  descripcion: string;
  fecha: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Gasto {
  id: string;
  monto: number;
  tipo: "fijo" | "hormiga" | "variable";
  categoria_id: string;
  fecha: string;
  nota: string | null;
  gasto_fijo_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface GastoFijo {
  id: string;
  nombre: string;
  monto_estimado: number;
  categoria_id: string;
  dia_del_mes: number;
  frecuencia: "semanal" | "quincenal" | "mensual";
  activo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  pagado?: boolean;
}

export interface GastoAutomatico {
  id: string;
  monto: number | null;
  comercio: string | null;
  fecha: string | null;
  origen: string;
  estado: "pendiente" | "confirmado" | "descartado" | "error_parseo";
  tipo_gasto_sugerido: "fijo" | "hormiga" | "variable" | null;
  message_id: string;
  cuerpo_html: string | null;
  parse_error: string | null;
  creado_en: string;
}

export interface Integracion {
  id: string;
  servicio: string;
  email: string | null;
  conectado: boolean;
  ultima_revision: string | null;
  created_at: string;
  updated_at: string;
}
