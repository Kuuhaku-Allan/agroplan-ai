"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cloud, Droplets, Thermometer, AlertTriangle, MapPin, X } from "lucide-react";
import type { ClimateData, ClimateLocation } from "@/lib/types/climate";

interface ClimateRegionCardProps {
  location: ClimateLocation;
  climateData?: ClimateData;
  onRemove?: () => void;
  onRefresh?: () => void;
}

export function ClimateRegionCard({ location, climateData, onRemove, onRefresh }: ClimateRegionCardProps) {
  if (!climateData || !climateData.ativo) {
    return (
      <Card className="p-4 bg-slate-800/50 border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-300">Clima Real Desativado</p>
              <p className="text-xs text-slate-500">Usando dados simulados</p>
            </div>
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-slate-400 hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const getRiscoColor = (risco?: string) => {
    switch (risco) {
      case 'alto': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medio': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'baixo': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getAjusteColor = (ajuste?: number) => {
    if (!ajuste) return 'text-slate-400';
    if (ajuste > 0) return 'text-red-400';
    if (ajuste < 0) return 'text-emerald-400';
    return 'text-slate-400';
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-emerald-900/20 to-slate-900/20 border-emerald-500/30">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-emerald-400">{location.label}</p>
              <p className="text-xs text-slate-400">
                {climateData.source === 'open-meteo' ? 'Open-Meteo' : 'Simulado'}
                {climateData.fallback && ' (Fallback)'}
              </p>
            </div>
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-slate-400 hover:text-slate-300 -mt-1 -mr-1"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-3">
          {/* Temperatura */}
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-orange-400" />
            <div>
              <p className="text-xs text-slate-400">Temperatura</p>
              <p className="text-sm font-semibold text-slate-200">
                {climateData.temperatura_media?.toFixed(1) || 'N/A'}°C
              </p>
            </div>
          </div>

          {/* Precipitação */}
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-400" />
            <div>
              <p className="text-xs text-slate-400">Chuva (30d)</p>
              <p className="text-sm font-semibold text-slate-200">
                {climateData.precipitacao_total?.toFixed(1) || 'N/A'}mm
              </p>
            </div>
          </div>
        </div>

        {/* Classificações */}
        <div className="flex items-center gap-2 flex-wrap">
          {climateData.clima_observado && (
            <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
              {climateData.clima_observado}
            </Badge>
          )}
          {climateData.agua_observada && (
            <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
              água {climateData.agua_observada}
            </Badge>
          )}
        </div>

        {/* Risco e Ajuste */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <Badge className={getRiscoColor(climateData.risco_climatico_estimado)}>
              Risco {climateData.risco_climatico_estimado || 'N/A'}
            </Badge>
          </div>
          
          {climateData.ajuste_risco !== undefined && climateData.ajuste_risco !== 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-400">Ajuste</p>
              <p className={`text-sm font-semibold ${getAjusteColor(climateData.ajuste_risco)}`}>
                {climateData.ajuste_risco > 0 ? '+' : ''}
                {(climateData.ajuste_risco * 100).toFixed(1)}%
              </p>
            </div>
          )}
        </div>

        {/* Aviso de Fallback */}
        {climateData.fallback && (
          <div className="text-xs text-amber-400/80 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
            ⚠️ Usando dados simulados (API indisponível)
          </div>
        )}
      </div>
    </Card>
  );
}
