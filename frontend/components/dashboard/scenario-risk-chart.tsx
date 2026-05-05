"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChartTooltip } from "@/components/shared/chart-tooltip";

interface ScenarioRiskChartProps {
  data: Array<{
    nome: string;
    risco_medio: number;
  }>;
}

const nomesCurtos: Record<string, string> = {
  "Equilibrado": "Equil.",
  "Máximo Lucro": "Lucro",
  "Baixo Risco": "Risco",
  "Sustentável": "Sust.",
  "Conservador": "Cons.",
  "Algoritmo Genético": "AG"
};

export function ScenarioRiskChart({ data }: ScenarioRiskChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = data.map(item => ({
    name: nomesCurtos[item.nome] || item.nome,
    fullName: item.nome,
    risco: item.risco_medio,
  }));

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <h3 className="text-lg font-semibold text-slate-50 mb-4">Risco por Cenário</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" />
          <XAxis 
            dataKey="name" 
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            cursor={{ fill: "rgba(15, 23, 42, 0.35)" }}
            content={(props) => <ChartTooltip {...props} type="percent" valueLabel="Risco" />}
          />
          <Bar 
            dataKey="risco" 
            radius={[8, 8, 0, 0]}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill="#ef4444"
                opacity={activeIndex === null || activeIndex === index ? 1 : 0.55}
                stroke="none"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
