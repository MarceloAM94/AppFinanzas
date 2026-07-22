"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatearMoneda } from "@/utils/formatters";

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

interface Props {
  gastos: Array<{ mes: number; total: number }>;
  ingresos?: Array<{ mes: number; total: number }>;
}

export default function TrendLineChart({ gastos, ingresos }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const datos = gastos.map((g) => {
    const ing = ingresos?.find((i) => i.mes === g.mes);
    return {
      name: MESES_CORTOS[g.mes],
      gastos: g.total,
      ingresos: ing?.total || 0,
    };
  });

  const todosCeros = datos.every((d) => d.gastos === 0 && d.ingresos === 0);
  if (todosCeros) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-gray-400 sm:h-[280px]">
        Sin datos este año
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
      <LineChart data={datos}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} interval={isMobile ? 1 : 0} />
        <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} tickFormatter={(v) => isMobile ? `${v}` : `S/ ${v}`} width={isMobile ? 45 : 70} />
        <Tooltip
          formatter={(value, name) => [
            formatearMoneda(Number(value)),
            name === "gastos" ? "Gastos" : "Ingresos",
          ]}
          contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
        />
        <Legend
          formatter={(value) => (value === "gastos" ? "Gastos" : "Ingresos")}
          iconType="circle"
          iconSize={isMobile ? 6 : 8}
          wrapperStyle={{ fontSize: isMobile ? "11px" : "12px" }}
        />
        <Line
          type="monotone"
          dataKey="gastos"
          stroke="#EF4444"
          strokeWidth={2}
          dot={{ r: isMobile ? 2 : 4 }}
          activeDot={{ r: isMobile ? 4 : 6 }}
        />
        {ingresos && (
          <Line
            type="monotone"
            dataKey="ingresos"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ r: isMobile ? 2 : 4 }}
            activeDot={{ r: isMobile ? 4 : 6 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
