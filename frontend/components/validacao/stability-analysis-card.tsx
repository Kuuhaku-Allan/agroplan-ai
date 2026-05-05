import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatFitness } from "@/lib/formatters";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StabilityAnalysisCardProps {
  rodadas: number;
  melhorFitness: number;
  fitnessMedio: number;
  piorFitness: number;
  desvioPadrao: number;
  coeficienteVariacao: number;
}

export function StabilityAnalysisCard({
  rodadas,
  melhorFitness,
  fitnessMedio,
  piorFitness,
  desvioPadrao,
  coeficienteVariacao
}: StabilityAnalysisCardProps) {
  // Classificação de estabilidade
  const getEstabilidade = (cv: number) => {
    if (cv < 1) return { nivel: "Alta", cor: "emerald", icon: TrendingUp };
    if (cv < 5) return { nivel: "Média", cor: "amber", icon: Minus };
    return { nivel: "Baixa", cor: "red", icon: TrendingDown };
  };

  const estabilidade = getEstabilidade(coeficienteVariacao);
  const EstabilidadeIcon = estabilidade.icon;

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-50">Análise de Estabilidade</h3>
        <Badge 
          variant="outline" 
          className={`
            ${estabilidade.cor === "emerald" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" : ""}
            ${estabilidade.cor === "amber" ? "border-amber-500/30 bg-amber-500/10 text-amber-500" : ""}
            ${estabilidade.cor === "red" ? "border-red-500/30 bg-red-500/10 text-red-500" : ""}
          `}
        >
          <EstabilidadeIcon className="w-3 h-3 mr-1" />
          Estabilidade {estabilidade.nivel}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Rodadas</span>
          </div>
          <p className="text-2xl font-bold text-slate-50">{rodadas}</p>
        </div>

        <div className="bg-slate-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-slate-400">Melhor</span>
          </div>
          <p className="text-2xl font-bold text-emerald-500">{formatFitness(melhorFitness)}</p>
        </div>

        <div className="bg-slate-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-slate-400">Médio</span>
          </div>
          <p className="text-2xl font-bold text-blue-500">{formatFitness(fitnessMedio)}</p>
        </div>

        <div className="bg-slate-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-xs text-slate-400">Pior</span>
          </div>
          <p className="text-2xl font-bold text-red-500">{formatFitness(piorFitness)}</p>
        </div>

        <div className="bg-slate-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Desvio Padrão</span>
          </div>
          <p className="text-2xl font-bold text-slate-50">{desvioPadrao.toFixed(2)}</p>
        </div>

        <div className="bg-slate-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">CV (%)</span>
          </div>
          <p className={`text-2xl font-bold ${
            coeficienteVariacao < 1 ? "text-emerald-500" :
            coeficienteVariacao < 5 ? "text-amber-500" : "text-red-500"
          }`}>
            {coeficienteVariacao.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <p className="text-sm text-slate-300">
          {coeficienteVariacao < 1 && (
            <>
              <strong className="text-emerald-500">Excelente!</strong> O algoritmo apresenta comportamento muito estável, 
              com baixa variação entre execuções.
            </>
          )}
          {coeficienteVariacao >= 1 && coeficienteVariacao < 5 && (
            <>
              <strong className="text-amber-500">Bom.</strong> O algoritmo apresenta variação moderada entre execuções, 
              mas ainda dentro de limites aceitáveis.
            </>
          )}
          {coeficienteVariacao >= 5 && (
            <>
              <strong className="text-red-500">Atenção.</strong> O algoritmo apresenta alta variação entre execuções. 
              Considere ajustar os parâmetros.
            </>
          )}
        </p>
      </div>
    </Card>
  );
}
