"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { ScenarioCard } from "@/components/cenarios/scenario-card";
import { ScenarioComparisonChart } from "@/components/cenarios/scenario-comparison-chart";
import { ScenarioRiskChart } from "@/components/cenarios/scenario-risk-chart";
import { ScenarioComparisonTable } from "@/components/cenarios/scenario-comparison-table";
import { ScenarioDetailPanel } from "@/components/cenarios/scenario-detail-panel";
import { ScenarioRanking } from "@/components/cenarios/scenario-ranking";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { ClimateImpactBanner, ClimateInactiveBanner } from "@/components/climate/climate-impact-banner";
import { ClimateRegionSelector } from "@/components/climate/climate-region-selector";
import { Card } from "@/components/ui/card";
import { getCenarios, getClimateLocation, setClimateLocation } from "@/lib/api";
import { Cenario } from "@/lib/types";
import type { ClimateLocation, ClimateData } from "@/lib/types/climate";
import { Info } from "lucide-react";

interface CenariosData {
  cenarios: {
    [key: string]: Cenario;
  };
  clima_real?: ClimateData;
}

export default function CenariosPage() {
  const [data, setData] = useState<CenariosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [climateLocation, setClimateLocationState] = useState<ClimateLocation | null>(null);
  const [showClimateSelector, setShowClimateSelector] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Obter localização climática salva
      const savedLocation = getClimateLocation();
      setClimateLocationState(savedLocation);

      // Carregar cenários com localização climática
      const result = await getCenarios(savedLocation || undefined);
      setData(result);
    } catch (err) {
      console.error("Erro ao carregar cenários:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar cenários");
    } finally {
      setLoading(false);
    }
  };

  const handleClimateLocationChange = (location: ClimateLocation | null) => {
    setClimateLocation(location);
    setClimateLocationState(location);
    loadData(); // Recarregar dados com nova localização
  };

  if (loading) {
    return (
      <div>
        <Topbar
          title="Cenários de Planejamento"
          subtitle="Compare diferentes estratégias de plantio"
        />
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <Topbar
          title="Cenários de Planejamento"
          subtitle="Compare diferentes estratégias de plantio"
        />
        <div className="p-8">
          <ErrorState
            title="Erro ao Carregar Cenários"
            message={error || "Não foi possível carregar os cenários"}
            onRetry={loadData}
          />
        </div>
      </div>
    );
  }

  const cenarios = data.cenarios;
  const selectedCenarioData = selectedScenario ? cenarios[selectedScenario] : null;

  return (
    <div>
      <Topbar
        title="Cenários de Planejamento"
        subtitle="Compare diferentes estratégias de plantio e entenda os trade-offs entre lucro, risco e sustentabilidade"
      />

      <div className="p-8 space-y-8">
        {/* Banner Climático */}
        {climateLocation && data.clima_real ? (
          <ClimateImpactBanner
            location={climateLocation}
            climateData={data.clima_real}
            onChangeRegion={() => setShowClimateSelector(true)}
            message="Cenários ajustados com dados climáticos reais"
          />
        ) : (
          <ClimateInactiveBanner
            onActivate={() => setShowClimateSelector(true)}
            message="Cenários usando dados climáticos simulados"
          />
        )}

        {/* Cards de Cenários */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(cenarios).map(([key, cenario]) => (
            <ScenarioCard
              key={key}
              id={key}
              cenario={cenario}
              onClick={() => setSelectedScenario(key)}
              isSelected={selectedScenario === key}
            />
          ))}
        </div>

        {/* Ranking */}
        <ScenarioRanking cenarios={cenarios} />

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ScenarioComparisonChart cenarios={cenarios} />
          <ScenarioRiskChart cenarios={cenarios} />
        </div>

        {/* Tabela Comparativa */}
        <ScenarioComparisonTable cenarios={cenarios} />

        {/* Explicação */}
        <Card className="bg-blue-900/10 border-blue-500/20 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg flex-shrink-0">
              <Info className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-50 mb-2">
                Como interpretar os cenários?
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Cada cenário representa uma estratégia diferente de decisão. O cenário de{" "}
                <strong className="text-amber-500">máximo lucro</strong> prioriza retorno financeiro,
                enquanto o <strong className="text-blue-500">baixo risco</strong> prioriza segurança.
                O <strong className="text-emerald-500">Algoritmo Genético</strong> busca equilibrar
                múltiplos critérios, considerando lucro, risco, compatibilidade do terreno e diversidade
                de culturas.
              </p>
            </div>
          </div>
        </Card>

        {/* Painel de Detalhes */}
        {selectedCenarioData && (
          <ScenarioDetailPanel
            cenario={selectedCenarioData}
            onClose={() => setSelectedScenario(null)}
          />
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
