import { DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PriceData } from "@/lib/types";

interface PriceInfoCardProps {
  preco: PriceData;
  cultura?: string;
  compact?: boolean;
}

export function PriceInfoCard({ preco, cultura, compact = false }: PriceInfoCardProps) {
  if (!preco.ativo) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50 p-3">
        <div className="flex items-center gap-2 text-slate-500">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">
            Preço não disponível para {cultura || preco.cultura || "esta cultura"}
          </span>
        </div>
      </Card>
    );
  }

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getSourceLabel = (source?: string) => {
    switch (source) {
      case "price-local-index":
        return "Índice local";
      case "price-fallback":
        return "Referência";
      case "conab":
        return "Conab";
      default:
        return "Índice local";
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <DollarSign className="w-4 h-4 text-emerald-500" />
        <span className="text-slate-300">
          Preço ref.: <strong className="text-white">{formatPrice(preco.preco || 0)}</strong>
          {preco.unidade && ` / ${preco.unidade}`}
        </span>
        {preco.fallback && (
          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
            Fallback
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-medium text-slate-200">
              {cultura || preco.cultura?.toUpperCase() || "Cultura"}
            </h3>
            {preco.fallback && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                Fallback
              </span>
            )}
          </div>
          
          <div className="space-y-2">
            <div>
              <div className="text-2xl font-bold text-white">
                {formatPrice(preco.preco || 0)}
              </div>
              {preco.unidade && (
                <div className="text-xs text-slate-400 mt-0.5">
                  por {preco.unidade.replace(/_/g, " ")}
                </div>
              )}
            </div>
            
            <div className="pt-2 border-t border-slate-700/50 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Fonte:</span>
                <span className="text-slate-300">{getSourceLabel(preco.source)}</span>
              </div>
              
              {preco.uf && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Região:</span>
                  <span className="text-slate-300">{preco.uf}</span>
                </div>
              )}
              
              {preco.data_referencia && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Data ref.:</span>
                  <span className="text-slate-300">
                    {new Date(preco.data_referencia).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}
            </div>
            
            {preco.observacao && (
              <div className="mt-2 p-2 bg-slate-800/50 rounded text-xs text-slate-400">
                {preco.observacao}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
