import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, Zap, CheckCircle2 } from "lucide-react";

interface GeneticExplanationProps {
  objetivo: string;
  geracoes?: number;
  justificativa?: string;
}

export function GeneticExplanation({ objetivo, geracoes, justificativa }: GeneticExplanationProps) {
  return (
    <div className="space-y-6">
      {/* Justificativa */}
      <Card className="bg-slate-900/50 border-emerald-500/20 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
        
        <div className="relative">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Brain className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-50">Justificativa da Otimização</h3>
              <p className="text-sm text-slate-400 mt-1">
                Resultado do Algoritmo Genético
              </p>
            </div>
          </div>

          <p className="text-slate-300 leading-relaxed mb-4">
            {justificativa || "O Algoritmo Genético avaliou diferentes combinações possíveis de culturas e selecionou o plano com melhor equilíbrio conforme o objetivo escolhido."}
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">Objetivo:</span>
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                {objetivo.charAt(0).toUpperCase() + objetivo.slice(1)}
              </Badge>
            </div>

            {geracoes && (
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Gerações processadas:</span>
                <Badge variant="outline" className="border-slate-700 bg-slate-800/50 text-slate-300">
                  {geracoes}
                </Badge>
              </div>
            )}

            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-emerald-500 font-medium">
                Solução otimizada encontrada
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Como o AG decide */}
      <Card className="bg-slate-900/50 border-slate-800/50 p-6">
        <h3 className="text-lg font-semibold text-slate-50 mb-4">Como o AG Decide?</h3>
        
        <div className="space-y-3 text-sm text-slate-300">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-semibold text-xs">
              1
            </div>
            <p>Cada solução representa uma combinação de culturas nos talhões</p>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-semibold text-xs">
              2
            </div>
            <p>O algoritmo gera uma população inicial de soluções aleatórias</p>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-semibold text-xs">
              3
            </div>
            <p>As melhores soluções são selecionadas com base no fitness</p>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-semibold text-xs">
              4
            </div>
            <p>Cruzamento e mutação criam novas combinações promissoras</p>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-semibold text-xs">
              5
            </div>
            <p>A função fitness avalia lucro, risco, compatibilidade e diversidade</p>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-semibold text-xs">
              6
            </div>
            <p>O processo se repete até encontrar uma solução otimizada</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-xs text-slate-500">
            O AG aplica penalidades para evitar monocultura, incompatibilidade de solo e outros problemas agronômicos.
          </p>
        </div>
      </Card>
    </div>
  );
}
