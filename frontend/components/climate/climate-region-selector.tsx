"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, X } from "lucide-react";
import { CLIMATE_PRESETS, type ClimateLocation } from "@/lib/types/climate";

interface ClimateRegionSelectorProps {
  onSelect: (location: ClimateLocation | null) => void;
  onClose: () => void;
  currentLocation?: ClimateLocation | null;
}

export function ClimateRegionSelector({ onSelect, onClose, currentLocation }: ClimateRegionSelectorProps) {
  const [customLat, setCustomLat] = useState("");
  const [customLon, setCustomLon] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handlePresetSelect = (preset: ClimateLocation) => {
    onSelect(preset);
    onClose();
  };

  const handleCustomLocation = () => {
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);

    if (isNaN(lat) || isNaN(lon)) {
      alert("Por favor, insira coordenadas válidas");
      return;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      alert("Coordenadas fora do intervalo válido");
      return;
    }

    onSelect({
      lat,
      lon,
      label: customLabel || `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
      days: 30
    });
    onClose();
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada pelo navegador");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        onSelect({
          lat,
          lon,
          label: `Minha Localização (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
          days: 30
        });
        setIsGettingLocation(false);
        onClose();
      },
      (error) => {
        console.error("Erro ao obter localização:", error);
        alert("Não foi possível obter sua localização");
        setIsGettingLocation(false);
      }
    );
  };

  const handleDisable = () => {
    onSelect(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Selecionar Região Climática</h2>
              <p className="text-sm text-slate-400 mt-1">
                Escolha uma região para usar dados climáticos reais
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-300"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Localização Atual */}
          {currentLocation && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-sm text-emerald-400 font-medium">
                📍 Região atual: {currentLocation.label}
              </p>
            </div>
          )}

          {/* Regiões Predefinidas */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Regiões Predefinidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CLIMATE_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  className="justify-start h-auto py-3 px-4 border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/10"
                  onClick={() => handlePresetSelect(preset)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <MapPin className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-medium text-slate-200">{preset.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {preset.lat.toFixed(2)}, {preset.lon.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Minha Localização */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Usar Geolocalização</h3>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3 px-4 border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/10"
              onClick={handleGeolocation}
              disabled={isGettingLocation}
            >
              <div className="flex items-center gap-3">
                <Navigation className="h-5 w-5 text-blue-400" />
                <div className="text-left">
                  <p className="font-medium text-slate-200">
                    {isGettingLocation ? "Obtendo localização..." : "Usar Minha Localização"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Detectar automaticamente sua posição
                  </p>
                </div>
              </div>
            </Button>
          </div>

          {/* Coordenadas Personalizadas */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Coordenadas Personalizadas</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Latitude</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="-23.55"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Longitude</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="-46.63"
                    value={customLon}
                    onChange={(e) => setCustomLon(e.target.value)}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nome (opcional)</label>
                <Input
                  type="text"
                  placeholder="Minha Fazenda"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <Button
                variant="outline"
                className="w-full border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/10"
                onClick={handleCustomLocation}
                disabled={!customLat || !customLon}
              >
                Usar Coordenadas Personalizadas
              </Button>
            </div>
          </div>

          {/* Desativar */}
          <div className="pt-4 border-t border-slate-700">
            <Button
              variant="ghost"
              className="w-full text-slate-400 hover:text-slate-300 hover:bg-slate-800"
              onClick={handleDisable}
            >
              Desativar Clima Real (usar dados simulados)
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
