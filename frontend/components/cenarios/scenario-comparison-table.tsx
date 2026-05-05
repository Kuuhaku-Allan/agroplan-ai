import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Cenario } from "@/lib/types";
import { formatCurrencyBRL, formatPercent } from "@/lib/formatters";
import { BarChart3 } from "lucide-react";

interface ScenarioComparisonTableProps {
  cenarios: { [key: string]: Cenario };
}

const scenarioProfiles: Record<string, { badge: string; color: string; obs: string }> = {
  equilibrado: {
    badge: "Recomendado",
    color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
    obs: "Melhor equilíbrio geral"
  },
  lucro: {
    badge: "Agressivo",
    color: "border-amber-500/30 bg-amber-500/10 text-amber-500",
    obs: "Maior retorno, maior risco"
  },
  risco: {
    badge: "Seguro",
    color: "border-blue-500/30 bg-blue-500/10 text-blue-500",
    obs: "Menor exposição ao risco"
  },
  sustentavel: {
    badge: "Sustentável",
    color: "border-green-500/30 bg-green-500/10 text-green-500",
    obs: "Foco em sustentabilidade"
  },
  conservador: {
    badge: "Conservador",
    color: "border-slate-500/30 bg-slate-500/10 text-slate-400",
    obs: "Abordagem cautelosa"
  },
  genetico: {
    badge: "Otimizado",
    color: "border-purple-500/30 bg-purple-500/10 text-purple-500",
    obs: "Otimização inteligente"
  }
};

export function ScenarioComparisonTable({ cenarios }: ScenarioComparisonTableProps) {
  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <BarChart3 className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-50">Tabela Comparativa</h3>
          <p className="text-xs text-slate-400">Análise detalhada de todos os cenários</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700/50 hover:bg-slate-800/30">
              <TableHead className="text-slate-300">Cenário</TableHead>
              <TableHead className="text-slate-300 text-right">Lucro Total</TableHead>
              <TableHead className="text-slate-300 text-right">Risco Médio</TableHead>
              <TableHead className="text-slate-300">Culturas</TableHead>
              <TableHead className="text-slate-300">Perfil</TableHead>
              <TableHead className="text-slate-300">Observação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(cenarios).map(([key, cenario]) => {
              const profile = scenarioProfiles[key] || scenarioProfiles.equilibrado;
              const culturas = [...new Set(cenario.plano.map(p => p.cultura))];

              return (
                <TableRow key={key} className="border-slate-700/50 hover:bg-slate-800/30">
                  <TableCell className="font-medium text-slate-50">
                    {cenario.nome}
                  </TableCell>
                  <TableCell className="text-right text-emerald-500 font-semibold">
                    {formatCurrencyBRL(cenario.lucro_total)}
                  </TableCell>
                  <TableCell className="text-right text-red-500 font-semibold">
                    {formatPercent(cenario.risco_medio)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {culturas.slice(0, 3).map((cultura, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="border-slate-600/30 bg-slate-700/20 text-slate-300 text-xs"
                        >
                          {cultura}
                        </Badge>
                      ))}
                      {culturas.length > 3 && (
                        <Badge
                          variant="outline"
                          className="border-slate-600/30 bg-slate-700/20 text-slate-400 text-xs"
                        >
                          +{culturas.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${profile.color}`}>
                      {profile.badge}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-400">
                    {profile.obs}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
