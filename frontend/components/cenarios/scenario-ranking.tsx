import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cenario } from "@/lib/types";
import { Trophy, TrendingUp, Shield, Scale, Leaf } from "lucide-react";
import { formatCurrencyCompactBRL, formatPercent } from "@/lib/formatters";

interface ScenarioRankingProps {
  cenarios: { [key: string]: Cenario };
}

export function ScenarioRanking({ cenarios }: ScenarioRankingProps) {
  // Encontra os melhores em cada categoria
  const entries = Object.entries(cenarios);
  
  const maiorLucro = entries.reduce((max, [key, c]) => 
    c.lucro_total > max[1].lucro_total ? [key, c] : max
  );
  
  const menorRisco = entries.reduce((min, [key, c]) => 
    c.risco_medio < min[1].risco_medio ? [key, c] : min
  );
  
  // Melhor equilíbrio: prioriza AG, depois equilibrado
  const melhorEquilibrio = entries.find(([key]) => key === "genetico") || 
                          entries.find(([key]) => key === "equilibrado") ||
                          entries[0];
  
  const maisSustentavel = entries.find(([key]) => key === "sustentavel") || entries[0];

  const rankings = [
    {
      title: "Maior Lucro",
      icon: TrendingUp,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      cenario: maiorLucro[1],
      value: formatCurrencyCompactBRL(maiorLucro[1].lucro_total),
      badge: "Máximo retorno"
    },
    {
      title: "Menor Risco",
      icon: Shield,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      cenario: menorRisco[1],
      value: formatPercent(menorRisco[1].risco_medio),
      badge: "Mais seguro"
    },
    {
      title: "Melhor Equilíbrio",
      icon: Scale,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      cenario: melhorEquilibrio[1],
      value: formatCurrencyCompactBRL(melhorEquilibrio[1].lucro_total),
      badge: "Otimizado"
    },
    {
      title: "Mais Sustentável",
      icon: Leaf,
      iconColor: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      cenario: maisSustentavel[1],
      value: formatCurrencyCompactBRL(maisSustentavel[1].lucro_total),
      badge: "Eco-friendly"
    }
  ];

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-yellow-500/10 rounded-lg">
          <Trophy className="w-5 h-5 text-yellow-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-50">Ranking de Cenários</h3>
          <p className="text-xs text-slate-400">Melhores em cada categoria</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {rankings.map((rank, idx) => {
          const Icon = rank.icon;
          return (
            <Card
              key={idx}
              className={`${rank.bgColor} ${rank.borderColor} p-4`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 ${rank.bgColor} rounded-lg`}>
                  <Icon className={`w-4 h-4 ${rank.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 font-medium">{rank.title}</p>
                  <Badge
                    variant="outline"
                    className="text-xs mt-1 border-slate-500/30 bg-slate-500/10 text-slate-300"
                  >
                    {rank.badge}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-50 truncate">
                  {rank.cenario.nome}
                </p>
                <p className={`text-lg font-bold ${rank.iconColor}`}>
                  {rank.value}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
}
