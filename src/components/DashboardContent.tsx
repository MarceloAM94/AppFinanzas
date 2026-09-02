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
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Percent,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

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
      <Card className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle size={32} className="mb-3 text-down" />
        <p className="text-sm font-medium text-body">Error al cargar datos</p>
        <p className="mt-1 text-xs text-muted">{error}</p>
        <p className="mt-3 text-xs text-muted-strong">
          Verifica las variables de entorno de Supabase en Vercel y el dominio permitido (CORS).
        </p>
      </Card>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  const balance = data.balanceAcumulado;
  const totalPorTipo = data.porTipo.fijo + data.porTipo.hormiga + data.porTipo.variable;
  const pctAhorro = data.totalIngresos > 0
    ? Math.round(((data.totalIngresos - data.totalGastos) / data.totalIngresos) * 100)
    : 0;

  const summaryCards = [
    {
      label: "Ingresos",
      value: formatearMoneda(data.totalIngresos),
      icon: <TrendingDown size={18} />,
      colorClass: "text-up",
      iconBg: "bg-up/10",
    },
    {
      label: "Gastos",
      value: formatearMoneda(data.totalGastos),
      icon: <TrendingUp size={18} />,
      colorClass: "text-down",
      iconBg: "bg-down/10",
    },
    {
      label: "Saldo acumulado",
      value: formatearMoneda(balance),
      icon: <Wallet size={18} />,
      colorClass: balance >= 0 ? "text-up" : "text-down",
      iconBg: balance >= 0 ? "bg-up/10" : "bg-down/10",
    },
    {
      label: "% Ahorro",
      value: `${pctAhorro}%`,
      icon: <Percent size={18} />,
      colorClass: "text-primary",
      iconBg: "bg-primary/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} padding="sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted">{card.label}</p>
                <p className={`mt-1 text-2xl font-semibold tracking-tight ${card.colorClass}`}>
                  {card.value}
                </p>
              </div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.iconBg} ${card.colorClass}`}>
                {card.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="md">
          <h2 className="mb-4 text-sm font-medium text-muted">Gastos por Categoría</h2>
          <CategoryPieChart data={data.porCategoria} />
        </Card>

        <Card padding="md">
          <h2 className="mb-4 text-sm font-medium text-muted">Gastos por Tipo (mes actual)</h2>
          {totalPorTipo === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted">
              No hay gastos este mes
            </div>
          ) : (
            <div className="space-y-4">
              {(["fijo", "hormiga", "variable"] as const).map((tipo) => {
                const monto = Number(data.porTipo[tipo]);
                const pct = totalPorTipo > 0 ? Math.round((monto / totalPorTipo) * 100) : 0;
                const barColor = tipo === "fijo" ? "bg-muted-strong" : tipo === "hormiga" ? "bg-primary" : "bg-info";
                const label = tipo === "fijo" ? "Fijo" : tipo === "hormiga" ? "Hormiga" : "Variable";
                return (
                  <div key={tipo}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-body">{label}</span>
                      <span className="text-sm text-muted">{formatearMoneda(monto)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-elevated">
                      <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted">{pct}%</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Trend chart */}
      <Card padding="md">
        <h2 className="mb-4 text-sm font-medium text-muted">Tendencia Mensual ({anioActual})</h2>
        <TrendLineChart gastos={data.gastosAnuales} ingresos={data.ingresosAnuales} />
      </Card>

      {/* Type bar chart */}
      <Card padding="md">
        <h2 className="mb-4 text-sm font-medium text-muted">Gastos por Tipo — Tendencia ({anioActual})</h2>
        <TypeBarChart data={data.tipoMensual} />
      </Card>

      {/* Gastos fijos */}
      <Card padding="md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <RefreshCw size={18} />
          </div>
          <div>
            <h2 className="text-sm font-medium text-body">Gastos Fijos</h2>
            <p className="text-xs text-muted">
              {data.fijosActivos} gasto{data.fijosActivos !== 1 ? "s" : ""} fijo{data.fijosActivos !== 1 ? "s" : ""} activo{data.fijosActivos !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
