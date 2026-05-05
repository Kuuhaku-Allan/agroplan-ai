import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Zap } from "lucide-react";

export function ScalabilityExplanation() {
  return (
    <div className="space-y-6">
      {/* Por que validar */}
      <Card className="bg-slate-900/50 border-slate-800/50 p-6">
        <h3 className="text-lg font-semibold text-slate-50 mb-4">Por que validar com força bruta?</h3>
        
        <p className="text-slate-300 leading-relaxed mb-4">
          Em conjuntos pequenos, a força bruta consegue testar <strong className="text-emerald-500">todas as combinações possíveis</strong>. 
          Isso permite verificar se o Algoritmo Genético encontrou a mesma melhor solução.
        </p>

        <p className="text-slate-300 leading-relaxed">
          Em conjuntos maiores, o número de combinações cresce <strong className="text-amber-500">exponencialmente</strong>, 
          tornando a força bruta inviável e justificando o uso do Algoritmo Genético.
        </p>
      </Card>

      {/* Exemplos de escalabilidade */}
      <Card className="bg-slate-900/50 border-slate-800/50 p-6">
        <h3 className="text-lg font-semibold text-slate-50 mb-4">Escalabilidade do Problema</h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-500 mb-1">5 culturas × 3 talhões</p>
              <p className="text-sm text-slate-300">
                5³ = <strong>125 combinações</strong>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                ✅ Força bruta viável (~1 segundo)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-900/10 border border-amber-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-500 mb-1">8 culturas × 10 talhões</p>
              <p className="text-sm text-slate-300">
                8¹⁰ = <strong>1.073.741.824 combinações</strong>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                ⚠️ Força bruta inviável (~dias de processamento)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-red-900/10 border border-red-500/20 rounded-lg">
            <Zap className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-500 mb-1">10 culturas × 20 talhões</p>
              <p className="text-sm text-slate-300">
                10²⁰ = <strong>100.000.000.000.000.000.000 combinações</strong>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                ❌ Força bruta impossível (mais que átomos no universo)
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-sm text-slate-400">
            O Algoritmo Genético encontra soluções de alta qualidade em tempo viável, 
            mesmo quando a força bruta se torna impraticável.
          </p>
        </div>
      </Card>

      {/* Conclusão */}
      <Card className="bg-emerald-900/10 border-emerald-500/20 p-6">
        <h3 className="text-lg font-semibold text-emerald-500 mb-3">Conclusão da Validação</h3>
        
        <p className="text-slate-300 leading-relaxed mb-3">
          O Algoritmo Genético encontrou o mesmo resultado da busca exaustiva, 
          indicando que a <strong className="text-emerald-500">otimização está funcionando corretamente</strong> neste conjunto de dados.
        </p>

        <p className="text-slate-300 leading-relaxed">
          As múltiplas execuções apresentaram baixa variação de fitness, 
          indicando <strong className="text-emerald-500">comportamento estável</strong> e reproduzível.
        </p>
      </Card>
    </div>
  );
}
