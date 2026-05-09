import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, MapPin, Layers, Thermometer, Mountain, Droplets, Sprout, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatCurrencyBRL } from "@/lib/formatters";
import { ZarcWindowCard } from "@/components/zarc/zarc-window-card";
import { PriceInfoCard } from "@/components/prices/price-info-card";
import { MarketProfitComparison } from "@/components/prices/market-profit-comparison";

interface FieldDetailPanelProps {
  talhao: {
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
    zarc?: any; // Dados ZARC
    preco_real?: any; // Dados de preço
    lucro_mercado_estimado?: number; // Lucro de mercado
    lucro_mercado_aplicado?: boolean; // Se aplicado
  };
  onClose: () => void;
}

export function FieldDetailPanel({ talhao, onClose }: FieldDetailPanelProps) {
  const compatibilidade = Math.min(100, talhao.nota || 0);

  const getCompatibilidadeLabel = (nota: number) => {
    if (nota >= 75) return { label: "Excelente", color: "text-green-500" };
    if (nota >= 60) return { label: "Boa", color: "text-amber-500" };
    return { label: "Regular", color: "text-red-500" };
  };

  const compLabel = getCompatibilidadeLabel(compatibilidade);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-slate-900 border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <MapPin className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-50">Talhão {talhao.id}</h2>
              <p className="text-slate-400">{talhao.area} hectares</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-slate-700 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Características */}
          <div>
            <h3 className="text-lg font-semibold text-slate-50 mb-4">Características do Terreno</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                <Layers className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Solo</p>
                  <p className="text-base font-semibold text-slate-200 capitalize">{talhao.solo}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                <Thermometer className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Clima</p>
                  <p className="text-base font-semibold text-slate-200 capitalize">{talhao.clima}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                <Mountain className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Relevo</p>
                  <p className="text-base font-semibold text-slate-200 capitalize">{talhao.relevo}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                <Droplets className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Disponibilidade de Água</p>
                  <p className="text-base font-semibold text-slate-200 capitalize">{talhao.agua}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recomendação */}
          {talhao.cultura && (
            <>
              <div className="border-t border-slate-800 pt-6">
                <h3 className="text-lg font-semibold text-slate-50 mb-4">Cultura Recomendada</h3>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-emerald-500/10 rounded-lg">
                    <Sprout className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-500">{talhao.cultura.toUpperCase()}</p>
                    <p className="text-sm text-slate-400">Melhor opção para este talhão</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">Lucro Estimado</span>
                    </div>
                    <p className="text-xl font-bold text-slate-50">
                      {talhao.lucro_estimado ? formatCurrencyBRL(talhao.lucro_estimado) : "N/A"}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">Nível de Risco</span>
                    </div>
                    <p className="text-xl font-bold text-slate-50">
                      {talhao.risco ? `${talhao.risco}%` : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Compatibilidade */}
                <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="font-semibold text-slate-200">Compatibilidade</span>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${compLabel.color}`}>{compatibilidade.toFixed(1)}%</p>
                      <p className={`text-sm ${compLabel.color}`}>{compLabel.label}</p>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${compatibilidade >= 75 ? 'bg-green-500' : compatibilidade >= 60 ? 'bg-amber-500' : 'bg-red-500'} transition-all`}
                      style={{ width: `${compatibilidade}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Explicação */}
              <div className="border-t border-slate-800 pt-6">
                <h3 className="text-lg font-semibold text-slate-50 mb-3">Por que esta cultura?</h3>
                <p className="text-slate-300 leading-relaxed">
                  A cultura <strong className="text-emerald-500">{talhao.cultura}</strong> foi recomendada 
                  para este talhão considerando a compatibilidade com o solo <strong>{talhao.solo}</strong>, 
                  clima <strong>{talhao.clima}</strong>, relevo <strong>{talhao.relevo}</strong> e 
                  disponibilidade de água <strong>{talhao.agua}</strong>. Esta combinação oferece 
                  um bom equilíbrio entre retorno financeiro e adequação agronômica.
                </p>
              </div>

              {/* Janela de Plantio ZARC */}
              {talhao.zarc && talhao.zarc.ativo && (
                <div className="border-t border-slate-800 pt-6">
                  <h3 className="text-lg font-semibold text-slate-50 mb-4">Janela de Plantio ZARC</h3>
                  <ZarcWindowCard zarc={talhao.zarc} cultura={talhao.cultura} />
                </div>
              )}

              {talhao.zarc && !talhao.zarc.ativo && (
                <div className="border-t border-slate-800 pt-6">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-slate-400">
                      {talhao.zarc.message || "Sem janela ZARC encontrada para esta cultura, solo e região."}
                    </p>
                  </div>
                </div>
              )}

              {/* Preço de Referência */}
              {talhao.preco_real && (
                <div className="border-t border-slate-800 pt-6">
                  <h3 className="text-lg font-semibold text-slate-50 mb-4">Preço de Referência</h3>
                  <PriceInfoCard preco={talhao.preco_real} cultura={talhao.cultura} />
                  
                  {/* Comparação de Lucro de Mercado */}
                  {talhao.lucro_mercado_estimado !== undefined && talhao.lucro_mercado_estimado !== null && (
                    <div className="mt-4">
                      <MarketProfitComparison
                        lucroSistema={talhao.lucro_estimado || 0}
                        lucroMercado={talhao.lucro_mercado_estimado}
                        aplicado={talhao.lucro_mercado_aplicado}
                      />
                    </div>
                  )}
                  
                  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-400">
                      ℹ️ O lucro principal ainda usa a base interna do sistema. O lucro de mercado é uma estimativa experimental.
                    </p>
                  </div>
                </div>
              )}

              {talhao.preco_real && !talhao.preco_real.ativo && (
                <div className="border-t border-slate-800 pt-6">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-slate-400">
                      Preço de referência não disponível para {talhao.cultura}.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {!talhao.cultura && (
            <div className="text-center py-8">
              <p className="text-slate-400">Nenhuma cultura recomendada disponível para este talhão.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
