"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Scale, AlertTriangle, MapPin, Calendar, Globe } from "lucide-react";
import { compararLucroMercado, getClimateLocation } from "@/lib/api";
import { MarketComparisonSummaryCard } from "@/components/market-comparison/market-comparison-summary";
import { MarketComparisonTable } from "@/components/market-comparison/market-comparison-table";
import type { MarketComparisonResponse } from "@/lib/types";
import { Topbar } from "@/components/layout/topbar";

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
    <div>
      <Topbar
        title="Comparação Mercado"
        subtitle="Avaliação comparativa com lucro de mercado"
      />

      <div className="p-8 space-y-6">
        {/* Header com descrição */}
        <div className="rounded-xl border border-slate-800/50 bg-gradient-to-br from-slate-900/70 via-[#0b1733]/70 to-slate-950/60 backdrop-blur-sm p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Scale className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-100 mb-2">
                Avaliação com Lucro de Mercado
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Compara o plano principal atual com uma estimativa baseada em preços de mercado normalizados.
                Esta é uma <strong className="text-blue-400">avaliação experimental</strong> que não substitui a recomendação oficial.
              </p>
            </div>
          </div>
        </div>

        {/* Aviso se não tiver UF */}
        {!hasUF && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-300 mb-1">
                  Selecione uma região com UF para usar preços regionais
                </p>
                <p className="text-sm text-amber-200/80">
                  Sem UF, serão usados preços nacionais médios (fallback).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Informações da Região */}
        {location && (
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-500" />
                Região Selecionada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {location.uf && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">UF</p>
                    <p className="text-sm font-semibold text-slate-200">{location.uf}</p>
                  </div>
                )}
                {location.municipio && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Município</p>
                    <p className="text-sm font-semibold text-slate-200">{location.municipio}</p>
                  </div>
                )}
                {location.safra && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Safra
                    </p>
                    <p className="text-sm font-semibold text-slate-200">{location.safra}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Coordenadas
                  </p>
                  <p className="text-xs font-mono text-slate-300">
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
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
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
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-300 mb-1">Erro ao executar avaliação</p>
                <p className="text-sm text-red-200/80">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Resultados */}
        {resultado && (
          <div className="space-y-6">
            {/* Resumo */}
            <MarketComparisonSummaryCard comparacao={resultado.comparacao} />

            {/* Tabela Detalhada */}
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardHeader>
                <CardTitle className="text-lg">Detalhamento por Talhão</CardTitle>
                <CardDescription className="text-xs">
                  Comparação detalhada entre lucro do sistema e avaliação de mercado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MarketComparisonTable itens={resultado.avaliacao_mercado.itens} />
              </CardContent>
            </Card>

            {/* Aviso Final */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-300 mb-1">Importante</p>
                  <p className="text-sm text-blue-200/80">
                    Esta avaliação não substitui a recomendação principal.
                    O lucro de mercado é usado apenas como simulação comparativa para análise de sensibilidade.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
