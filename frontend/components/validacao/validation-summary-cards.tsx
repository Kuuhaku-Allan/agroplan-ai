import { Card } from "@/components/ui/card";
import { CheckCircle2, Hash, TrendingUp, Activity } from "lucide-react";
import { formatFitness, formatCurrencyCompactBRL } from "@/lib/formatters";

interface ValidationSummaryCardsProps {
  totalCombinacoes: number;
  fitnessAG: number;
  fitnessFB: number;
  otimoGlobal: boolean;
  diferencaFitness: number;
  diferencaLucro: number;
}

export function ValidationSummaryCards({
  totalCombinacoes,
  fitnessAG,
  fitnessFB,
  otimoGlobal,
  diferencaFitness,
  diferencaLucro
}: ValidationSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-400 font-medium">Combinações Testadas</p>
            <p className="text-3xl font-bold text-slate-50 mt-2">{totalCombinacoes}</p>
            <p className="text-xs text-slate-500 mt-1">Força bruta completa</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-500/10 flex-shrink-0">
            <Hash className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-400 font-medium">Fitness AG</p>
            <p className="text-3xl font-bold text-emerald-500 mt-2">{formatFitness(fitnessAG)}</p>
            <p className="text-xs text-slate-500 mt-1">Algoritmo Genético</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 flex-shrink-0">
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-400 font-medium">Fitness Força Bruta</p>
            <p className="text-3xl font-bold text-blue-500 mt-2">{formatFitness(fitnessFB)}</p>
            <p className="text-xs text-slate-500 mt-1">Busca exaustiva</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 flex-shrink-0">
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </Card>

      <Card className={`p-5 ${otimoGlobal ? "bg-emerald-900/20 border-emerald-500/30" : "bg-amber-900/20 border-amber-500/30"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-400 font-medium">Status</p>
            <p className={`text-2xl font-bold mt-2 ${otimoGlobal ? "text-emerald-500" : "text-amber-500"}`}>
              {otimoGlobal ? "Ótimo Global" : "Subótimo"}
            </p>
            <p className="text-xs text-slate-500 mt-1">{otimoGlobal ? "AG = Força Bruta" : "AG ≈ Força Bruta"}</p>
          </div>
          <div className={`p-3 rounded-lg flex-shrink-0 ${otimoGlobal ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
            <CheckCircle2 className={`w-5 h-5 ${otimoGlobal ? "text-emerald-500" : "text-amber-500"}`} />
          </div>
        </div>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-400 font-medium">Diferença Fitness</p>
            <p className="text-3xl font-bold text-slate-50 mt-2">{formatFitness(Math.abs(diferencaFitness))}</p>
            <p className="text-xs text-slate-500 mt-1">{diferencaFitness === 0 ? "Idênticos" : "Diferença absoluta"}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-500/10 flex-shrink-0">
            <Activity className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800/50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-400 font-medium">Diferença Lucro</p>
            <p className="text-2xl font-bold text-slate-50 mt-2 whitespace-nowrap overflow-hidden text-ellipsis">
              {formatCurrencyCompactBRL(Math.abs(diferencaLucro))}
            </p>
            <p className="text-xs text-slate-500 mt-1">{diferencaLucro === 0 ? "Idênticos" : "Diferença absoluta"}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-500/10 flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </Card>
    </div>
  );
}
