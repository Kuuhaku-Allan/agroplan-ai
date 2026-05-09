import { DollarSign, TrendingUp, AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { PriceSummary } from "@/lib/types";

interface PriceImpactBannerProps {
  precos: PriceSummary;
  onViewDetails?: () => void;
}

export function PriceImpactBanner({ precos, onViewDetails }: PriceImpactBannerProps) {
  if (!precos.ativo) {
    return null;
  }

  const coveragePercent = precos.total_culturas 
    ? Math.round((precos.culturas_com_preco || 0) / precos.total_culturas * 100)
    : 0;
  
  const hasFallback = (precos.fallback_count || 0) > 0;
  const isFullCoverage = coveragePercent === 100;
  const isNormalized = precos.normalizacao?.ativa && (precos.normalizacao?.culturas_normalizadas || 0) > 0;
  
  // Determinar cor baseado na cobertura e fallback
  const colorClass = isFullCoverage && !hasFallback
    ? "bg-emerald-500/10 border-emerald-500/20"
    : hasFallback
    ? "bg-amber-500/10 border-amber-500/20"
    : "bg-blue-500/10 border-blue-500/20";
  
  const iconColorClass = isFullCoverage && !hasFallback
    ? "text-emerald-500"
    : hasFallback
    ? "text-amber-500"
    : "text-blue-500";

  return (
    <div className={`${colorClass} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <div className={`${iconColorClass} mt-0.5`}>
          <DollarSign className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium ${iconColorClass} mb-1`}>
            Preços Agrícolas Disponíveis
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <TrendingUp className="w-4 h-4" />
              <span>
                <strong>{precos.culturas_com_preco || 0}</strong> de{" "}
                <strong>{precos.total_culturas || 0}</strong> culturas com preço
                {precos.uf && ` (${precos.uf})`}
              </span>
            </div>
            
            {isNormalized && (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  <strong>{precos.normalizacao?.culturas_normalizadas || 0}</strong> culturas normalizadas para R$/tonelada
                </span>
              </div>
            )}
            
            {hasFallback && (
              <div className="flex items-start gap-2 text-sm text-amber-400">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  {precos.fallback_count} cultura(s) usando preço de referência (fallback)
                </span>
              </div>
            )}
            
            {precos.lucro_recalculado_disponivel && (
              <div className="flex items-start gap-2 text-sm text-blue-400">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Lucro de mercado disponível como comparação experimental
                </span>
              </div>
            )}
            
            <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-700/50">
              <div className="flex items-start gap-1.5">
                <span className="font-medium">Fonte:</span>
                <span>
                  {precos.source === "price-local-index" && "Índice local de preços"}
                  {precos.source === "price-fallback" && "Preços de referência (fallback)"}
                  {precos.source === "mixed" && "Misto (índice + fallback)"}
                  {!precos.source && "Índice local"}
                </span>
              </div>
              
              <div className="flex items-start gap-1.5 mt-1">
                <span className="font-medium">Aplicado ao lucro:</span>
                <span className={precos.aplicado_no_lucro ? "text-emerald-400" : "text-slate-400"}>
                  {precos.aplicado_no_lucro ? "Sim" : "Não"}
                </span>
              </div>
              
              {!precos.aplicado_no_lucro && (
                <div className="mt-2 p-2 bg-slate-800/50 rounded text-xs text-slate-400">
                  ℹ️ Os preços são normalizados para R$/tonelada, mas o lucro principal ainda utiliza a base interna do sistema. O lucro de mercado é exibido apenas como comparação experimental.
                </div>
              )}
            </div>
          </div>
          
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Ver detalhes dos preços
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PriceInactiveBanner({ onActivate }: { onActivate?: () => void }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="text-slate-500 mt-0.5">
          <DollarSign className="w-5 h-5" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-medium text-slate-400 mb-1">
            Preços Agrícolas
          </h3>
          <p className="text-sm text-slate-500">
            Preços de referência disponíveis para consulta
          </p>
          
          {onActivate && (
            <button
              onClick={onActivate}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Ver preços disponíveis
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
