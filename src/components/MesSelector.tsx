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
    <div className="flex items-center gap-1 sm:gap-3">
      <button
        onClick={mesAnterior}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-xs hover:bg-gray-50 active:bg-gray-100 sm:h-11 sm:w-11 sm:text-sm"
      >
        ←
      </button>
      <span className="min-w-[100px] text-center text-xs font-semibold text-gray-700 sm:min-w-[140px] sm:text-sm">
        {MESES[mesActual]} {anioActual}
      </span>
      <button
        onClick={mesSiguiente}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-xs hover:bg-gray-50 active:bg-gray-100 sm:h-11 sm:w-11 sm:text-sm"
      >
        →
      </button>
    </div>
  );
}
