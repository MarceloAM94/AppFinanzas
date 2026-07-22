export function formatearMoneda(monto: number): string {
  return `S/ ${monto.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function obtenerMesAnio(fecha: Date): string {
  return fecha.toLocaleDateString("es-PE", {
    month: "long",
    year: "numeric",
  });
}
