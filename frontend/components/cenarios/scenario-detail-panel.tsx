import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Cenario } from "@/lib/types";
import { formatCurrencyBRL, formatPercent, formatArea } from "@/lib/formatters";
import { X, MapPin, Sprout, TrendingUp, AlertTriangle } from "lucide-react";

interface ScenarioDetailPanelProps {
  cenario: Cenario;
  onClose: () => void;
}

export function ScenarioDetailPanel({ cenario, onClose }: ScenarioDetailPanelProps) {
  const culturas = [...new Set(cenario.plano.map(p => p.cultura))];

  // Análise textual baseada no cenário
  const getAnalise = () => {
    if (cenario.nome.includes("Lucro") || cenario.nome.includes("Máximo")) {
      return "Este cenário prioriza o retorno financeiro máximo, selecionando as culturas mais lucrativas para cada talhão. Apresenta maior risco médio devido à busca agressiva por lucro, mas pode ser adequado para produtores com maior tolerância ao risco e capital de giro disponível.";
    }
    if (cenario.nome.includes("Risco") || cenario.nome.includes("Baixo")) {
      return "Este cenário prioriza a segurança, reduzindo a exposição ao risco através da seleção de culturas mais estáveis e previsíveis. O lucro esperado é menor, mas a variabilidade dos resultados também é reduzida, sendo ideal para produtores mais conservadores.";
    }
    if (cenario.nome.includes("Sustentável")) {
      return "Este cenário busca equilibrar produtividade com práticas sustentáveis, considerando a compatibilidade das culturas com o terreno e promovendo diversidade. É adequado para produtores que valorizam a saúde do solo e a sustentabilidade a longo prazo.";
    }
    if (cenario.nome.includes("Conservador")) {
      return "Este cenário adota uma abordagem cautelosa, priorizando culturas tradicionais e bem estabelecidas. Oferece previsibilidade e menor complexidade operacional, sendo adequado para produtores que preferem evitar inovações arriscadas.";
    }
    if (cenario.nome.includes("Genético") || cenario.nome.includes("AG")) {
      return "Este cenário foi otimizado pelo Algoritmo Genético, que considera simultaneamente múltiplos critérios: lucro, risco, compatibilidade do terreno e diversidade de culturas. O resultado é uma solução equilibrada que busca maximizar o retorno ajustado ao risco.";
    }
    return "Este cenário busca equilibrar lucro, risco e compatibilidade do terreno, oferecendo uma solução intermediária entre as estratégias mais agressivas e conservadoras.";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-slate-900/95 border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md border-b border-slate-700/70 p-6 flex items-center justify-between shadow-lg">
          <div>
            <h2 className="text-2xl font-bold text-slate-50">{cenario.nome}</h2>
            <p className="text-sm text-slate-400 mt-1">{cenario.descricao}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-50"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 pt-7 space-y-6">
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-emerald-900/20 border-emerald-500/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-slate-400">Lucro Total</span>
              </div>
              <p className="text-2xl font-bold text-emerald-500">
                {formatCurrencyBRL(cenario.lucro_total)}
              </p>
            </Card>

            <Card className="bg-red-900/20 border-red-500/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-slate-400">Risco Médio</span>
              </div>
              <p className="text-2xl font-bold text-red-500">
                {formatPercent(cenario.risco_medio)}
              </p>
            </Card>

            <Card className="bg-blue-900/20 border-blue-500/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-slate-400">Área Total</span>
              </div>
              <p className="text-2xl font-bold text-blue-500">
                {formatArea(cenario.area_total)}
              </p>
            </Card>
          </div>

          {/* Culturas Escolhidas */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sprout className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-semibold text-slate-50">Culturas Escolhidas</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {culturas.map((cultura, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                >
                  {cultura}
                </Badge>
              ))}
            </div>
          </div>

          {/* Análise */}
          <div>
            <h3 className="text-lg font-semibold text-slate-50 mb-3">Análise da Estratégia</h3>
            <p className="text-slate-300 leading-relaxed">
              {getAnalise()}
            </p>
          </div>

          {/* Plano por Talhão */}
          <div>
            <h3 className="text-lg font-semibold text-slate-50 mb-3">Plano por Talhão</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/50">
                    <TableHead className="text-slate-300">Talhão</TableHead>
                    <TableHead className="text-slate-300">Área</TableHead>
                    <TableHead className="text-slate-300">Solo</TableHead>
                    <TableHead className="text-slate-300">Cultura</TableHead>
                    <TableHead className="text-slate-300 text-right">Lucro</TableHead>
                    <TableHead className="text-slate-300 text-right">Risco</TableHead>
                    <TableHead className="text-slate-300 text-right">Nota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cenario.plano.map((item, idx) => (
                    <TableRow key={idx} className="border-slate-700/50">
                      <TableCell className="font-medium text-slate-50">
                        Talhão {item.talhao}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {formatArea(item.area)}
                      </TableCell>
                      <TableCell className="text-slate-300 capitalize">
                        {item.solo}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                        >
                          {item.cultura}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-emerald-500 font-semibold">
                        {formatCurrencyBRL(item.lucro_estimado)}
                      </TableCell>
                      <TableCell className="text-right text-red-500 font-semibold">
                        {formatPercent(item.risco)}
                      </TableCell>
                      <TableCell className="text-right text-blue-500 font-semibold">
                        {item.nota.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
