"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, XCircle, TrendingDown, TrendingUp, Scale } from "lucide-react";
import type { MarketComparisonSummary } from "@/lib/types";

interface MarketComparisonSummaryProps {
  comparacao: MarketComparisonSummary;
}

export function MarketComparisonSummaryCard({ comparacao }: MarketComparisonSummaryProps) {
  const {
    lucro_sistema_total,
    lucro_mercado_total,
    diferenca_absoluta,
    diferenca_percentual,
    itens_alta_confiabilidade,
    itens_media_confiabilidade,
    itens_baixa_confiabilidade,
    itens_criticos,
    percentual_alta_confiabilidade,
    pode_usar_mercado,
    motivo_bloqueio
  } = comparacao;

  const total_itens = itens_alta_confiabilidade + itens_media_confiabilidade + itens_baixa_confiabilidade;

  return (
    <Card className="bg-slate-900/50 border-slate-800/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Scale className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Avaliação com Lucro de Mercado</CardTitle>
              <CardDescription className="text-xs">
                Comparação do plano principal com estimativa baseada em preços de mercado
              </CardDescription>
            </div>
          </div>
          {pode_usar_mercado ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Confiável
            </Badge>
          ) : (
            <Badge variant="outline" className={`gap-1 ${itens_criticos > 0 ? "bg-red-500/10 text-red-600 border-red-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}`}>
              <XCircle className="h-3 w-3" />
              Bloqueado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alerta Experimental */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-300">
              <strong>Esta avaliação é experimental e não substitui o plano principal.</strong>
              {" "}O lucro de mercado é usado apenas como simulação comparativa.
            </div>
          </div>
        </div>

        {/* Comparação de Lucros - Cards Separados */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Lucro do Sistema */}
          <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4">
            <p className="text-xs text-emerald-400 font-medium mb-1">Lucro do Sistema</p>
            <p className="text-2xl font-bold text-emerald-500">
              {lucro_sistema_total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </p>
            <p className="text-xs text-slate-400 mt-1">Plano principal</p>
          </div>

          {/* Lucro de Mercado */}
          <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4">
            <p className="text-xs text-blue-400 font-medium mb-1">Lucro de Mercado</p>
            <p className="text-2xl font-bold text-blue-500">
              {lucro_mercado_total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </p>
            <p className="text-xs text-slate-400 mt-1">Avaliação experimental</p>
          </div>

          {/* Diferença */}
          <div className={`rounded-xl border p-4 ${
            diferenca_absoluta >= 0 
              ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5" 
              : "border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-500/5"
          }`}>
            <p className={`text-xs font-medium mb-1 ${diferenca_absoluta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              Diferença
            </p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${diferenca_absoluta >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {diferenca_percentual >= 0 ? "+" : ""}
                {diferenca_percentual.toFixed(2)}%
              </p>
              {diferenca_absoluta >= 0 ? (
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {diferenca_absoluta.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </p>
          </div>
        </div>

        {/* Confiabilidade - Mini Cards */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-300">Confiabilidade dos Dados</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-medium text-emerald-400">Alta</span>
              </div>
              <p className="text-lg font-bold text-slate-200">
                {itens_alta_confiabilidade}
              </p>
              <p className="text-xs text-slate-400">{percentual_alta_confiabilidade.toFixed(1)}%</p>
            </div>

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-xs font-medium text-amber-400">Média</span>
              </div>
              <p className="text-lg font-bold text-slate-200">
                {itens_media_confiabilidade}
              </p>
              <p className="text-xs text-slate-400">
                {total_itens > 0 ? ((itens_media_confiabilidade / total_itens) * 100).toFixed(1) : 0}%
              </p>
            </div>

            <div className="rounded-lg border border-slate-500/20 bg-slate-500/5 p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                <span className="text-xs font-medium text-slate-400">Baixa</span>
              </div>
              <p className="text-lg font-bold text-slate-200">
                {itens_baixa_confiabilidade}
              </p>
              <p className="text-xs text-slate-400">
                {total_itens > 0 ? ((itens_baixa_confiabilidade / total_itens) * 100).toFixed(1) : 0}%
              </p>
            </div>

            {itens_criticos > 0 && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span className="text-xs font-medium text-red-400">Críticos</span>
                </div>
                <p className="text-lg font-bold text-red-500">
                  {itens_criticos}
                </p>
                <p className="text-xs text-red-400">Requer atenção</p>
              </div>
            )}
          </div>
        </div>

        {/* Motivo de Bloqueio */}
        {!pode_usar_mercado && motivo_bloqueio && (
          <div className={`rounded-lg border p-4 ${
            itens_criticos > 0 
              ? "bg-red-500/10 border-red-500/25" 
              : "bg-amber-500/10 border-amber-500/25"
          }`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                itens_criticos > 0 ? "text-red-400" : "text-amber-400"
              }`} />
              <div>
                <p className={`text-sm font-semibold mb-1 ${
                  itens_criticos > 0 ? "text-red-300" : "text-amber-300"
                }`}>
                  Uso automático bloqueado
                </p>
                <p className={`text-sm ${
                  itens_criticos > 0 ? "text-red-200/80" : "text-amber-200/80"
                }`}>
                  {motivo_bloqueio}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
