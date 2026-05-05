"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { ValidationObjectiveSelector } from "@/components/validacao/validation-objective-selector";
import { ValidationSummaryCards } from "@/components/validacao/validation-summary-cards";
import { AGvsBruteforceCard } from "@/components/validacao/ag-vs-bruteforce-card";
import { ValidationComparisonTable } from "@/components/validacao/validation-comparison-table";
import { StabilityAnalysisCard } from "@/components/validacao/stability-analysis-card";
import { ScalabilityExplanation } from "@/components/validacao/scalability-explanation";
import { BruteforceUnfeasibleCard } from "@/components/validacao/bruteforce-unfeasible-card";
import { ErrorState } from "@/components/shared/error-state";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { validar, rodadas as executarRodadas } from "@/lib/api";
import { ResultadoValidacao } from "@/lib/types";
import { CheckCircle2 } from "lucide-react";

interface RodadasResult {
  rodadas: number;
  melhor_fitness: number;
  fitness_medio: number;
  pior_fitness: number;
  desvio_padrao: number;
  coeficiente_variacao: number;
}

export default function ValidacaoPage() {
  const [validacao, setValidacao] = useState<ResultadoValidacao | null>(null);
  const [rodadasResult, setRodadasResult] = useState<RodadasResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"validacao" | "rodadas" | null>(null);
  const [forcaBrutaInviavel, setForcaBrutaInviavel] = useState<{ inviavel: boolean; combinacoes: number } | null>(null);

  const handleValidate = async (objetivo: string) => {
    setLoading(true);
    setError(null);
    setValidacao(null);
    setRodadasResult(null);
    setForcaBrutaInviavel(null);
    setActiveTab("validacao");

    try {
      const data = await validar(objetivo);
      
      // Se força bruta é inviável, executa rodadas automaticamente
      if (data.erro && data.forcaBrutaInviavel) {
        // Extrai número de combinações da mensagem
        const match = data.mensagem?.match(/\((\d+)\)/);
        const combinacoes = match ? parseInt(match[1]) : 10000000000;
        
        setForcaBrutaInviavel({ inviavel: true, combinacoes });
        setActiveTab("rodadas");
        
        const rodadasData = await executarRodadas(objetivo, 10);
        setRodadasResult(rodadasData);
      } else if (data.erro) {
        setError(data.mensagem || "Erro ao executar validação");
      } else {
        setValidacao(data);
      }
    } catch (err) {
      console.error("Erro ao validar:", err);
      const errorMsg = err instanceof Error ? err.message : "Erro ao executar validação";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteRodadas = async (objetivo: string, numRodadas: number) => {
    setLoading(true);
    setError(null);
    setRodadasResult(null);
    setActiveTab("rodadas");

    try {
      const data = await executarRodadas(objetivo, numRodadas);
      setRodadasResult(data);
    } catch (err) {
      console.error("Erro ao executar rodadas:", err);
      setError(err instanceof Error ? err.message : "Erro ao executar rodadas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Topbar
        title="Validação do Algoritmo"
        subtitle="Compare o resultado do AG com força bruta e avalie sua estabilidade"
      />

      <div className="p-8 space-y-8">
        {/* Configuração */}
        <ValidationObjectiveSelector
          onValidate={handleValidate}
          onExecuteRodadas={handleExecuteRodadas}
          loading={loading}
        />

        {/* Estado inicial */}
        {!validacao && !rodadasResult && !loading && !error && (
          <Card className="bg-slate-900/50 border-slate-800/50 p-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-blue-500/10 rounded-full">
                <CheckCircle2 className="w-12 h-12 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-50 mb-2">
                  Pronto para Validar
                </h3>
                <p className="text-slate-400 max-w-md">
                  Selecione um objetivo e execute a validação com força bruta ou análise de estabilidade
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-slate-900/50 border-slate-800/50 p-5">
                  <Skeleton className="h-4 w-32 bg-slate-800 mb-3" />
                  <Skeleton className="h-8 w-24 bg-slate-800 mb-2" />
                  <Skeleton className="h-3 w-20 bg-slate-800" />
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Erro */}
        {error && !loading && (
          <ErrorState
            title="Erro na Validação"
            message={error}
            onRetry={() => handleValidate("equilibrado")}
          />
        )}

        {/* Resultados da Validação */}
        {validacao && !loading && activeTab === "validacao" && (
          <div className="space-y-6">
            {/* Cards de resumo */}
            <ValidationSummaryCards
              totalCombinacoes={validacao.forca_bruta.total_combinacoes}
              fitnessAG={validacao.ag.fitness}
              fitnessFB={validacao.forca_bruta.melhor_fitness}
              otimoGlobal={validacao.ag_encontrou_otimo_global}
              diferencaFitness={validacao.diferenca_fitness}
              diferencaLucro={validacao.diferenca_lucro}
            />

            {/* Comparação AG vs Força Bruta */}
            <AGvsBruteforceCard
              ag={{
                fitness: validacao.ag.fitness,
                lucro_total: validacao.ag.lucro_total,
                risco_medio: validacao.ag.risco_medio,
                culturas: validacao.ag.plano.map(p => p.cultura)
              }}
              forcaBruta={{
                fitness: validacao.forca_bruta.melhor_fitness,
                lucro_total: validacao.forca_bruta.lucro_total,
                risco_medio: validacao.forca_bruta.risco_medio,
                culturas: validacao.forca_bruta.plano.map(p => p.cultura)
              }}
              otimoGlobal={validacao.ag_encontrou_otimo_global}
            />

            {/* Tabela comparativa */}
            <ValidationComparisonTable
              ag={{
                fitness: validacao.ag.fitness,
                lucro_total: validacao.ag.lucro_total,
                risco_medio: validacao.ag.risco_medio
              }}
              forcaBruta={{
                fitness: validacao.forca_bruta.melhor_fitness,
                lucro_total: validacao.forca_bruta.lucro_total,
                risco_medio: validacao.forca_bruta.risco_medio
              }}
              diferencaFitness={validacao.diferenca_fitness}
              diferencaLucro={validacao.diferenca_lucro}
              otimoGlobal={validacao.ag_encontrou_otimo_global}
            />

            {/* Explicação de escalabilidade */}
            <ScalabilityExplanation />
          </div>
        )}

        {/* Resultados das Rodadas */}
        {rodadasResult && !loading && activeTab === "rodadas" && (
          <div className="space-y-6">
            {/* Card de força bruta inviável */}
            {forcaBrutaInviavel?.inviavel && (
              <BruteforceUnfeasibleCard totalCombinacoes={forcaBrutaInviavel.combinacoes} />
            )}

            {/* Análise de estabilidade */}
            <StabilityAnalysisCard
              rodadas={rodadasResult.rodadas}
              melhorFitness={rodadasResult.melhor_fitness}
              fitnessMedio={rodadasResult.fitness_medio}
              piorFitness={rodadasResult.pior_fitness}
              desvioPadrao={rodadasResult.desvio_padrao}
              coeficienteVariacao={rodadasResult.coeficiente_variacao}
            />

            {/* Explicação de escalabilidade */}
            <ScalabilityExplanation />
          </div>
        )}
      </div>
    </div>
  );
}
