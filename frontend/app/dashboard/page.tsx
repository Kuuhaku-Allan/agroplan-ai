"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getDashboard, getCenarios, getClimateLocation, setClimateLocation } from "@/lib/api";
import { DashboardData, Cenario } from "@/lib/types";
import type { ClimateLocation, ClimateData } from "@/lib/types/climate";
import { Topbar } from "@/components/layout/topbar";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ScenarioProfitChart } from "@/components/dashboard/scenario-profit-chart";
import { ScenarioRiskChart } from "@/components/dashboard/scenario-risk-chart";
import { RecommendedPlan } from "@/components/dashboard/recommended-plan";
import { DecisionSummary } from "@/components/dashboard/decision-summary";
import { LoadingCard, LoadingChart } from "@/components/shared/loading-card";
import { ErrorState } from "@/components/shared/error-state";
import { ClimateRegionCard } from "@/components/climate/climate-region-card";
import { ClimateRegionSelector } from "@/components/climate/climate-region-selector";
import { ZarcImpactBanner } from "@/components/zarc/zarc-impact-banner";
import { PriceImpactBanner } from "@/components/prices/price-impact-banner";
import { MarketProfitValidationBanner } from "@/components/prices/market-profit-validation-banner";
import { formatCurrencyBRL, formatPercent, formatFitness, formatCurrencyCompactBRL } from "@/lib/formatters";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAdvancedMode } from "@/hooks/useAdvancedMode";
import {
  ASSISTANT_LEVEL_LABELS,
  buildLocationForEnabledModules,
} from "@/lib/settings";

import {
  TrendingUp,
  AlertTriangle,
  Gauge,
  Sprout,
  CheckCircle2,
  MapPin,
  Settings2,
  CloudSun,
  BadgeDollarSign,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

// Função auxiliar para determinar status de validação
function getValidationStatus(validacao: { otimo_global: boolean; total_combinacoes: number }) {
  const forcaBrutaInviavel = validacao.total_combinacoes > 10000;
  
  if (forcaBrutaInviavel) {
    return {
      label: "Estável",
      subtitle: "Por rodadas",
      color: "emerald" as const
    };
  }
  
  if (validacao.otimo_global) {
    return {
      label: "Ótimo",
      subtitle: "Global encontrado",
      color: "emerald" as const
    };
  }
  
  return {
    label: "Pendente",
    subtitle: "Não validado",
    color: "blue" as const
  };
}

function statusBadgeClass(enabled: boolean) {
  return enabled
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    : "border-slate-600/50 bg-slate-800/50 text-slate-400";
}

function hasLocationPayload(location?: Partial<ClimateLocation>): boolean {
  if (!location) return false;
  return Boolean(
    location.lat !== undefined ||
      location.lon !== undefined ||
      location.uf ||
      location.municipio ||
      location.safra,
  );
}

interface ModuleNoticeProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "slate" | "amber";
}

function ModuleNotice({
  icon: Icon,
  title,
  description,
  tone = "slate",
}: ModuleNoticeProps) {
  const toneClass =
    tone === "amber"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
      : "border-slate-700/70 bg-slate-900/50 text-slate-300";

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const {
    settings: advancedSettings,
    canUseClimate,
    canUseZarc,
    canUsePrices,
    canUseMarketValidation,
    canShowGuidedExplanations,
  } = useAdvancedMode();

  const climateEnabled = canUseClimate();
  const zarcEnabled = canUseZarc();
  const pricesEnabled = canUsePrices();
  const marketValidationEnabled = canUseMarketValidation();
  const guidedExplanationsEnabled = canShowGuidedExplanations();
  const manualMode = advancedSettings.assistant_level === "manual";

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [cenarios, setCenarios] = useState<Record<string, Cenario> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [climateLocation, setClimateLocationState] = useState<ClimateLocation | null>(null);
  const [showClimateSelector, setShowClimateSelector] = useState(false);

  const getEnabledLocationPayload = useCallback(
    (location: ClimateLocation | null): Partial<ClimateLocation> | undefined => {
      if (!location) return undefined;

      const enabledLocation = buildLocationForEnabledModules(location, advancedSettings);
      return hasLocationPayload(enabledLocation) ? enabledLocation : undefined;
    },
    [advancedSettings],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Obter localização climática salva
      const savedLocation = getClimateLocation();
      setClimateLocationState(savedLocation);
      const enabledLocation = getEnabledLocationPayload(savedLocation);

      // Carrega dashboard e cenários em paralelo com localização climática
      const [dashboardData, cenariosData] = await Promise.all([
        getDashboard(enabledLocation),
        getCenarios(enabledLocation)
      ]);
      
      setDashboard(dashboardData);
      setCenarios(cenariosData.cenarios);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError(err instanceof Error ? err.message : "Erro ao conectar com o backend");
    } finally {
      setLoading(false);
    }
  }, [getEnabledLocationPayload]);

  const handleClimateLocationChange = (location: ClimateLocation | null) => {
    setClimateLocation(location);
    setClimateLocationState(location);
    loadData(); // Recarregar dados com nova localização
  };

  useEffect(() => {
    // Só executa no cliente
    if (typeof window !== 'undefined') {
      const timeoutId = window.setTimeout(() => {
        void loadData();
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [loadData]);

  return (
    <div>
      <Topbar
        title="Dashboard"
        subtitle={guidedExplanationsEnabled ? "Visão geral do planejamento agrícola" : undefined}
      />

      <div className="p-8 space-y-8">
        {/* Estado de erro */}
        {error && !loading && (
          <ErrorState onRetry={loadData} />
        )}

        {/* Status modular */}
        <Card className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.20)]">
          <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-300">
                  Modo atual: {ASSISTANT_LEVEL_LABELS[advancedSettings.assistant_level]}
                </span>
                <Badge variant="outline" className={statusBadgeClass(climateEnabled)}>
                  Clima: {climateEnabled ? "ligado" : "desligado"}
                </Badge>
                <Badge variant="outline" className={statusBadgeClass(zarcEnabled)}>
                  ZARC: {zarcEnabled ? "ligado" : "desligado"}
                </Badge>
                <Badge variant="outline" className={statusBadgeClass(pricesEnabled)}>
                  Preços: {pricesEnabled ? "ligado" : "desligado"}
                </Badge>
                <Badge variant="outline" className={statusBadgeClass(marketValidationEnabled)}>
                  Validação mercado: {marketValidationEnabled ? "ligada" : "desligada"}
                </Badge>
                <Badge variant="outline" className={statusBadgeClass(guidedExplanationsEnabled)}>
                  Explicações: {guidedExplanationsEnabled ? "completas" : "reduzidas"}
                </Badge>
              </div>
              {guidedExplanationsEnabled && (
                <p className="text-xs text-slate-500">
                  O Dashboard aplica essas preferências antes de enviar localização para a API.
                </p>
              )}
              {manualMode && (
                <p className="text-xs text-emerald-300/80">
                  Você está no modo Manual. Apenas informações essenciais ficam visíveis.
                </p>
              )}
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-white/10 bg-slate-950/40 text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-300"
            >
              <Link href="/configuracoes">
                <Settings2 className="mr-2 h-4 w-4" />
                Editar configurações
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Cards de métricas */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : dashboard && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <MetricCard
              title="Lucro Total"
              value={formatCurrencyCompactBRL(dashboard.lucro_total)}
              subtitle={`Total: ${formatCurrencyBRL(dashboard.lucro_total)}`}
              icon={TrendingUp}
              color="amber"
            />
            
            <MetricCard
              title="Risco Médio"
              value={formatPercent(dashboard.risco_medio)}
              subtitle="Ponderado"
              icon={AlertTriangle}
              color="red"
            />
            
            <MetricCard
              title="Fitness"
              value={formatFitness(dashboard.fitness)}
              subtitle="Pontuação normalizada"
              icon={Gauge}
              color="emerald"
            />
            
            <MetricCard
              title="Diversidade"
              value={dashboard.diversidade.toString()}
              subtitle={`${dashboard.diversidade} culturas`}
              icon={Sprout}
              color="green"
            />
            
            {(() => {
              const validationStatus = getValidationStatus(dashboard.validacao);
              return (
                <MetricCard
                  title="Validação"
                  value={validationStatus.label}
                  subtitle={validationStatus.subtitle}
                  icon={CheckCircle2}
                  color={validationStatus.color}
                />
              );
            })()}
          </div>
        )}

        {/* Gráficos e Plano */}
        {loading ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <LoadingChart />
              <LoadingChart />
            </div>
            <div className="space-y-6">
              <LoadingChart />
              <LoadingChart />
            </div>
          </div>
        ) : dashboard && cenarios && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Coluna esquerda: Gráficos (2/3 da largura) */}
            <div className="xl:col-span-2 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ScenarioProfitChart 
                  data={Object.values(cenarios).map(c => ({
                    nome: c.nome,
                    lucro_total: c.lucro_total
                  }))}
                />
                
                <ScenarioRiskChart 
                  data={Object.values(cenarios).map(c => ({
                    nome: c.nome,
                    risco_medio: c.risco_medio
                  }))}
                />
              </div>
              
              <RecommendedPlan plano={dashboard.plano} />
            </div>

            {/* Coluna direita: Clima, ZARC, Decisão e Ações (1/3 da largura) */}
            <div className="space-y-6">
              {/* Card de Clima Real */}
              {climateEnabled ? (
                climateLocation ? (
                <ClimateRegionCard
                  location={climateLocation}
                  climateData={dashboard.clima_real as ClimateData}
                  onRemove={() => handleClimateLocationChange(null)}
                />
                ) : (
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-slate-400" />
                      <p className="text-sm font-medium text-slate-300">Clima Real</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    {guidedExplanationsEnabled
                      ? "Selecione uma região para usar dados climáticos reais do Open-Meteo"
                      : "Nenhuma região climática selecionada."}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => setShowClimateSelector(true)}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Selecionar Região
                  </Button>
                </div>
                )
              ) : (
                <ModuleNotice
                  icon={CloudSun}
                  title="Clima integrado desativado"
                  description="Clima integrado está desativado nas Configurações."
                />
              )}

              {/* Banner ZARC */}
              {zarcEnabled && dashboard.zarc?.ativo && (
                <ZarcImpactBanner
                  zarc={dashboard.zarc}
                  onChangeRegion={() => setShowClimateSelector(true)}
                />
              )}

              {zarcEnabled && !dashboard.zarc?.ativo && (
                <div className="rounded-lg border border-slate-700/70 bg-slate-900/50 p-4">
                  <div className="mb-3 flex items-start gap-3">
                    <Sprout className="mt-0.5 h-5 w-5 text-slate-400" />
                    <div>
                      <h3 className="text-sm font-medium text-slate-300">ZARC sem região</h3>
                      {guidedExplanationsEnabled && (
                        <p className="mt-1 text-xs text-slate-400">
                          Selecione uma região predefinida com UF e município para mostrar cobertura ZARC.
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => setShowClimateSelector(true)}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Selecionar Região
                  </Button>
                </div>
              )}

              {!zarcEnabled && (
                <ModuleNotice
                  icon={Sprout}
                  title="ZARC desativado"
                  description="ZARC está desativado nas Configurações."
                />
              )}

              {/* Banner de Preços */}
              {pricesEnabled && dashboard.precos?.ativo && (
                <PriceImpactBanner precos={dashboard.precos} />
              )}

              {!pricesEnabled && (
                <ModuleNotice
                  icon={BadgeDollarSign}
                  title="Preços agrícolas desativados"
                  description="Preços agrícolas estão desativados nas Configurações."
                />
              )}

              {/* Banner de Validação de Lucro de Mercado */}
              {pricesEnabled && marketValidationEnabled && dashboard.validacao_lucro_mercado?.ativo && (
                <MarketProfitValidationBanner validacao={dashboard.validacao_lucro_mercado} />
              )}

              {pricesEnabled && !marketValidationEnabled && (
                <ModuleNotice
                  icon={ShieldCheck}
                  title="Validação de mercado desativada"
                  description="Validação de lucro de mercado está desativada nas Configurações."
                />
              )}

              {!pricesEnabled && (
                <ModuleNotice
                  icon={ShieldCheck}
                  title="Validação de mercado indisponível"
                  description="Validação de lucro de mercado depende de preços agrícolas."
                  tone="amber"
                />
              )}

              {/* Aviso se tem clima mas não tem ZARC */}
              {zarcEnabled && climateLocation && !climateLocation.uf && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-xs text-amber-600">
                    💡 ZARC requer município e UF. Selecione uma região predefinida como Clementina-SP.
                  </p>
                </div>
              )}
              
              <DecisionSummary 
                objetivo={dashboard.objetivo}
                validacao={dashboard.validacao}
                showGuidedExplanations={guidedExplanationsEnabled}
              />
              
              <QuickActions />
            </div>
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
