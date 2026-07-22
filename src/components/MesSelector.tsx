"use client";

import { useAppStore } from "@/store/useAppStore";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function MesSelector() {
  const { mesActual, anioActual, setMesActual, setAnioActual } = useAppStore();

  const mesAnterior = () => {
    if (mesActual === 0) {
      setMesActual(11);
      setAnioActual(anioActual - 1);
    } else {
      setMesActual(mesActual - 1);
    }
  };

  const mesSiguiente = () => {
    if (mesActual === 11) {
      setMesActual(0);
      setAnioActual(anioActual + 1);
    } else {
      setMesActual(mesActual + 1);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={mesAnterior}
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 text-sm hover:bg-gray-50 active:bg-gray-100"
      >
        ←
      </button>
      <span className="min-w-[140px] text-center text-xs font-semibold text-gray-700 sm:text-sm">
        {MESES[mesActual]} {anioActual}
      </span>
      <button
        onClick={mesSiguiente}
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 text-sm hover:bg-gray-50 active:bg-gray-100"
      >
        →
      </button>
    </div>
  );
}
