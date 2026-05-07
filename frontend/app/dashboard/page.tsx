"use client";

import { useEffect, useState } from "react";
import { getDashboard, getCenarios } from "@/lib/api";
import { DashboardData, Cenario } from "@/lib/types";
import { Topbar } from "@/components/layout/topbar";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ScenarioProfitChart } from "@/components/dashboard/scenario-profit-chart";
import { ScenarioRiskChart } from "@/components/dashboard/scenario-risk-chart";
import { RecommendedPlan } from "@/components/dashboard/recommended-plan";
import { DecisionSummary } from "@/components/dashboard/decision-summary";
import { LoadingCard, LoadingChart } from "@/components/shared/loading-card";
import { ErrorState } from "@/components/shared/error-state";
import { formatCurrencyBRL, formatPercent, formatFitness, formatCurrencyCompactBRL, formatLargeNumber } from "@/lib/formatters";
import { QuickActions } from "@/components/dashboard/quick-actions";

import { TrendingUp, AlertTriangle, Gauge, Sprout, CheckCircle2 } from "lucide-react";

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

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [cenarios, setCenarios] = useState<Record<string, Cenario> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Carrega dashboard e cenários em paralelo
      const [dashboardData, cenariosData] = await Promise.all([
        getDashboard(),
        getCenarios()
      ]);
      
      setDashboard(dashboardData);
      setCenarios(cenariosData.cenarios);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError(err instanceof Error ? err.message : "Erro ao conectar com o backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Só executa no cliente
    if (typeof window !== 'undefined') {
      loadData();
    }
  }, []);

  return (
    <div>
      <Topbar
        title="Dashboard"
        subtitle="Visão geral do planejamento agrícola"
      />

      <div className="p-8 space-y-8">
        {/* Estado de erro */}
        {error && !loading && (
          <ErrorState onRetry={loadData} />
        )}

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

            {/* Coluna direita: Decisão e Ações (1/3 da largura) */}
            <div className="space-y-6">
              <DecisionSummary 
                objetivo={dashboard.objetivo}
                validacao={dashboard.validacao}
              />
              
              <QuickActions />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
