"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { FieldCard } from "@/components/talhoes/field-card";
import { FieldFilterBar } from "@/components/talhoes/field-filter-bar";
import { FieldSummaryCards } from "@/components/talhoes/field-summary-cards";
import { FieldDistributionChart } from "@/components/talhoes/field-distribution-chart";
import { FieldDetailPanel } from "@/components/talhoes/field-detail-panel";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { ClimateInactiveBanner } from "@/components/climate/climate-impact-banner";
import { ClimateRegionSelector } from "@/components/climate/climate-region-selector";
import { getTalhoes, getRecomendacoes, getClimateLocation, setClimateLocation } from "@/lib/api";
import type { ClimateLocation } from "@/lib/types/climate";
import { ZarcImpactBanner } from "@/components/zarc/zarc-impact-banner";

interface Talhao {
  id: number;
  area: number;
  solo: string;
  clima: string;
  relevo: string;
  agua: string;
  cultura?: string;
  lucro_estimado?: number;
  risco?: number;
  nota?: number;
  zarc?: any; // Dados ZARC da recomendação
  preco_real?: any; // Dados de preço da recomendação
}

interface RecomendacoesResponse {
  recomendacoes: any[];
  zarc?: {
    ativo: boolean;
    uf?: string;
    municipio?: string;
    safra?: string;
    source?: string;
    fallback?: boolean;
    culturas_com_zarc?: number;
    total_culturas?: number;
  };
  precos?: {
    ativo: boolean;
    source?: string;
    fallback_count?: number;
    culturas_com_preco?: number;
    culturas_sem_preco?: number;
    total_culturas?: number;
    aplicado_no_lucro?: boolean;
    uf?: string;
  };
}

export default function TalhoesPage() {
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTalhao, setSelectedTalhao] = useState<Talhao | null>(null);
  const [climateLocation, setClimateLocationState] = useState<ClimateLocation | null>(null);
  const [showClimateSelector, setShowClimateSelector] = useState(false);
  const [zarcSummary, setZarcSummary] = useState<RecomendacoesResponse['zarc'] | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [soloFilter, setSoloFilter] = useState("todos");
  const [climaFilter, setClimaFilter] = useState("todos");
  const [aguaFilter, setAguaFilter] = useState("todos");

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Obter localização climática salva
      const savedLocation = getClimateLocation();
      setClimateLocationState(savedLocation);

      // Busca talhões e recomendações em paralelo
      const [talhoesData, recomendacoesData] = await Promise.all([
        getTalhoes(),
        getRecomendacoes(savedLocation || undefined) // Passa location para incluir ZARC
      ]);
      
      // Salvar resumo ZARC
      if (recomendacoesData.zarc) {
        setZarcSummary(recomendacoesData.zarc);
      }
      
      // Combina dados dos talhões com recomendações
      const talhoesComRecomendacao = talhoesData.talhoes.map((talhao: any) => {
        const recomendacao = recomendacoesData.recomendacoes.find((r: any) => r.talhao === talhao.id);
        
        return {
          id: talhao.id,
          area: talhao.area,
          solo: talhao.solo,
          clima: talhao.clima,
          relevo: talhao.relevo,
          agua: talhao.agua,
          cultura: recomendacao?.cultura,
          lucro_estimado: recomendacao?.lucro_estimado,
          risco: recomendacao?.risco,
          nota: recomendacao?.nota,
          zarc: recomendacao?.zarc, // Incluir dados ZARC
          preco_real: recomendacao?.preco_real // Incluir dados de preço
        };
      });

      setTalhoes(talhoesComRecomendacao);
    } catch (err) {
      console.error("Erro ao carregar talhões:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleClimateLocationChange = (location: ClimateLocation | null) => {
    setClimateLocation(location);
    setClimateLocationState(location);
    // Recarregar dados com nova localização
    loadData();
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadData();
    }
  }, []);

  // Filtros
  const filteredTalhoes = talhoes.filter((talhao) => {
    const matchSearch = searchTerm === "" || 
      talhao.id.toString().includes(searchTerm) ||
      talhao.cultura?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchSolo = soloFilter === "todos" || talhao.solo.toLowerCase() === soloFilter.toLowerCase();
    const matchClima = climaFilter === "todos" || talhao.clima.toLowerCase() === climaFilter.toLowerCase();
    const matchAgua = aguaFilter === "todos" || talhao.agua.toLowerCase() === aguaFilter.toLowerCase();

    return matchSearch && matchSolo && matchClima && matchAgua;
  });

  // Cálculos para resumo
  const areaTotal = talhoes.reduce((sum, t) => sum + t.area, 0);
  
  const soloCount = talhoes.reduce((acc, t) => {
    acc[t.solo] = (acc[t.solo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const soloMaisComum = Object.entries(soloCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  const culturaCount = talhoes.reduce((acc, t) => {
    if (t.cultura) {
      acc[t.cultura] = (acc[t.cultura] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const culturaMaisRecomendada = Object.entries(culturaCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  const riscoMedio = talhoes.reduce((sum, t) => sum + (t.risco || 0), 0) / talhoes.length || 0;
  const diversidade = Object.keys(culturaCount).length;

  // Dados para gráfico de distribuição de solos
  const soloDistribution = Object.entries(soloCount).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  // Dados para gráfico de área por cultura
  const culturaAreaData = Object.entries(
    talhoes.reduce((acc, t) => {
      if (t.cultura) {
        acc[t.cultura] = (acc[t.cultura] || 0) + t.area;
      }
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const handleClearFilters = () => {
    setSearchTerm("");
    setSoloFilter("todos");
    setClimaFilter("todos");
    setAguaFilter("todos");
  };

  return (
    <div>
      <Topbar
        title="Talhões"
        subtitle="Visualize as características dos talhões e as recomendações de plantio para cada área"
      />

      <div className="p-8 space-y-8">
        {/* Banner Climático */}
        {climateLocation && (
          <ClimateInactiveBanner
            onActivate={() => setShowClimateSelector(true)}
            message={`Recomendações ajustadas pelo clima real da região: ${climateLocation.label}`}
          />
        )}

        {/* Banner ZARC */}
        {zarcSummary && zarcSummary.ativo && climateLocation?.uf && climateLocation?.municipio && (
          <ZarcImpactBanner
            zarc={zarcSummary}
            onChangeRegion={() => setShowClimateSelector(true)}
          />
        )}

        {/* Aviso se tem clima mas não tem UF/município */}
        {climateLocation && (!climateLocation.uf || !climateLocation.municipio) && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-yellow-500 mt-0.5">⚠️</div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-500 mb-1">
                  ZARC não disponível
                </h3>
                <p className="text-sm text-slate-300">
                  Para incluir janelas de plantio ZARC, selecione uma região com município e UF específicos.
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
        )}

        {/* Erro */}
        {error && !loading && (
          <ErrorState onRetry={loadData} />
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </div>
          </div>
        )}

        {/* Conteúdo */}
        {!loading && !error && (
          <>
            {/* Cards de Resumo */}
            <FieldSummaryCards
              totalTalhoes={talhoes.length}
              areaTotal={areaTotal}
              soloMaisComum={soloMaisComum}
              culturaMaisRecomendada={culturaMaisRecomendada}
              riscoMedio={riscoMedio}
              diversidade={diversidade}
            />

            {/* Filtros */}
            <FieldFilterBar
              searchTerm={searchTerm}
              soloFilter={soloFilter}
              climaFilter={climaFilter}
              aguaFilter={aguaFilter}
              onSearchChange={setSearchTerm}
              onSoloChange={setSoloFilter}
              onClimaChange={setClimaFilter}
              onAguaChange={setAguaFilter}
              onClearFilters={handleClearFilters}
            />

            {/* Grid de Talhões */}
            <div>
              <h2 className="text-xl font-semibold text-slate-50 mb-4">
                Talhões ({filteredTalhoes.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTalhoes.map((talhao) => (
                  <FieldCard
                    key={talhao.id}
                    talhao={talhao}
                    onClick={() => setSelectedTalhao(talhao)}
                  />
                ))}
              </div>

              {filteredTalhoes.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-400">Nenhum talhão encontrado com os filtros aplicados.</p>
                </div>
              )}
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FieldDistributionChart
                data={soloDistribution}
                title="Distribuição de Solos"
                subtitle="Quantidade de talhões por tipo de solo"
              />
              <FieldDistributionChart
                data={culturaAreaData}
                title="Área por Cultura"
                subtitle="Hectares recomendados por cultura"
              />
            </div>
          </>
        )}
      </div>

      {/* Painel de Detalhes */}
      {selectedTalhao && (
        <FieldDetailPanel
          talhao={selectedTalhao}
          onClose={() => setSelectedTalhao(null)}
        />
      )}

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
