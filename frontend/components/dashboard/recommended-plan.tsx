import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlanoItem } from "@/lib/types";
import { formatCurrencyBRL, formatPercent, formatArea, normalizeCompatibility, clampPercent } from "@/lib/formatters";
import { Sprout, TrendingUp, AlertTriangle } from "lucide-react";

interface RecommendedPlanProps {
  plano: PlanoItem[];
}

const culturaColors: Record<string, string> = {
  soja: "bg-green-500/10 text-green-500 border-green-500/30",
  milho: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  feijao: "bg-red-500/10 text-red-500 border-red-500/30",
  trigo: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  algodao: "bg-blue-500/10 text-blue-500 border-blue-500/30",
};

export function RecommendedPlan({ plano }: RecommendedPlanProps) {
  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <h3 className="text-lg font-semibold text-slate-50 mb-4">Plano Recomendado</h3>
      
      <div className="space-y-4">
        {plano.map((item) => {
          // Normaliza e limita a compatibilidade
          const compatibilityPercent = clampPercent(normalizeCompatibility(item.nota));
          
          return (
            <div 
              key={item.talhao}
              className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/50 transition-all duration-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-base font-semibold text-slate-50">
                    Talhão {item.talhao}
                  </h4>
                  <p className="text-sm text-slate-400 mt-1">
                    {formatArea(item.area)} • {item.solo}
                  </p>
                </div>
                
                <Badge 
                  variant="outline" 
                  className={culturaColors[item.cultura.toLowerCase()] || "bg-slate-500/10 text-slate-500 border-slate-500/30"}
                >
                  <Sprout className="w-3 h-3 mr-1" />
                  {item.cultura}
                </Badge>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="text-xs text-slate-400">Lucro</p>
                    <p className="text-sm font-semibold text-slate-50">
                      {formatCurrencyBRL(item.lucro_estimado)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-xs text-slate-400">Risco</p>
                    <p className="text-sm font-semibold text-slate-50">
                      {formatPercent(item.risco)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nota de compatibilidade */}
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Compatibilidade</span>
                  <span className="text-xs font-semibold text-emerald-500">
                    {compatibilityPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700/30 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${compatibilityPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
