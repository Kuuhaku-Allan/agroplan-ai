"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { MarketComparisonItem } from "@/lib/types";

interface MarketComparisonTableProps {
  itens: MarketComparisonItem[];
}

export function MarketComparisonTable({ itens }: MarketComparisonTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Talhão</TableHead>
            <TableHead>Cultura</TableHead>
            <TableHead className="text-right">Lucro Sistema</TableHead>
            <TableHead className="text-right">Lucro Mercado</TableHead>
            <TableHead className="text-right">Diferença</TableHead>
            <TableHead className="text-center">Confiabilidade</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.map((item, index) => {
            const lucroSistema = item.lucro_sistema ?? 0;
            const lucroMercado = item.lucro_mercado_estimado ?? 0;
            const diferenca = lucroMercado - lucroSistema;
            const diferencaPercentual = lucroSistema !== 0 
              ? (diferenca / Math.abs(lucroSistema)) * 100 
              : 0;

            const validacao = item.validacao_lucro_mercado;
            const confiabilidade = validacao?.confiabilidade ?? "media";
            const critico = validacao?.critico ?? false;

            // Determinar badge de confiabilidade
            const confiabilidadeBadge = {
              alta: { variant: "default" as const, className: "bg-green-600", label: "Alta" },
              media: { variant: "secondary" as const, className: "", label: "Média" },
              baixa: { variant: "outline" as const, className: "", label: "Baixa" }
            }[confiabilidade];

            return (
              <TableRow key={index} className={critico ? "bg-red-50 dark:bg-red-950/20" : ""}>
                <TableCell className="font-medium">{item.talhao}</TableCell>
                <TableCell className="capitalize">{item.cultura}</TableCell>
                <TableCell className="text-right font-mono">
                  {lucroSistema.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {lucroMercado.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {diferenca > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : diferenca < 0 ? (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    ) : (
                      <Minus className="h-3 w-3 text-gray-400" />
                    )}
                    <span className={`text-sm font-medium ${
                      diferenca > 0 ? "text-green-600" : diferenca < 0 ? "text-red-600" : "text-gray-500"
                    }`}>
                      {diferencaPercentual >= 0 ? "+" : ""}
                      {diferencaPercentual.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant={confiabilidadeBadge.variant}
                    className={confiabilidadeBadge.className}
                  >
                    {confiabilidadeBadge.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {critico ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Crítico
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      OK
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
