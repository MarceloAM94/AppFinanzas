"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { formatearMoneda } from "@/utils/formatters";
import { totalIngresosDelMes, ingresosMensuales } from "@/lib/actions/ingresos";
import {
  totalGastosDelMes,
  gastosPorTipo,
  gastosPorCategoria,
  gastosMensuales,
  gastosPorTipoMensual,
  obtenerBalanceAcumulado,
} from "@/lib/actions/gastos";
import { gastosFijosActivos } from "@/lib/actions/gastos-fijos";
import CategoryPieChart from "@/components/charts/CategoryPieChart";
import TrendLineChart from "@/components/charts/TrendLineChart";
import TypeBarChart from "@/components/charts/TypeBarChart";

const TIPO_INFO: Record<string, { label: string; color: string; icono: string }> = {
  fijo: { label: "Fijos", color: "bg-red-500", icono: "🔁" },
  hormiga: { label: "Hormiga", color: "bg-yellow-500", icono: "🐜" },
  variable: { label: "Variable", color: "bg-blue-500", icono: "🛒" },
};

export default function DashboardContent() {
  const { mesActual, anioActual } = useAppStore();
  const [data, setData] = useState<{
    totalIngresos: number;
    totalGastos: number;
    balanceAcumulado: number;
    porTipo: { fijo: number; hormiga: number; variable: number };
    fijosActivos: number;
    porCategoria: Array<{ categoria: string; icono_color: string; total: number }>;
    gastosAnuales: Array<{ mes: number; total: number }>;
    ingresosAnuales: Array<{ mes: number; total: number }>;
    tipoMensual: Array<{ mes: number; fijo: number; hormiga: number; variable: number }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [totalIngresos, totalGastos, balanceAcumulado, porTipo, fijos, porCategoria, gastosAnuales, ingresosAnuales, tipoMensual] =
          await Promise.all([
            totalIngresosDelMes(mesActual, anioActual),
            totalGastosDelMes(mesActual, anioActual),
            obtenerBalanceAcumulado(mesActual, anioActual),
            gastosPorTipo(mesActual, anioActual),
            gastosFijosActivos(),
            gastosPorCategoria(mesActual, anioActual),
            gastosMensuales(anioActual),
            ingresosMensuales(anioActual),
            gastosPorTipoMensual(anioActual),
          ]);
        setData({
          totalIngresos,
          totalGastos,
          balanceAcumulado,
          porTipo,
          fijosActivos: fijos.length,
          porCategoria,
          gastosAnuales,
          ingresosAnuales,
          tipoMensual,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar datos");
      }
    }
    load();
  }, [mesActual, anioActual]);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-lg font-medium text-red-700">Error al cargar datos</p>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <p className="mt-4 text-xs text-red-500">
            Asegúrate de que las variables de entorno de Supabase estén configuradas en Vercel.
            <br />Revisa también que el dominio de Vercel esté permitido en Supabase (CORS).
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  const balance = data.balanceAcumulado;
  const totalPorTipo = data.porTipo.fijo + data.porTipo.hormiga + data.porTipo.variable;

  return (
    <div className="space-y-6">
      {/* Cards resumen */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Ingresos</div>
          <div className="mt-1 text-2xl font-bold text-green-600">
            {formatearMoneda(data.totalIngresos)}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Gastos</div>
          <div className="mt-1 text-2xl font-bold text-red-600">
            {formatearMoneda(data.totalGastos)}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Saldo acumulado</div>
          <div className={`mt-1 text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatearMoneda(balance)}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500">% Ahorro</div>
          <div className="mt-1 text-2xl font-bold text-blue-600">
            {data.totalIngresos > 0
              ? `${Math.round(((data.totalIngresos - data.totalGastos) / data.totalIngresos) * 100)}%`
              : "0%"}
          </div>
        </div>
      </div>

      {/* Fila de gráficos - 2 columnas */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Torta por categoría */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Gastos por Categoría</h2>
          <CategoryPieChart data={data.porCategoria} />
        </div>

        {/* Gastos por tipo - barras recharts */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Gastos por Tipo (mes actual)</h2>
          {totalPorTipo === 0 ? (
            <p className="flex h-[280px] items-center justify-center text-sm text-gray-400">
              No hay gastos este mes
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.porTipo).map(([tipo, monto]) => {
                const info = TIPO_INFO[tipo];
                const porcentaje = totalPorTipo > 0 ? Math.round((Number(monto) / totalPorTipo) * 100) : 0;
                return (
                  <div key={tipo} className="flex items-center gap-3">
                    <span className="text-lg">{info.icono}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{info.label}</span>
                        <span className="text-sm text-gray-500">{formatearMoneda(Number(monto))}</span>
                      </div>
                      <div className="mt-1 h-2.5 rounded-full bg-gray-100">
                        <div
                          className={`h-2.5 rounded-full ${info.color}`}
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-10 text-right text-xs text-gray-400">{porcentaje}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Línea de tendencia - ancho completo */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Tendencia Mensual ({anioActual})</h2>
        <TrendLineChart gastos={data.gastosAnuales} ingresos={data.ingresosAnuales} />
      </div>

      {/* Barras por tipo mensual - ancho completo */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Gastos por Tipo — Tendencia ({anioActual})</h2>
        <TypeBarChart data={data.tipoMensual} />
      </div>

      {/* Gastos fijos */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-gray-800">Gastos Fijos</h2>
        <p className="text-sm text-gray-500">
          {data.fijosActivos} gasto{data.fijosActivos !== 1 ? "s" : ""} fijo{data.fijosActivos !== 1 ? "s" : ""} activo{data.fijosActivos !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
