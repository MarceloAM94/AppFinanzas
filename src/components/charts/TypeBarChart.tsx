"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
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
  data: Array<{ mes: number; fijo: number; hormiga: number; variable: number }>;
}

export default function TypeBarChart({ data }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const todosCeros = data.every((d) => d.fijo === 0 && d.hormiga === 0 && d.variable === 0);
  if (todosCeros) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-gray-400 sm:h-[280px]">
        Sin datos este año
      </div>
    );
  }

  const datos = data.map((d) => ({
    name: MESES_CORTOS[d.mes],
    Fijo: d.fijo,
    Hormiga: d.hormiga,
    Variable: d.variable,
  }));

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
      <BarChart data={datos}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} interval={isMobile ? 1 : 0} />
        <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} tickFormatter={(v) => isMobile ? `${v}` : `S/ ${v}`} width={isMobile ? 45 : 70} />
        <Tooltip
          formatter={(value) => formatearMoneda(Number(value))}
          contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
        />
        <Legend iconType="circle" iconSize={isMobile ? 6 : 8} wrapperStyle={{ fontSize: isMobile ? "11px" : "12px" }} />
        <Bar dataKey="Fijo" fill="#EF4444" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Hormiga" fill="#F59E0B" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Variable" fill="#3B82F6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
