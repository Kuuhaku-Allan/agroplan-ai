/**
 * Tipos relacionados a dados climáticos
 */

export interface ClimateLocation {
  lat: number;
  lon: number;
  label: string;
  days?: number;
}

export interface ClimateData {
  ativo: boolean;
  source?: string;
  latitude?: number;
  longitude?: number;
  temperatura_media?: number;
  temperatura_maxima?: number;
  temperatura_minima?: number;
  precipitacao_total?: number;
  evapotranspiracao?: number;
  umidade_media?: number;
  radiacao_solar?: number;
  risco_climatico_estimado?: string;
  clima_observado?: string;
  agua_observada?: string;
  ajuste_risco?: number;
  fallback?: boolean;
  error?: string | null;
}

export const CLIMATE_PRESETS: ClimateLocation[] = [
  {
    lat: -23.55,
    lon: -46.63,
    label: "São Paulo - SP",
    days: 30
  },
  {
    lat: -15.78,
    lon: -47.93,
    label: "Brasília - DF",
    days: 30
  },
  {
    lat: -21.17,
    lon: -47.81,
    label: "Ribeirão Preto - SP",
    days: 30
  },
  {
    lat: -20.45,
    lon: -54.62,
    label: "Campo Grande - MS",
    days: 30
  },
  {
    lat: -23.31,
    lon: -51.16,
    label: "Londrina - PR",
    days: 30
  }
];

export const CLIMATE_STORAGE_KEY = "agroplan_climate_location";
