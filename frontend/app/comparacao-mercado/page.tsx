"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  BadgeDollarSign,
  BarChart3,
  Calendar,
  Globe,
  Loader2,
  MapPin,
  Scale,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { compararLucroMercado, otimizarLucroMercadoExperimental, getClimateLocation } from "@/lib/api";
import { MarketComparisonSummaryCard } from "@/components/market-comparison/market-comparison-summary";
import { MarketComparisonTable } from "@/components/market-comparison/market-comparison-table";
import type { MarketComparisonResponse, MarketOptimizationResponse } from "@/lib/types";
import type { ClimateLocation } from "@/lib/types/climate";
import { Topbar } from "@/components/layout/topbar";
import { useAdvancedMode } from "@/hooks/useAdvancedMode";
import {
  ASSISTANT_LEVEL_LABELS,
  buildMarketLocationForEnabledModules,
} from "@/lib/settings";

function statusBadgeClass(enabled: boolean) {
  return enabled
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    : "border-slate-600/50 bg-slate-800/50 text-slate-400";
}

function hasMarketLocationPayload(location?: Partial<ClimateLocation>): boolean {
  if (!location) return false;
  return Boolean(
    location.lat !== undefined ||
      location.lon !== undefined ||
      location.days !== undefined ||
      location.uf ||
      location.municipio ||
      location.safra,
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

interface ModuleNoticeProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "slate" | "amber" | "blue";
  action?: ReactNode;
}

function ModuleNotice({
  icon: Icon,
  title,
  description,
  tone = "slate",
  action,
}: ModuleNoticeProps) {
  const toneClass = {
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    slate: "border-slate-700/70 bg-slate-900/50 text-slate-300",
  }[tone];

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="mt-1 text-xs text-slate-400">{description}</p>
          </div>
        </div>
        {action}
      </div>
    </div>
  );
}

export default function ComparacaoMercadoPage() {
  const {
    settings: advancedSettings,
    canUsePrices,
    canUsePriceNormalization,
    canUseMarketValidation,
    canUseMarketComparison,
    canUseExperimentalOptimizer,
    canShowGuidedExplanations,
  } = useAdvancedMode();

  const pricesEnabled = canUsePrices();
  const normalizationEnabled = canUsePriceNormalization();
  const marketValidationEnabled = canUseMarketValidation();
  const marketComparisonEnabled = canUseMarketComparison();
  const experimentalOptimizerEnabled = canUseExperimentalOptimizer();
  const guidedExplanationsEnabled = canShowGuidedExplanations();
  const manualMode = advancedSettings.assistant_level === "manual";
  const comparisonAvailable = pricesEnabled && marketComparisonEnabled;
  const experimentalAvailable =
    pricesEnabled && marketValidationEnabled && experimentalOptimizerEnabled;

  const [loading, setLoading] = useState(false);
  const [loadingOptimization, setLoadingOptimization] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorOptimization, setErrorOptimization] = useState<string | null>(null);
  const [resultado, setResultado] = useState<MarketComparisonResponse | null>(null);
  const [resultadoOtimizacao, setResultadoOtimizacao] =
    useState<MarketOptimizationResponse | null>(null);
  const [location] = useState<ClimateLocation | null>(() => getClimateLocation());

  const requestLocation = useMemo(() => {
    if (!location) return undefined;
    const enabledLocation = buildMarketLocationForEnabledModules(location, advancedSettings);
    return hasMarketLocationPayload(enabledLocation) ? enabledLocation : undefined;
  }, [advancedSettings, location]);

  const hasUF = Boolean(requestLocation?.uf);

  const handleExecutarAvaliacao = async () => {
    if (!pricesEnabled) {
      setResultado(null);
      setResultadoOtimizacao(null);
      setError("A comparação de mercado depende do módulo de Preços Agrícolas.");
      return;
    }

    if (!marketComparisonEnabled) {
      setResultado(null);
      setResultadoOtimizacao(null);
      setError("A avaliação comparativa de mercado está desativada nas Configurações.");
      return;
    }

    setLoading(true);
    setError(null);
    setResultado(null);
    setResultadoOtimizacao(null);

    try {
      const data = await compararLucroMercado(requestLocation, {
        objetivo: "equilibrado",
        seed: 42,
        geracoes: 50,
        populacao: 50,
      });

      setResultado(data);
    } catch (err: unknown) {
      console.error("Erro ao executar avaliação:", err);
      setError(getErrorMessage(err, "Erro ao executar avaliação comparativa"));
    } finally {
      setLoading(false);
    }
  };

  const handleExecutarOtimizacao = async () => {
    if (!pricesEnabled) {
      setErrorOptimization("A otimização experimental depende do módulo de Preços Agrícolas.");
      return;
    }

    if (!marketValidationEnabled) {
      setErrorOptimization("A otimização experimental depende da validação de lucro de mercado.");
      return;
    }

    if (!experimentalOptimizerEnabled) {
      setErrorOptimization("Otimização experimental desativada nas Configurações.");
      return;
    }

    setLoadingOptimization(true);
    setErrorOptimization(null);
    setResultadoOtimizacao(null);

    try {
      const data = await otimizarLucroMercadoExperimental(requestLocation, {
        seed: 42,
        geracoes: 50,
        populacao: 50,
      });

      setResultadoOtimizacao(data);
    } catch (err: unknown) {
      console.error("Erro ao executar otimização experimental:", err);
      setErrorOptimization(getErrorMessage(err, "Erro ao executar otimização experimental"));
    } finally {
      setLoadingOptimization(false);
    }
  };

  const configurationButton = (
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
  );

  const experimentalBlockNotice = !pricesEnabled
    ? "A otimização experimental depende de preços agrícolas."
    : !marketValidationEnabled
    ? "A otimização experimental depende da validação de lucro de mercado."
    : "Otimização experimental desativada nas Configurações.";

  return (
    <div>
      <Topbar
        title="Comparação Mercado"
        subtitle={
          guidedExplanationsEnabled
            ? "Avaliação comparativa e otimização experimental com lucro de mercado"
            : undefined
        }
      />

      <div className="p-8 space-y-6">
        <Card className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.20)]">
          <CardContent className="flex min-h-[88px] flex-col justify-center gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-300">
                  Modo atual: {ASSISTANT_LEVEL_LABELS[advancedSettings.assistant_level]}
                </span>
                <Badge variant="outline" className={statusBadgeClass(pricesEnabled)}>
                  Preços: {pricesEnabled ? "ligados" : "desligados"}
                </Badge>
                <Badge variant="outline" className={statusBadgeClass(normalizationEnabled)}>
                  Normalização: {normalizationEnabled ? "ligada" : "desligada"}
                </Badge>
                <Badge variant="outline" className={statusBadgeClass(marketValidationEnabled)}>
                  Validação mercado: {marketValidationEnabled ? "ligada" : "desligada"}
                </Badge>
                <Badge variant="outline" className={statusBadgeClass(marketComparisonEnabled)}>
                  Comparação: {marketComparisonEnabled ? "ligada" : "desligada"}
                </Badge>
                <Badge variant="outline" className={statusBadgeClass(experimentalOptimizerEnabled)}>
                  Otimização experimental: {experimentalOptimizerEnabled ? "ligada" : "desligada"}
                </Badge>
                <Badge variant="outline" className={statusBadgeClass(guidedExplanationsEnabled)}>
                  Explicações: {guidedExplanationsEnabled ? "completas" : "reduzidas"}
                </Badge>
              </div>
              {guidedExplanationsEnabled && (
                <p className="text-xs text-slate-500">
                  Esta tela bloqueia chamadas de mercado quando os módulos ou dependências estão desligados.
                </p>
              )}
              {manualMode && (
                <p className="text-xs text-emerald-300/80">
                  Você está no modo Manual. As análises de mercado ficam disponíveis apenas se os módulos correspondentes estiverem ativos.
                </p>
              )}
            </div>
            {configurationButton}
          </CardContent>
        </Card>

        <div className="rounded-xl border border-slate-800/50 bg-gradient-to-br from-slate-900/70 via-[#0b1733]/70 to-slate-950/60 p-6 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-500/10 p-3">
              <Scale className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h2 className="mb-2 text-xl font-semibold text-slate-100">
                Avaliação com Lucro de Mercado
              </h2>
              {guidedExplanationsEnabled ? (
                <p className="text-sm leading-relaxed text-slate-400">
                  Compara o plano principal atual com uma estimativa baseada em preços de mercado.
                  Esta é uma <strong className="text-blue-400">avaliação experimental</strong> e não substitui a recomendação oficial.
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  Visão reduzida de comparação entre lucro do sistema e lucro de mercado.
                </p>
              )}
            </div>
          </div>
        </div>

        {!pricesEnabled ? (
          <Card className="rounded-2xl border border-amber-500/25 bg-amber-500/10">
            <CardContent className="flex flex-col items-start gap-4 pt-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <BadgeDollarSign className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-300" />
                <div>
                  <h3 className="text-base font-semibold text-amber-200">
                    Comparação de Mercado desativada
                  </h3>
                  <p className="mt-1 text-sm text-amber-100/80">
                    A comparação de mercado depende do módulo de Preços Agrícolas. Ative esse módulo nas Configurações para usar esta análise.
                  </p>
                </div>
              </div>
              {configurationButton}
            </CardContent>
          </Card>
        ) : (
          <>
            {!normalizationEnabled && (
              <ModuleNotice
                icon={SlidersHorizontal}
                title="Normalização de preços desativada"
                description="A tela mantém a comparação disponível, mas não destaca a análise como preço normalizado."
              />
            )}

            {!marketValidationEnabled && (
              <ModuleNotice
                icon={ShieldCheck}
                title="Validação de lucro de mercado desativada"
                description="Valores básicos continuam visíveis, enquanto badges de confiabilidade e bloqueios automáticos ficam ocultos."
              />
            )}

            {!marketComparisonEnabled && (
              <ModuleNotice
                icon={BarChart3}
                title="Avaliação comparativa de mercado desativada"
                description="O botão de comparação foi bloqueado e nenhum endpoint de mercado será chamado."
                tone="amber"
                action={configurationButton}
              />
            )}

            {comparisonAvailable && !hasUF && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
                  <div>
                    <p className="mb-1 text-sm font-semibold text-amber-300">
                      Selecione uma região com UF para usar preços regionais
                    </p>
                    {guidedExplanationsEnabled && (
                      <p className="text-sm text-amber-200/80">
                        Sem UF, serão usados preços nacionais médios como fallback.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {comparisonAvailable && requestLocation && (
              <Card className="border-slate-800/50 bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4 text-emerald-500" />
                    Região usada na análise
                  </CardTitle>
                  {guidedExplanationsEnabled && (
                    <CardDescription className="text-xs">
                      Apenas campos permitidos pelos módulos ativos são enviados para a API.
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {requestLocation.uf && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400">UF</p>
                        <p className="text-sm font-semibold text-slate-200">{requestLocation.uf}</p>
                      </div>
                    )}
                    {requestLocation.municipio && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400">Município</p>
                        <p className="text-sm font-semibold text-slate-200">
                          {requestLocation.municipio}
                        </p>
                      </div>
                    )}
                    {requestLocation.safra && (
                      <div className="space-y-1">
                        <p className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="h-3 w-3" />
                          Safra
                        </p>
                        <p className="text-sm font-semibold text-slate-200">{requestLocation.safra}</p>
                      </div>
                    )}
                    {requestLocation.lat !== undefined && requestLocation.lon !== undefined && (
                      <div className="space-y-1">
                        <p className="flex items-center gap-1 text-xs text-slate-400">
                          <Globe className="h-3 w-3" />
                          Coordenadas
                        </p>
                        <p className="font-mono text-xs text-slate-300">
                          {requestLocation.lat.toFixed(2)}, {requestLocation.lon.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleExecutarAvaliacao}
                disabled={loading || !comparisonAvailable}
                className="gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
          </>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
              <div>
                <p className="mb-1 text-sm font-semibold text-red-300">Erro ao executar avaliação</p>
                <p className="text-sm text-red-200/80">{error}</p>
              </div>
            </div>
          </div>
        )}

        {comparisonAvailable && resultado && (
          <div className="space-y-6">
            <MarketComparisonSummaryCard
              comparacao={resultado.comparacao}
              showValidation={marketValidationEnabled}
              showGuidedExplanations={guidedExplanationsEnabled}
            />

            <Card className="border-slate-800/50 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-lg">Detalhamento por Talhão</CardTitle>
                {guidedExplanationsEnabled && (
                  <CardDescription className="text-xs">
                    Comparação detalhada entre lucro do sistema e avaliação de mercado
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <MarketComparisonTable
                  itens={resultado.avaliacao_mercado.itens}
                  showValidation={marketValidationEnabled}
                />
              </CardContent>
            </Card>

            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />
                <div>
                  <p className="mb-1 text-sm font-semibold text-blue-300">Importante</p>
                  <p className="text-sm text-blue-200/80">
                    Esta avaliação não substitui a recomendação principal.
                    {guidedExplanationsEnabled &&
                      " O lucro de mercado é usado apenas como simulação comparativa para análise de sensibilidade."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {comparisonAvailable && resultado && (
          <div className="relative py-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800/50" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-950 px-4 text-sm text-slate-400">
                Otimização Experimental
              </span>
            </div>
          </div>
        )}

        {comparisonAvailable && resultado && !experimentalAvailable && (
          <ModuleNotice
            icon={Zap}
            title={
              marketValidationEnabled
                ? "Otimização experimental desativada"
                : "Otimização experimental indisponível"
            }
            description={experimentalBlockNotice}
            tone={marketValidationEnabled ? "slate" : "amber"}
            action={configurationButton}
          />
        )}

        {comparisonAvailable && resultado && experimentalAvailable && (
          <div className="space-y-6">
            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-900/20 via-orange-900/20 to-amber-950/20 p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-amber-500/20 p-3">
                  <Zap className="h-6 w-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h2 className="mb-2 text-xl font-semibold text-amber-100">
                    Otimização Experimental por Lucro de Mercado
                  </h2>
                  {guidedExplanationsEnabled && (
                    <p className="mb-3 text-sm leading-relaxed text-amber-200/80">
                      Gera um plano otimizado usando lucro de mercado como fitness principal.
                      <strong className="text-amber-300"> Este modo é altamente experimental</strong> e não deve ser usado como recomendação principal.
                    </p>
                  )}
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                    <p className="text-xs leading-relaxed text-amber-200/90">
                      <strong>Atenção:</strong> O plano experimental pode ser bloqueado automaticamente se houver itens críticos, baixa confiabilidade nos preços ou cobertura insuficiente de dados de alta qualidade.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleExecutarOtimizacao}
                disabled={loadingOptimization}
                className="gap-2 bg-amber-600 text-white hover:bg-amber-700"
              >
                {loadingOptimization ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Executando Otimização Experimental...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Executar Otimização Experimental
                  </>
                )}
              </Button>
            </div>

            {errorOptimization && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                  <div>
                    <p className="mb-1 text-sm font-semibold text-red-300">
                      Erro ao executar otimização experimental
                    </p>
                    <p className="text-sm text-red-200/80">{errorOptimization}</p>
                  </div>
                </div>
              </div>
            )}

            {resultadoOtimizacao && (
              <div className="space-y-6">
                {resultadoOtimizacao.bloqueado ? (
                  <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                      <div>
                        <p className="mb-1 text-sm font-semibold text-red-300">
                          Uso automático bloqueado
                        </p>
                        <p className="text-sm text-red-200/80">
                          {resultadoOtimizacao.motivo_bloqueio}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <Zap className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                      <div>
                        <p className="mb-1 text-sm font-semibold text-emerald-300">
                          Simulação sem bloqueios críticos
                        </p>
                        <p className="text-sm text-emerald-200/80">
                          Este plano experimental ainda requer validação manual antes de uso.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Card className="border-slate-800/50 bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Resumo da Otimização Experimental</CardTitle>
                    {guidedExplanationsEnabled && (
                      <CardDescription className="text-xs">
                        Plano otimizado usando lucro de mercado como fitness
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400">Lucro de Mercado Total</p>
                        <p className="text-lg font-bold text-emerald-400">
                          {formatCurrencyBRL(resultadoOtimizacao.lucro_mercado_total)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400">Lucro Sistema (Ref.)</p>
                        <p className="text-lg font-bold text-slate-300">
                          {formatCurrencyBRL(resultadoOtimizacao.lucro_sistema_total_referencial)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400">Risco Médio</p>
                        <p className="text-lg font-bold text-amber-400">
                          {resultadoOtimizacao.risco_medio.toFixed(1)}%
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400">Diversidade</p>
                        <p className="text-lg font-bold text-blue-400">
                          {resultadoOtimizacao.diversidade} culturas
                        </p>
                      </div>
                    </div>

                    {marketValidationEnabled && resultadoOtimizacao.validacao_lucro_mercado && (
                      <div className="mt-6 border-t border-slate-800/50 pt-6">
                        <p className="mb-3 text-sm font-semibold text-slate-300">
                          Confiabilidade dos Dados
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                            <div className="mb-1 flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-emerald-500" />
                              <span className="text-xs font-medium text-emerald-400">Alta</span>
                            </div>
                            <p className="text-lg font-bold text-slate-200">
                              {resultadoOtimizacao.validacao_lucro_mercado.itens_alta_confiabilidade}
                            </p>
                            <p className="text-xs text-slate-400">
                              {resultadoOtimizacao.validacao_lucro_mercado.percentual_alta_confiabilidade?.toFixed(1)}%
                            </p>
                          </div>
                          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                            <div className="mb-1 flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-amber-500" />
                              <span className="text-xs font-medium text-amber-400">Média</span>
                            </div>
                            <p className="text-lg font-bold text-slate-200">
                              {resultadoOtimizacao.validacao_lucro_mercado.itens_media_confiabilidade}
                            </p>
                          </div>
                          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                            <div className="mb-1 flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-red-500" />
                              <span className="text-xs font-medium text-red-400">Críticos</span>
                            </div>
                            <p className="text-lg font-bold text-slate-200">
                              {resultadoOtimizacao.validacao_lucro_mercado.itens_criticos}
                            </p>
                            <p className="text-xs text-slate-400">
                              {resultadoOtimizacao.validacao_lucro_mercado.percentual_critico?.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
                    <div>
                      <p className="mb-1 text-sm font-semibold text-amber-300">Modo Experimental</p>
                      <p className="text-sm text-amber-200/80">{resultadoOtimizacao.aviso}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
