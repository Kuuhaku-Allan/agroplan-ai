"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Scale, AlertTriangle } from "lucide-react";
import { compararLucroMercado, getClimateLocation } from "@/lib/api";
import { MarketComparisonSummaryCard } from "@/components/market-comparison/market-comparison-summary";
import { MarketComparisonTable } from "@/components/market-comparison/market-comparison-table";
import type { MarketComparisonResponse } from "@/lib/types";

export default function ComparacaoMercadoPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<MarketComparisonResponse | null>(null);

  const handleExecutarAvaliacao = async () => {
    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      // Obter localização climática salva
      const location = getClimateLocation();

      // Executar avaliação comparativa
      const data = await compararLucroMercado(location || undefined, {
        objetivo: "equilibrado",
        seed: 42,
        geracoes: 50,
        populacao: 50
      });

      setResultado(data);
    } catch (err: any) {
      console.error("Erro ao executar avaliação:", err);
      setError(err.message || "Erro ao executar avaliação comparativa");
    } finally {
      setLoading(false);
    }
  };

  const location = getClimateLocation();
  const hasUF = location?.uf;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Scale className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Avaliação com Lucro de Mercado</h1>
        </div>
        <p className="text-muted-foreground">
          Compara o plano principal atual com uma estimativa baseada em preços de mercado normalizados.
        </p>
      </div>

      {/* Aviso se não tiver UF */}
      {!hasUF && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Selecione uma região com UF para usar preços regionais.</strong>
            {" "}Sem UF, serão usados preços nacionais médios (fallback).
          </AlertDescription>
        </Alert>
      )}

      {/* Informações da Região */}
      {location && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Região Selecionada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {location.uf && (
                <div>
                  <p className="text-muted-foreground">UF</p>
                  <p className="font-medium">{location.uf}</p>
                </div>
              )}
              {location.municipio && (
                <div>
                  <p className="text-muted-foreground">Município</p>
                  <p className="font-medium">{location.municipio}</p>
                </div>
              )}
              {location.safra && (
                <div>
                  <p className="text-muted-foreground">Safra</p>
                  <p className="font-medium">{location.safra}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Coordenadas</p>
                <p className="font-medium font-mono text-xs">
                  {location.lat.toFixed(2)}, {location.lon.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão de Execução */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleExecutarAvaliacao}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Executando Avaliação...
            </>
          ) : (
            <>
              <Scale className="h-4 w-4" />
              Executar Avaliação
            </>
          )}
        </Button>
      </div>

      {/* Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Resultados */}
      {resultado && (
        <div className="space-y-6">
          {/* Resumo */}
          <MarketComparisonSummaryCard comparacao={resultado.comparacao} />

          {/* Tabela Detalhada */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento por Talhão</CardTitle>
              <CardDescription>
                Comparação detalhada entre lucro do sistema e avaliação de mercado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MarketComparisonTable itens={resultado.avaliacao_mercado.itens} />
            </CardContent>
          </Card>

          {/* Aviso Final */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Esta avaliação não substitui a recomendação principal.
              O lucro de mercado é usado apenas como simulação comparativa para análise de sensibilidade.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
