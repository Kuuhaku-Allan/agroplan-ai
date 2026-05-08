"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cloud, MapPin, Thermometer, Droplets, AlertTriangle, Settings } from "lucide-react";
import type { ClimateLocation, ClimateData } from "@/lib/types/climate";

interface ClimateImpactBannerProps {
  location: ClimateLocation;
  climateData?: ClimateData;
  onChangeRegion?: () => void;
  message?: string;
}

export function ClimateImpactBanner({ 
  location, 
  climateData, 
  onChangeRegion,
  message = "Planejamento ajustado com dados climáticos reais"
}: ClimateImpactBannerProps) {
  
  if (!climateData || !climateData.ativo) {
    return null;
  }

  const getRiscoColor = (risco?: string) => {
    switch (risco) {
      case 'alto': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medio': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'baixo': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border-emerald-500/30">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-emerald-400">{message}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Região: {location.label} • Fonte: {climateData.source === 'open-meteo' ? 'Open-Meteo' : 'Simulado'}
                {climateData.fallback && ' (Fallback)'}
              </p>
            </div>
          </div>

          {/* Métricas Compactas */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Temperatura */}
            {climateData.temperatura_media !== undefined && (
              <div className="flex items-center gap-1.5">
                <Thermometer className="h-4 w-4 text-orange-400" />
                <span className="text-sm text-slate-300">
                  {climateData.temperatura_media.toFixed(1)}°C
                </span>
              </div>
            )}

            {/* Precipitação */}
            {climateData.precipitacao_total !== undefined && (
              <div className="flex items-center gap-1.5">
                <Droplets className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-slate-300">
                  {climateData.precipitacao_total.toFixed(1)}mm
                </span>
              </div>
            )}

            {/* Risco */}
            {climateData.risco_climatico_estimado && (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <Badge className={`text-xs ${getRiscoColor(climateData.risco_climatico_estimado)}`}>
                  Risco {climateData.risco_climatico_estimado}
                </Badge>
              </div>
            )}

            {/* Ajuste */}
            {climateData.ajuste_risco !== undefined && climateData.ajuste_risco !== 0 && (
              <Badge variant="outline" className="text-xs border-slate-600">
                Ajuste: {climateData.ajuste_risco > 0 ? '+' : ''}
                {(climateData.ajuste_risco * 100).toFixed(1)}%
              </Badge>
            )}
          </div>

          {/* Aviso de Fallback */}
          {climateData.fallback && (
            <div className="text-xs text-amber-400/80 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 inline-block">
              ⚠️ Usando dados simulados (API indisponível)
            </div>
          )}
        </div>

        {/* Botão de Alterar */}
        {onChangeRegion && (
          <Button
            variant="outline"
            size="sm"
            onClick={onChangeRegion}
            className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 flex-shrink-0"
          >
            <Settings className="h-4 w-4 mr-2" />
            Alterar Região
          </Button>
        )}
      </div>
    </Card>
  );
}

interface ClimateInactiveBannerProps {
  onActivate?: () => void;
  message?: string;
}

export function ClimateInactiveBanner({ 
  onActivate,
  message = "Usando dados climáticos simulados"
}: ClimateInactiveBannerProps) {
  return (
    <Card className="p-4 bg-slate-800/50 border-slate-700">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5 text-slate-400" />
          <div>
            <p className="text-sm font-medium text-slate-300">{message}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecione uma região para usar dados climáticos reais
            </p>
          </div>
        </div>
        {onActivate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onActivate}
            className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 flex-shrink-0"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Selecionar Região
          </Button>
        )}
      </div>
    </Card>
  );
}
