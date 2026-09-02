"use client";

import { useAppStore } from "@/store/useAppStore";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function MesSelector() {
  const { mesActual, anioActual, setMesActual, setAnioActual } = useAppStore();

  function prev() {
    if (mesActual === 0) {
      setMesActual(11);
      setAnioActual(anioActual - 1);
    } else {
      setMesActual(mesActual - 1);
    }
  }

  function next() {
    if (mesActual === 11) {
      setMesActual(0);
      setAnioActual(anioActual + 1);
    } else {
      setMesActual(mesActual + 1);
    }
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-md bg-surface border border-hairline">
      <button
        onClick={prev}
        className="flex h-8 w-8 items-center justify-center rounded-l-md text-muted hover:bg-surface-elevated hover:text-body transition-colors"
        aria-label="Mes anterior"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="min-w-[120px] px-2 text-center text-sm font-medium text-body">
        {MESES[mesActual]} {anioActual}
      </span>
      <button
        onClick={next}
        className="flex h-8 w-8 items-center justify-center rounded-r-md text-muted hover:bg-surface-elevated hover:text-body transition-colors"
        aria-label="Mes siguiente"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
