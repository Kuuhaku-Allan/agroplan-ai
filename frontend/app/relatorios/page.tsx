"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { ReportConfigPanel } from "@/components/relatorios/report-config-panel";
import { ReportSummaryCard } from "@/components/relatorios/report-summary-card";
import { ReportPreview } from "@/components/relatorios/report-preview";
import { ReportActions } from "@/components/relatorios/report-actions";
import { ReportContentOverview } from "@/components/relatorios/report-content-overview";
import { ReportEmptyState } from "@/components/relatorios/report-empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ClimateImpactBanner, ClimateInactiveBanner } from "@/components/climate/climate-impact-banner";
import { ClimateRegionSelector } from "@/components/climate/climate-region-selector";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { gerarRelatorio, getClimateLocation, setClimateLocation } from "@/lib/api";
import type { ClimateLocation, ClimateData } from "@/lib/types/climate";

interface RelatorioData {
  caminho: string;
  conteudo: string;
  formato: "md" | "txt";
  objetivo: string;
  clima_real?: ClimateData;
}

export default function RelatoriosPage() {
  const [objetivo, setObjetivo] = useState<string>("equilibrado");
  const [formato, setFormato] = useState<"md" | "txt">("md");
  const [relatorio, setRelatorio] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [climateLocation, setClimateLocationState] = useState<ClimateLocation | null>(null);
  const [showClimateSelector, setShowClimateSelector] = useState(false);

  useEffect(() => {
    // Carregar localização climática salva
    const savedLocation = getClimateLocation();
    setClimateLocationState(savedLocation);
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setRelatorio(null);

    try {
      // Obter localização climática atual
      const currentLocation = getClimateLocation();
      
      // Gerar relatório com localização climática
      const data = await gerarRelatorio(objetivo, formato, currentLocation || undefined);
      setRelatorio({
        caminho: data.caminho,
        conteudo: data.conteudo,
        formato: data.formato,
        objetivo: objetivo,
        clima_real: data.clima_real
      });
    } catch (err) {
      console.error("Erro ao gerar relatório:", err);
      setError(err instanceof Error ? err.message : "Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleClimateLocationChange = (location: ClimateLocation | null) => {
    setClimateLocation(location);
    setClimateLocationState(location);
  };

  return (
    <div>
      <Topbar
        title="Relatórios"
        subtitle="Gere documentos explicáveis com plano recomendado, cenários, validação e justificativa técnica"
      />

      <div className="p-8 space-y-8">
        {/* Banner Climático */}
        {climateLocation ? (
          relatorio?.clima_real ? (
            <ClimateImpactBanner
              location={climateLocation}
              climateData={relatorio.clima_real}
              onChangeRegion={() => setShowClimateSelector(true)}
              message="Relatório gerado com dados climáticos reais"
            />
          ) : (
            <ClimateInactiveBanner
              onActivate={() => setShowClimateSelector(true)}
              message={`Região selecionada: ${climateLocation.label} (gere o relatório para incluir dados climáticos)`}
            />
          )
        ) : (
          <ClimateInactiveBanner
            onActivate={() => setShowClimateSelector(true)}
            message="Relatório será gerado com dados climáticos simulados"
          />
        )}

        {/* Aviso ZARC */}
        {climateLocation && climateLocation.uf && climateLocation.municipio ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-emerald-500 mt-0.5">🌾</div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-emerald-500 mb-1">
                  ZARC Ativo
                </h3>
                <p className="text-sm text-slate-300">
                  O relatório incluirá janelas de plantio ZARC para <strong>{climateLocation.municipio}/{climateLocation.uf}</strong>, 
                  safra <strong>{climateLocation.safra || '2025/2026'}</strong>.
                </p>
              </div>
            </div>
          </div>
        ) : climateLocation ? (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-yellow-500 mt-0.5">⚠️</div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-500 mb-1">
                  ZARC não disponível
                </h3>
                <p className="text-sm text-slate-300">
                  Para incluir janelas de plantio ZARC no relatório, selecione uma região com município e UF específicos.
                </p>
                <button
                  onClick={() => setShowClimateSelector(true)}
                  className="mt-2 text-sm text-yellow-400 hover:text-yellow-300 underline"
                >
                  Selecionar região
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Configuração e Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de Configuração */}
          <div className="lg:col-span-1">
            <ReportConfigPanel
              objetivo={objetivo}
              formato={formato}
              loading={loading}
              onObjetivoChange={setObjetivo}
              onFormatoChange={setFormato}
              onGenerate={handleGenerate}
            />
          </div>

          {/* Overview do Conteúdo */}
          <div className="lg:col-span-2">
            <ReportContentOverview />
          </div>
        </div>

        {/* Estado Vazio */}
        {!relatorio && !loading && !error && (
          <ReportEmptyState />
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="bg-slate-900/50 border-slate-800/50 p-5">
                  <Skeleton className="h-4 w-24 bg-slate-800 mb-3" />
                  <Skeleton className="h-6 w-32 bg-slate-800" />
                </Card>
              ))}
            </div>
            
            <Card className="bg-slate-900/50 border-slate-800/50 p-6">
              <Skeleton className="h-6 w-48 bg-slate-800 mb-4" />
              <div className="space-y-2">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full bg-slate-800" />
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Erro */}
        {error && !loading && (
          <ErrorState
            title="Erro ao Gerar Relatório"
            message={error}
            onRetry={handleGenerate}
          />
        )}

        {/* Relatório Gerado */}
        {relatorio && !loading && (
          <div className="space-y-6">
            {/* Cards de Resumo */}
            <ReportSummaryCard
              objetivo={relatorio.objetivo}
              formato={relatorio.formato}
              caminho={relatorio.caminho}
              tamanho={relatorio.conteudo.length}
            />

            {/* Ações */}
            <ReportActions
              conteudo={relatorio.conteudo}
              objetivo={relatorio.objetivo}
              formato={relatorio.formato}
              onRegenerate={handleRegenerate}
            />

            {/* Preview */}
            <ReportPreview
              conteudo={relatorio.conteudo}
              formato={relatorio.formato}
            />
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
