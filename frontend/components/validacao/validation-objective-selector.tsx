"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Zap } from "lucide-react";
import { useState } from "react";

interface ValidationObjectiveSelectorProps {
  onValidate: (objetivo: string) => void;
  onExecuteRodadas: (objetivo: string, rodadas: number) => void;
  loading: boolean;
}

const objetivos = [
  { id: "equilibrado", nome: "Equilibrado" },
  { id: "lucro", nome: "Máximo Lucro" },
  { id: "risco", nome: "Baixo Risco" },
  { id: "sustentavel", nome: "Sustentável" }
];

export function ValidationObjectiveSelector({ onValidate, onExecuteRodadas, loading }: ValidationObjectiveSelectorProps) {
  const [selectedObjective, setSelectedObjective] = useState("equilibrado");
  const [numRodadas, setNumRodadas] = useState(10);

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <h3 className="text-lg font-semibold text-slate-50 mb-4">Configuração da Validação</h3>
      
      {/* Seletor de Objetivo */}
      <div className="mb-6">
        <label className="text-sm font-medium text-slate-300 mb-3 block">
          Objetivo da Validação
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {objetivos.map((obj) => (
            <button
              key={obj.id}
              onClick={() => setSelectedObjective(obj.id)}
              disabled={loading}
              className={`
                p-3 rounded-lg border-2 text-center transition-all duration-200 font-medium
                ${selectedObjective === obj.id 
                  ? "border-blue-500 bg-blue-500/10 text-blue-500" 
                  : "border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600"}
                ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {obj.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Número de Rodadas */}
      <div className="mb-6">
        <label className="text-sm font-medium text-slate-300 mb-2 block">
          Número de Rodadas (para análise de estabilidade)
        </label>
        <input
          type="number"
          value={numRodadas}
          onChange={(e) => setNumRodadas(Math.max(3, Math.min(50, Number(e.target.value))))}
          disabled={loading}
          min={3}
          max={50}
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
        />
        <p className="text-xs text-slate-500 mt-1">
          Mínimo: 3 | Máximo: 50 | Padrão: 10
        </p>
      </div>

      {/* Botões */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          onClick={() => onValidate(selectedObjective)}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-6"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Validando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Validar com Força Bruta
            </>
          )}
        </Button>

        <Button
          onClick={() => onExecuteRodadas(selectedObjective, numRodadas)}
          disabled={loading}
          variant="outline"
          className="w-full border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-semibold py-6"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Executando...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Executar Rodadas
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
