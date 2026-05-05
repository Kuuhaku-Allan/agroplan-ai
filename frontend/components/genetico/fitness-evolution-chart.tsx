"use client";

import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface FitnessEvolutionChartProps {
  historico?: Array<{
    geracao: number;
    melhor_fitness: number;
    fitness_medio: number;
  }>;
}

function CustomLineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-950/95 px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="text-sm font-semibold text-slate-100 mb-2">
        Geração {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
          {entry.name}: {Number(entry.value).toFixed(2)}
        </p>
      ))}
    </div>
  );
}

export function FitnessEvolutionChart({ historico }: FitnessEvolutionChartProps) {
  if (!historico || historico.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800/50 p-6">
        <h3 className="text-lg font-semibold text-slate-50 mb-4">Evolução do Fitness</h3>
        <div className="flex items-center justify-center h-64 text-slate-400">
          <p className="text-sm">Histórico de evolução não disponível para esta execução</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <h3 className="text-lg font-semibold text-slate-50 mb-4">Evolução do Fitness</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={historico}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" />
          <XAxis 
            dataKey="geracao" 
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            label={{ value: 'Geração', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
          />
          <YAxis 
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            label={{ value: 'Fitness', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
          />
          <Tooltip content={<CustomLineTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line 
            type="monotone"
            dataKey="melhor_fitness" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Melhor Fitness"
            dot={{ fill: '#10b981', r: 3 }}
            activeDot={{ r: 5, fill: '#10b981' }}
          />
          <Line 
            type="monotone"
            dataKey="fitness_medio" 
            stroke="#64748b" 
            strokeWidth={2}
            name="Fitness Médio"
            dot={{ fill: '#64748b', r: 3 }}
            strokeDasharray="5 5"
            activeDot={{ r: 5, fill: '#64748b' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
