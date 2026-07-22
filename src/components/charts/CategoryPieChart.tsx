"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatearMoneda } from "@/utils/formatters";

const COLORES = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#6B7280"];

interface Props {
  data: Array<{ categoria: string; icono_color: string; total: number }>;
}

export default function CategoryPieChart({ data }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-gray-400 sm:h-[280px]">
        Sin datos este mes
      </div>
    );
  }

  const innerR = isMobile ? 40 : 60;
  const outerR = isMobile ? 70 : 100;

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerR}
          outerRadius={outerR}
          paddingAngle={2}
          dataKey="total"
          nameKey="categoria"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORES[i % COLORES.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatearMoneda(Number(value))}
          contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
        />
        <Legend
          formatter={(value) => `${value}`}
          iconType="circle"
          iconSize={isMobile ? 6 : 8}
          wrapperStyle={{ fontSize: isMobile ? "11px" : "12px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
