export const CATEGORIAS_PREDEFINIDAS = [
  { nombre: "Comida", icono_color: "🍎" },
  { nombre: "Transporte", icono_color: "🚗" },
  { nombre: "Ocio", icono_color: "🎮" },
  { nombre: "Servicios", icono_color: "💡" },
  { nombre: "Salud", icono_color: "🏥" },
  { nombre: "Vivienda", icono_color: "🏠" },
  { nombre: "Otros", icono_color: "📦" },
];

export const TIPOS_GASTO = {
  FIJO: "fijo",
  HORMIGA: "hormiga",
  VARIABLE: "variable",
} as const;

export const TIPOS_GASTO_INFO: Record<string, { label: string; colorClass: string }> = {
  fijo:     { label: "Fijo",     colorClass: "text-muted-strong" },
  hormiga:  { label: "Hormiga",  colorClass: "text-primary" },
  variable: { label: "Variable", colorClass: "text-body" },
};
