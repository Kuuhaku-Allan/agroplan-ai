import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, Gauge, Sprout, Target } from "lucide-react";
import { formatCurrencyCompactBRL, formatCurrencyBRL, formatPercent, formatFitness } from "@/lib/formatters";
import { ResultadoOtimizacao } from "@/lib/types";

interface GeneticResultSummaryProps {
  resultado: ResultadoOtimizacao;
}

export function GeneticResultSummary({ resultado }: GeneticResultSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-400 font-medium">Fitness</p>
            <p className="text-3xl font-bold text-emerald-500 mt-2">{formatFitness(resultado.fitness)}</p>
            <p className="text-xs text-slate-500 mt-1">Pontuação normalizada</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 flex-shrink-0">
            <Gauge className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-400 font-medium">Lucro Total</p>
            <p className="text-2xl font-bold text-amber-500 mt-2 whitespace-nowrap overflow-hidden text-ellipsis">
              {formatCurrencyCompactBRL(resultado.lucro_total)}
            </p>
            <p className="text-xs text-slate-500 mt-1">{formatCurrencyBRL(resultado.lucro_total)}</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
        </div>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-400 font-medium">Risco Médio</p>
            <p className="text-3xl font-bold text-red-500 mt-2">{formatPercent(resultado.risco_medio)}</p>
            <p className="text-xs text-slate-500 mt-1">Ponderado por área</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
        </div>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-400 font-medium">Diversidade</p>
            <p className="text-3xl font-bold text-green-500 mt-2">{resultado.diversidade}</p>
            <p className="text-xs text-slate-500 mt-1">{resultado.diversidade} culturas</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 flex-shrink-0">
            <Sprout className="w-5 h-5 text-green-500" />
          </div>
        </div>
      </Card>
    </div>
  );
}
