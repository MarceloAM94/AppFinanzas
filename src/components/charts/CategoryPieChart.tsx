"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatearMoneda } from "@/utils/formatters";

const COLORES = ["#fcd535", "#0ecb81", "#3b82f6", "#f6465d", "#2dbdb6", "#929aa5", "#f0b90b"];

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
      <div className="flex h-[220px] items-center justify-center text-sm text-muted sm:h-[280px]">
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
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #2b3139",
            background: "#1e2329",
            color: "#eaecef",
            fontSize: "12px",
          }}
          labelStyle={{ color: "#929aa5" }}
        />
        <Legend
          formatter={(value) => `${value}`}
          iconType="circle"
          iconSize={isMobile ? 6 : 8}
          wrapperStyle={{ fontSize: isMobile ? "11px" : "12px", color: "#929aa5" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
