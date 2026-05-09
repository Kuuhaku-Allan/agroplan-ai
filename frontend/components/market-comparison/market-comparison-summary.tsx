"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, XCircle, TrendingDown, TrendingUp } from "lucide-react";
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

  // Determinar cor do card baseado no status
  const cardVariant = itens_criticos > 0 ? "destructive" : !pode_usar_mercado ? "warning" : "default";

  return (
    <Card className={itens_criticos > 0 ? "border-red-500" : !pode_usar_mercado ? "border-amber-500" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Avaliação com Lucro de Mercado</CardTitle>
            <CardDescription>
              Comparação do plano principal com estimativa baseada em preços de mercado
            </CardDescription>
          </div>
          {pode_usar_mercado ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Confiável
            </Badge>
          ) : (
            <Badge variant={itens_criticos > 0 ? "destructive" : "secondary"} className="gap-1">
              <XCircle className="h-3 w-3" />
              Bloqueado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alerta Experimental */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Esta avaliação é experimental e não substitui o plano principal.</strong>
            {" "}O lucro de mercado é usado apenas como simulação comparativa.
          </AlertDescription>
        </Alert>

        {/* Comparação de Lucros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Lucro do Sistema</p>
            <p className="text-2xl font-bold text-green-600">
              {lucro_sistema_total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
              })}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Lucro de Mercado</p>
            <p className="text-2xl font-bold text-blue-600">
              {lucro_mercado_total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
              })}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Diferença</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${diferenca_absoluta >= 0 ? "text-green-600" : "text-red-600"}`}>
                {diferenca_percentual >= 0 ? "+" : ""}
                {diferenca_percentual.toFixed(2)}%
              </p>
              {diferenca_absoluta >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {diferenca_absoluta.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
              })}
            </p>
          </div>
        </div>

        {/* Confiabilidade */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Confiabilidade dos Dados</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">Alta</Badge>
              <span className="text-sm">
                {itens_alta_confiabilidade} ({percentual_alta_confiabilidade.toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Média</Badge>
              <span className="text-sm">{itens_media_confiabilidade}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Baixa</Badge>
              <span className="text-sm">{itens_baixa_confiabilidade}</span>
            </div>
            {itens_criticos > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Críticos</Badge>
                <span className="text-sm font-bold">{itens_criticos}</span>
              </div>
            )}
          </div>
        </div>

        {/* Motivo de Bloqueio */}
        {!pode_usar_mercado && motivo_bloqueio && (
          <Alert variant={itens_criticos > 0 ? "destructive" : "default"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Motivo do bloqueio:</strong> {motivo_bloqueio}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
