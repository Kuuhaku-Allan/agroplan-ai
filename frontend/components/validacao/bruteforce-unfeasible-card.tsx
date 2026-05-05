import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Infinity, TrendingUp } from "lucide-react";

interface BruteforceUnfeasibleCardProps {
  totalCombinacoes: number;
}

export function BruteforceUnfeasibleCard({ totalCombinacoes }: BruteforceUnfeasibleCardProps) {
  // Formata número grande
  const formatLargeNumber = (num: number): string => {
    if (num >= 1_000_000_000_000) {
      return `${(num / 1_000_000_000_000).toFixed(1)} trilhões`;
    }
    if (num >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(1)} bilhões`;
    }
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)} milhões`;
    }
    return num.toLocaleString('pt-BR');
  };

  return (
    <Card className="bg-amber-900/20 border-amber-500/30 p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-amber-500/10 rounded-lg flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-semibold text-slate-50">
              Força Bruta Inviável
            </h3>
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500">
              <Infinity className="w-3 h-3 mr-1" />
              {formatLargeNumber(totalCombinacoes)} combinações
            </Badge>
          </div>

          <p className="text-slate-300 leading-relaxed mb-4">
            Com o conjunto atual de dados, existem{" "}
            <strong className="text-amber-400">{formatLargeNumber(totalCombinacoes)} combinações possíveis</strong>.
            Testar todas elas por força bruta seria computacionalmente inviável, levando anos ou até séculos
            para completar.
          </p>

          <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-slate-50 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Por que o Algoritmo Genético é necessário?
            </h4>
            <ul className="text-sm text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                <span>
                  <strong>Eficiência</strong>: Explora o espaço de soluções de forma inteligente,
                  sem precisar testar todas as combinações
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                <span>
                  <strong>Escalabilidade</strong>: Funciona bem mesmo com milhões ou bilhões de combinações
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                <span>
                  <strong>Qualidade</strong>: Encontra soluções de alta qualidade em tempo razoável
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-slate-300">
              <strong className="text-blue-400">Validação alternativa:</strong> Em vez de força bruta,
              use a análise de <strong>múltiplas rodadas</strong> para avaliar a estabilidade e
              consistência do Algoritmo Genético. Isso demonstra que o AG encontra soluções de
              qualidade de forma confiável.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
