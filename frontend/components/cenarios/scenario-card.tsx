import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cenario } from "@/lib/types";
import { formatCurrencyCompactBRL, formatPercent } from "@/lib/formatters";
import { 
  TrendingUp, 
  Shield, 
  Scale, 
  Leaf, 
  Brain, 
  Sparkles 
} from "lucide-react";

interface ScenarioCardProps {
  id: string;
  cenario: Cenario;
  onClick: () => void;
  isSelected: boolean;
}

const scenarioConfig: Record<string, {
  badge: string;
  badgeColor: string;
  icon: any;
  iconColor: string;
  borderColor: string;
}> = {
  equilibrado: {
    badge: "Recomendado",
    badgeColor: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
    icon: Scale,
    iconColor: "text-emerald-500",
    borderColor: "border-emerald-500/30"
  },
  lucro: {
    badge: "Agressivo",
    badgeColor: "border-amber-500/30 bg-amber-500/10 text-amber-500",
    icon: TrendingUp,
    iconColor: "text-amber-500",
    borderColor: "border-amber-500/30"
  },
  risco: {
    badge: "Seguro",
    badgeColor: "border-blue-500/30 bg-blue-500/10 text-blue-500",
    icon: Shield,
    iconColor: "text-blue-500",
    borderColor: "border-blue-500/30"
  },
  sustentavel: {
    badge: "Sustentável",
    badgeColor: "border-green-500/30 bg-green-500/10 text-green-500",
    icon: Leaf,
    iconColor: "text-green-500",
    borderColor: "border-green-500/30"
  },
  conservador: {
    badge: "Conservador",
    badgeColor: "border-slate-500/30 bg-slate-500/10 text-slate-400",
    icon: Shield,
    iconColor: "text-slate-400",
    borderColor: "border-slate-500/30"
  },
  genetico: {
    badge: "Otimizado",
    badgeColor: "border-purple-500/30 bg-purple-500/10 text-purple-500",
    icon: Brain,
    iconColor: "text-purple-500",
    borderColor: "border-purple-500/30"
  }
};

export function ScenarioCard({ id, cenario, onClick, isSelected }: ScenarioCardProps) {
  const config = scenarioConfig[id] || scenarioConfig.equilibrado;
  const Icon = config.icon;

  // Extrai culturas únicas
  const culturas = [...new Set(cenario.plano.map(p => p.cultura))];

  return (
    <Card
      className={`
        bg-slate-900/50 border-slate-800/50 p-5 cursor-pointer
        transition-all duration-200 hover:bg-slate-800/50
        ${isSelected ? `ring-2 ring-offset-2 ring-offset-slate-950 ${config.borderColor.replace('border-', 'ring-')}` : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg bg-slate-800/50`}>
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-50">{cenario.nome}</h3>
            <Badge variant="outline" className={`text-xs mt-1 ${config.badgeColor}`}>
              {config.badge}
            </Badge>
          </div>
        </div>
        {id === "genetico" && (
          <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
        )}
      </div>

      <p className="text-xs text-slate-400 mb-4 line-clamp-2">
        {cenario.descricao}
      </p>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Lucro Total:</span>
          <span className="text-lg font-bold text-emerald-500">
            {formatCurrencyCompactBRL(cenario.lucro_total)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Risco Médio:</span>
          <span className="text-lg font-bold text-red-500">
            {formatPercent(cenario.risco_medio)}
          </span>
        </div>

        <div className="pt-3 border-t border-slate-700/50">
          <span className="text-xs text-slate-400 block mb-2">Culturas:</span>
          <div className="flex flex-wrap gap-1">
            {culturas.map((cultura, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="border-slate-600/30 bg-slate-700/20 text-slate-300 text-xs"
              >
                {cultura}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
