/**
 * Tipos relacionados ao ZARC (Zoneamento Agrícola de Risco Climático)
 */

export interface ZarcJanelaPlantio {
  inicio: string;
  fim: string;
}

export interface ZarcData {
  ativo: boolean;
  source?: string;
  fallback?: boolean;
  janela_plantio?: ZarcJanelaPlantio;
  risco?: string;
  safra?: string;
  observacao?: string;
  decendios_recomendados?: number[];
  municipio_zarc?: string;
  geocodigo?: string;
  message?: string;
}

export interface ZarcSummary {
  ativo: boolean;
  uf?: string;
  municipio?: string;
  safra?: string;
  source?: string;
  fallback?: boolean;
  culturas_com_zarc?: number;
  total_culturas?: number;
}

export interface TalhaoComZarc {
  talhao: number;
  cultura: string;
  solo: string;
  area: number;
  lucro_estimado: number;
  risco: number;
  nota: number;
  zarc?: ZarcData;
}
