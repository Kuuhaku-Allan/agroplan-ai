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
    <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-white/[0.02] border-slate-800/50 hover:bg-white/[0.02]">
            <TableHead className="w-[80px] text-slate-300 font-semibold">Talhão</TableHead>
            <TableHead className="text-slate-300 font-semibold">Cultura</TableHead>
            <TableHead className="text-right text-slate-300 font-semibold">Lucro Sistema</TableHead>
            <TableHead className="text-right text-slate-300 font-semibold">Lucro Mercado</TableHead>
            <TableHead className="text-right text-slate-300 font-semibold">Diferença</TableHead>
            <TableHead className="text-center text-slate-300 font-semibold">Confiabilidade</TableHead>
            <TableHead className="text-center text-slate-300 font-semibold">Status</TableHead>
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
              alta: { 
                className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", 
                label: "Alta" 
              },
              media: { 
                className: "bg-amber-500/10 text-amber-400 border-amber-500/20", 
                label: "Média" 
              },
              baixa: { 
                className: "bg-slate-500/10 text-slate-400 border-slate-500/20", 
                label: "Baixa" 
              }
            }[confiabilidade];

            return (
              <TableRow 
                key={index} 
                className={`border-slate-800/50 transition-colors ${
                  critico 
                    ? "bg-red-500/5 hover:bg-red-500/10" 
                    : index % 2 === 0 
                    ? "bg-white/[0.01] hover:bg-cyan-400/[0.04]" 
                    : "hover:bg-cyan-400/[0.04]"
                }`}
              >
                <TableCell className="font-medium text-slate-200">{item.talhao}</TableCell>
                <TableCell className="capitalize text-slate-300">{item.cultura}</TableCell>
                <TableCell className="text-right font-mono text-slate-200">
                  {lucroSistema.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </TableCell>
                <TableCell className="text-right font-mono text-slate-200">
                  {lucroMercado.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {diferenca > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    ) : diferenca < 0 ? (
                      <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <Minus className="h-3.5 w-3.5 text-slate-500" />
                    )}
                    <span className={`text-sm font-semibold ${
                      diferenca > 0 ? "text-emerald-500" : diferenca < 0 ? "text-red-500" : "text-slate-500"
                    }`}>
                      {diferencaPercentual >= 0 ? "+" : ""}
                      {diferencaPercentual.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant="outline"
                    className={confiabilidadeBadge.className}
                  >
                    {confiabilidadeBadge.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {critico ? (
                    <Badge variant="outline" className="gap-1 bg-red-500/10 text-red-400 border-red-500/20">
                      <AlertTriangle className="h-3 w-3" />
                      Crítico
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/5">
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
