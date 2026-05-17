import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Brain, Target, Infinity } from "lucide-react";
import { formatLargeNumber } from "@/lib/formatters";

interface DecisionSummaryProps {
  objetivo: string;
  validacao: {
    otimo_global: boolean;
    total_combinacoes: number;
  };
  showGuidedExplanations?: boolean;
}

export function DecisionSummary({
  objetivo,
  validacao,
  showGuidedExplanations = true,
}: DecisionSummaryProps) {
  const forcaBrutaInviavel = validacao.total_combinacoes > 10000;
  
  return (
    <Card className="bg-slate-900/50 border-emerald-500/20 p-6 relative overflow-hidden">
      {/* Gradiente de fundo sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
      
      <div className="relative">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Brain className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-slate-50">Decisão Recomendada</h3>
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                Plano Otimizado
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Baseada em Algoritmo Genético
            </p>
          </div>
        </div>

        {showGuidedExplanations && (
          <p className="text-slate-300 leading-relaxed mb-4">
            O AgroPlan AI recomenda o plano otimizado pelo <strong className="text-emerald-500">Algoritmo Genético</strong> por
            apresentar melhor equilíbrio entre lucro, risco, compatibilidade do terreno e diversidade de culturas.
          </p>
        )}

        {/* Badges de informação */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">Objetivo:</span>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
              {objetivo.charAt(0).toUpperCase() + objetivo.slice(1)}
            </Badge>
          </div>

          {forcaBrutaInviavel ? (
            <>
              <div className="flex items-center gap-2">
                <Infinity className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-500 font-medium">
                  Força bruta inviável
                </span>
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs">
                  {formatLargeNumber(validacao.total_combinacoes)} combinações
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-emerald-500 font-medium">
                  Validado por múltiplas rodadas
                </span>
              </div>
            </>
          ) : (
            <>
              {validacao.otimo_global && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-emerald-500 font-medium">
                    Ótimo global encontrado
                  </span>
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs">
                    Validado
                  </Badge>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>Força bruta:</span>
                <Badge variant="outline" className="border-slate-700 bg-slate-800/50 text-slate-300">
                  {validacao.total_combinacoes} combinações testadas
                </Badge>
              </div>
            </>
          )}
        </div>

        {/* Nota de rodapé */}
        {showGuidedExplanations && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <p className="text-xs text-slate-500">
              Este plano considera múltiplos objetivos e aplica penalidades agronômicas para evitar
              soluções inadequadas como monocultura ou incompatibilidade de solo.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
