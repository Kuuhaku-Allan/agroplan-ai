import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyBRL, formatPercent, formatFitness } from "@/lib/formatters";
import { Dna, Search } from "lucide-react";
import { ValidationResultBadge } from "./validation-result-badge";

interface AGvsBruteforceCardProps {
  ag: {
    fitness: number;
    lucro_total: number;
    risco_medio: number;
    culturas: string[];
  };
  forcaBruta: {
    fitness: number;
    lucro_total: number;
    risco_medio: number;
    culturas: string[];
  };
  otimoGlobal: boolean;
}

export function AGvsBruteforceCard({ ag, forcaBruta, otimoGlobal }: AGvsBruteforceCardProps) {
  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-50">Comparação AG vs Força Bruta</h3>
        <ValidationResultBadge otimoGlobal={otimoGlobal} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Algoritmo Genético */}
        <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Dna className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-50">Algoritmo Genético</h4>
              <p className="text-xs text-slate-400">Otimização inteligente</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Fitness:</span>
              <span className="text-lg font-bold text-emerald-500">{formatFitness(ag.fitness)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Lucro Total:</span>
              <span className="text-sm font-semibold text-slate-50">{formatCurrencyBRL(ag.lucro_total)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Risco Médio:</span>
              <span className="text-sm font-semibold text-slate-50">{formatPercent(ag.risco_medio)}</span>
            </div>

            <div className="pt-3 border-t border-emerald-500/20">
              <span className="text-xs text-slate-400 block mb-2">Culturas Escolhidas:</span>
              <div className="flex flex-wrap gap-1">
                {ag.culturas.map((cultura, idx) => (
                  <Badge key={idx} variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs">
                    {cultura}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Força Bruta */}
        <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Search className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-50">Força Bruta</h4>
              <p className="text-xs text-slate-400">Busca exaustiva</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Fitness:</span>
              <span className="text-lg font-bold text-blue-500">{formatFitness(forcaBruta.fitness)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Lucro Total:</span>
              <span className="text-sm font-semibold text-slate-50">{formatCurrencyBRL(forcaBruta.lucro_total)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Risco Médio:</span>
              <span className="text-sm font-semibold text-slate-50">{formatPercent(forcaBruta.risco_medio)}</span>
            </div>

            <div className="pt-3 border-t border-blue-500/20">
              <span className="text-xs text-slate-400 block mb-2">Culturas Escolhidas:</span>
              <div className="flex flex-wrap gap-1">
                {forcaBruta.culturas.map((cultura, idx) => (
                  <Badge key={idx} variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-500 text-xs">
                    {cultura}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
