"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Cenario } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChartTooltip } from "@/components/shared/chart-tooltip";
import { Shield } from "lucide-react";

interface ScenarioRiskChartProps {
  cenarios: { [key: string]: Cenario };
}

const scenarioLabels: Record<string, string> = {
  equilibrado: "Equil.",
  lucro: "Lucro",
  risco: "Risco",
  sustentavel: "Sust.",
  conservador: "Cons.",
  genetico: "AG"
};

const scenarioColors: Record<string, string> = {
  risco: "#3b82f6",
  conservador: "#64748b",
  lucro: "#ef4444",
  genetico: "#a855f7",
  equilibrado: "#10b981",
  sustentavel: "#22c55e"
};

export function ScenarioRiskChart({ cenarios }: ScenarioRiskChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = Object.entries(cenarios).map(([key, cenario]) => ({
    key,
    name: scenarioLabels[key] || key,
    fullName: cenario.nome,
    risco: cenario.risco_medio,
    fill: scenarioColors[key] || "#64748b"
  }));

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-red-500/10 rounded-lg">
          <Shield className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-50">Risco por Cenário</h3>
          <p className="text-xs text-slate-400">Comparação de exposição ao risco</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" />
          <XAxis 
            dataKey="name" 
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />
          <YAxis 
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickFormatter={(value) => `${value.toFixed(0)}%`}
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
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill}
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
