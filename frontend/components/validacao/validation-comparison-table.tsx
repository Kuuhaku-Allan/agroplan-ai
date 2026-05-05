import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyBRL, formatPercent, formatFitness } from "@/lib/formatters";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface ValidationComparisonTableProps {
  ag: {
    fitness: number;
    lucro_total: number;
    risco_medio: number;
  };
  forcaBruta: {
    fitness: number;
    lucro_total: number;
    risco_medio: number;
  };
  diferencaFitness: number;
  diferencaLucro: number;
  otimoGlobal: boolean;
}

export function ValidationComparisonTable({
  ag,
  forcaBruta,
  diferencaFitness,
  diferencaLucro,
  otimoGlobal
}: ValidationComparisonTableProps) {
  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-6">
      <h3 className="text-lg font-semibold text-slate-50 mb-4">Tabela Comparativa</h3>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-slate-800/50">
              <TableHead className="text-slate-300">Método</TableHead>
              <TableHead className="text-slate-300 text-right">Fitness</TableHead>
              <TableHead className="text-slate-300 text-right">Lucro Total</TableHead>
              <TableHead className="text-slate-300 text-right">Risco Médio</TableHead>
              <TableHead className="text-slate-300 text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="border-slate-700 hover:bg-slate-800/30">
              <TableCell className="font-medium text-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Algoritmo Genético
                </div>
              </TableCell>
              <TableCell className="text-right text-emerald-500 font-semibold">
                {formatFitness(ag.fitness)}
              </TableCell>
              <TableCell className="text-right text-slate-50">
                {formatCurrencyBRL(ag.lucro_total)}
              </TableCell>
              <TableCell className="text-right text-slate-50">
                {formatPercent(ag.risco_medio)}
              </TableCell>
              <TableCell className="text-center">
                {otimoGlobal ? (
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Ótimo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Subótimo
                  </Badge>
                )}
              </TableCell>
            </TableRow>

            <TableRow className="border-slate-700 hover:bg-slate-800/30">
              <TableCell className="font-medium text-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Força Bruta
                </div>
              </TableCell>
              <TableCell className="text-right text-blue-500 font-semibold">
                {formatFitness(forcaBruta.fitness)}
              </TableCell>
              <TableCell className="text-right text-slate-50">
                {formatCurrencyBRL(forcaBruta.lucro_total)}
              </TableCell>
              <TableCell className="text-right text-slate-50">
                {formatPercent(forcaBruta.risco_medio)}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-500">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Referência
                </Badge>
              </TableCell>
            </TableRow>

            <TableRow className="border-slate-700 bg-slate-800/50 hover:bg-slate-800/70">
              <TableCell className="font-bold text-slate-50">Diferença</TableCell>
              <TableCell className="text-right font-bold text-slate-50">
                {formatFitness(Math.abs(diferencaFitness))}
              </TableCell>
              <TableCell className="text-right font-bold text-slate-50">
                {formatCurrencyBRL(Math.abs(diferencaLucro))}
              </TableCell>
              <TableCell className="text-right text-slate-400">-</TableCell>
              <TableCell className="text-center text-slate-400">-</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
