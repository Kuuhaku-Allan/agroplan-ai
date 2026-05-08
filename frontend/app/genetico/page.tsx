"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { GeneticObjectiveSelector } from "@/components/genetico/genetic-objective-selector";
import { GeneticResultSummary } from "@/components/genetico/genetic-result-summary";
import { FitnessEvolutionChart } from "@/components/genetico/fitness-evolution-chart";
import { GeneticPlanCard } from "@/components/genetico/genetic-plan-card";
import { GeneticExplanation } from "@/components/genetico/genetic-explanation";
import { ErrorState } from "@/components/shared/error-state";
import { ClimateImpactBanner, ClimateInactiveBanner } from "@/components/climate/climate-impact-banner";
import { ClimateRegionSelector } from "@/components/climate/climate-region-selector";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { otimizar, getClimateLocation, setClimateLocation } from "@/lib/api";
import { ResultadoOtimizacao } from "@/lib/types";
import type { ClimateLocation, ClimateData } from "@/lib/types/climate";
import { Sparkles } from "lucide-react";

interface ResultadoOtimizacaoComClima extends ResultadoOtimizacao {
  clima_real?: ClimateData;
  ajuste_climatico_aplicado?: boolean;
  contexto_climatico?: any;
}

export default function GeneticoPage() {
  const [resultado, setResultado] = useState<ResultadoOtimizacaoComClima | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [climateLocation, setClimateLocationState] = useState<ClimateLocation | null>(null);
  const [showClimateSelector, setShowClimateSelector] = useState(false);

  useEffect(() => {
    // Carregar localização climática salva
    const savedLocation = getClimateLocation();
    setClimateLocationState(savedLocation);
  }, []);

  const handleExecute = async (objetivo: string, seed: number) => {
    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      // Obter localização climática atual
      const currentLocation = getClimateLocation();
      
      // Executar otimização com localização climática
      const data = await otimizar(objetivo, seed, currentLocation || undefined);
      setResultado(data);
    } catch (err) {
      console.error("Erro ao executar otimização:", err);
      setError(err instanceof Error ? err.message : "Erro ao executar otimização");
    } finally {
      setLoading(false);
    }
  };

  const handleClimateLocationChange = (location: ClimateLocation | null) => {
    setClimateLocation(location);
    setClimateLocationState(location);
  };

  return (
    <div>
      <Topbar
        title="Algoritmo Genético"
        subtitle="Otimize automaticamente o plano de plantio com base em lucro, risco, compatibilidade e diversidade"
      />

      <div className="p-8 space-y-8">
        {/* Banner Climático */}
        {climateLocation ? (
          resultado?.contexto_climatico ? (
            <ClimateImpactBanner
              location={climateLocation}
              climateData={{
                ativo: true,
                source: resultado.contexto_climatico.fonte,
                temperatura_media: resultado.contexto_climatico.temperatura_media,
                precipitacao_total: resultado.contexto_climatico.precipitacao_total,
                risco_climatico_estimado: resultado.contexto_climatico.risco_climatico_estimado,
                clima_observado: resultado.contexto_climatico.clima_observado,
                agua_observada: resultado.contexto_climatico.agua_observada,
                ajuste_risco: resultado.contexto_climatico.ajuste_risco,
                fallback: resultado.contexto_climatico.fallback,
                error: resultado.contexto_climatico.error
              }}
              onChangeRegion={() => setShowClimateSelector(true)}
              message="Otimização com dados climáticos reais aplicados"
            />
          ) : (
            <ClimateInactiveBanner
              onActivate={() => setShowClimateSelector(true)}
              message={`Região selecionada: ${climateLocation.label} (execute a otimização para aplicar)`}
            />
          )
        ) : (
          <ClimateInactiveBanner
            onActivate={() => setShowClimateSelector(true)}
            message="Otimização usando dados climáticos simulados"
          />
        )}

        {/* Configuração */}
        <GeneticObjectiveSelector onExecute={handleExecute} loading={loading} />

        {/* Estado inicial */}
        {!resultado && !loading && !error && (
          <Card className="bg-slate-900/50 border-slate-800/50 p-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-emerald-500/10 rounded-full">
                <Sparkles className="w-12 h-12 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-50 mb-2">
                  Pronto para Otimizar
                </h3>
                <p className="text-slate-400 max-w-md">
                  Configure o objetivo desejado e execute a otimização para encontrar o melhor plano de plantio
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="bg-slate-900/50 border-slate-800/50 p-5">
                  <Skeleton className="h-4 w-20 bg-slate-800 mb-3" />
                  <Skeleton className="h-8 w-24 bg-slate-800 mb-2" />
                  <Skeleton className="h-3 w-32 bg-slate-800" />
                </Card>
              ))}
            </div>
            <Card className="bg-slate-900/50 border-slate-800/50 p-6">
              <Skeleton className="h-5 w-40 mb-4 bg-slate-800" />
              <Skeleton className="h-64 w-full bg-slate-800" />
            </Card>
          </div>
        )}

        {/* Erro */}
        {error && !loading && (
          <ErrorState
            title="Erro na Otimização"
            message={error}
            onRetry={() => handleExecute("equilibrado", 42)}
          />
        )}

        {/* Resultados */}
        {resultado && !loading && (
          <div className="space-y-6">
            {/* Cards de resumo */}
            <GeneticResultSummary resultado={resultado} />

            {/* Gráfico de evolução e Explicação */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <FitnessEvolutionChart historico={resultado.historico_fitness} />
              </div>
              <div>
                <GeneticExplanation 
                  objetivo={resultado.objetivo}
                  geracoes={resultado.geracoes}
                  justificativa={resultado.justificativa}
                />
              </div>
            </div>

            {/* Plano otimizado */}
            <GeneticPlanCard plano={resultado.plano} />
          </div>
        )}
      </div>

      {/* Modal de Seleção de Região Climática */}
      {showClimateSelector && (
        <ClimateRegionSelector
          currentLocation={climateLocation}
          onSelect={handleClimateLocationChange}
          onClose={() => setShowClimateSelector(false)}
        />
      )}
    </div>
  );
}
