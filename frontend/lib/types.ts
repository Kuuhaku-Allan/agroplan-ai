/**
 * Tipos TypeScript para AgroPlan AI
 */

export interface PriceData {
  ativo: boolean;
  source?: string;
  fallback?: boolean;
  cultura?: string;
  uf?: string;
  preco?: number;
  unidade?: string;
  data_referencia?: string;
  observacao?: string;
}

export interface PriceSummary {
  ativo: boolean;
  source?: string;
  fallback_count?: number;
  culturas_com_preco?: number;
  culturas_sem_preco?: number;
  total_culturas?: number;
  aplicado_no_lucro?: boolean;
  uf?: string;
}

export interface Talhao {
  id: number;
  area: number;
  solo: string;
  clima: string;
  relevo: string;
  agua: string;
  cultura?: string;
}

export interface Cultura {
  nome: string;
  custo: number;
  preco: number;
  produtividade: number;
  tempo: number;
  regras?: {
    cultura: string;
    solos_ideais: string;
    climas_ideais: string;
    relevo_ideal: string;
    agua_necessaria: string;
    risco_base: number;
  };
}

export interface PlanoItem {
  talhao: number;
  area: number;
  solo: string;
  clima: string;
  relevo: string;
  agua: string;
  cultura: string;
  lucro_estimado: number;
  risco: number;
  nota: number;
  tempo: number;
  zarc?: any; // Dados ZARC opcionais
  preco_real?: PriceData; // Dados de preço opcionais
}

export interface DashboardData {
  lucro_total: number;
  risco_medio: number;
  fitness: number;
  diversidade: number;
  objetivo: string;
  culturas_escolhidas: string[];
  validacao: {
    otimo_global: boolean;
    total_combinacoes: number;
  };
  plano: PlanoItem[];
  clima_real?: {
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
  };
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
  precos?: PriceSummary;
}

export interface Cenario {
  nome: string;
  descricao: string;
  lucro_total: number;
  risco_medio: number;
  area_total: number;
  plano: PlanoItem[];
}

export interface ResultadoOtimizacao {
  plano: PlanoItem[];
  lucro_total: number;
  risco_medio: number;
  area_total: number;
  fitness: number;
  geracoes: number;
  objetivo: string;
  diversidade: number;
  justificativa: string;
  historico_fitness?: Array<{
    geracao: number;
    melhor_fitness: number;
    fitness_medio: number;
  }>;
  precos?: PriceSummary;
}

export interface ResultadoValidacao {
  erro: boolean;
  ag: ResultadoOtimizacao;
  forca_bruta: {
    plano: PlanoItem[];
    melhor_fitness: number;
    total_combinacoes: number;
    lucro_total: number;
    risco_medio: number;
  };
  ag_encontrou_otimo_global: boolean;
  diferenca_fitness: number;
  diferenca_lucro: number;
  analise: string;
}
