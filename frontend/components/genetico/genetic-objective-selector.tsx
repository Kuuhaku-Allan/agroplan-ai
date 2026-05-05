"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dna, Loader2 } from "lucide-react";
import { useState } from "react";

interface GeneticObjectiveSelectorProps {
  onExecute: (objetivo: string, seed: number) => void;
  loading: boolean;
}

const objetivos = [
  {
    id: "equilibrado",
    nome: "Equilibrado",
    descricao: "Melhor equilíbrio entre lucro, risco e compatibilidade",
    color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
  },
  {
    id: "lucro",
    nome: "Máximo Lucro",
    descricao: "Prioriza o maior retorno financeiro",
    color: "border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
  },
  {
    id: "risco",
    nome: "Baixo Risco",
    descricao: "Minimiza a exposição a perdas",
    color: "border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20"
  },
  {
    id: "sustentavel",
    nome: "Sustentável",
    descricao: "Prioriza compatibilidade ambiental",
    color: "border-green-500/30 bg-green-500/10 text-green-500 hover:bg-green-500/20"
  }
];

export function GeneticObjectiveSelector({ onExecute, loading }: GeneticObjectiveSelectorProps) {
  const [selectedObjective, setSelectedObjective] = useState("equilibrado");
  const [seed, setSeed] = useState(42);

  const handleExecute = () => {
    onExecute(selectedObjective, seed);
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <h3 className="text-lg font-semibold text-slate-50 mb-4">Configuração da Otimização</h3>
      
      {/* Seletor de Objetivo */}
      <div className="mb-6">
        <label className="text-sm font-medium text-slate-300 mb-3 block">
          Objetivo da Otimização
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {objetivos.map((obj) => (
            <button
              key={obj.id}
              onClick={() => setSelectedObjective(obj.id)}
              disabled={loading}
              className={`
                p-4 rounded-lg border-2 text-left transition-all duration-200
                ${selectedObjective === obj.id ? obj.color : "border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600"}
                ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <div className="font-semibold mb-1">{obj.nome}</div>
              <div className="text-xs opacity-80">{obj.descricao}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Seed */}
      <div className="mb-6">
        <label className="text-sm font-medium text-slate-300 mb-2 block">
          Seed (Opcional)
        </label>
        <input
          type="number"
          value={seed}
          onChange={(e) => setSeed(Number(e.target.value))}
          disabled={loading}
          placeholder="42"
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
        />
        <p className="text-xs text-slate-500 mt-1">
          Use uma seed para reproduzir o mesmo resultado
        </p>
      </div>

      {/* Botão Executar */}
      <Button
        onClick={handleExecute}
        disabled={loading}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-6 text-base"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Executando Otimização...
          </>
        ) : (
          <>
            <Dna className="w-5 h-5 mr-2" />
            Executar Otimização
          </>
        )}
      </Button>
    </Card>
  );
}
