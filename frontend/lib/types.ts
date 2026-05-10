/**
 * Tipos TypeScript para AgroPlan AI
 */

export interface PriceNormalization {
  preco_original?: number;
  unidade_original?: string;
  preco_por_tonelada?: number;
  unidade_normalizada?: string;
  fator_conversao?: number;
  normalizado?: boolean;
  error?: string;
}

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
  normalizacao?: PriceNormalization;
}

export interface MarketProfitValidation {
  diferenca_absoluta?: number;
  diferenca_percentual?: number;
  direcao?: "maior" | "menor" | "igual";
  confiabilidade?: "alta" | "media" | "baixa";
  motivos?: string[];
  critico?: boolean;
  diferenca?: {
    diferenca_absoluta: number;
    diferenca_percentual: number;
    direcao: string;
  };
}

export interface MarketProfitValidationSummary {
  ativo: boolean;
  total_itens?: number;
  itens_alta_confiabilidade?: number;
  itens_media_confiabilidade?: number;
  itens_baixa_confiabilidade?: number;
  itens_criticos?: number;
  percentual_alta_confiabilidade?: number;
  percentual_baixa_confiabilidade?: number;
  percentual_critico?: number;
  alertas?: string[];
  total_alertas?: number;
  recomendacao?: string;
}

export interface PriceSummary {
  ativo: boolean;
  source?: string;
  fallback_count?: number;
  culturas_com_preco?: number;
  culturas_sem_preco?: number;
  total_culturas?: number;
  aplicado_no_lucro?: boolean;
  lucro_recalculado_disponivel?: boolean;
  uf?: string;
  normalizacao?: {
    ativa?: boolean;
    unidade_base?: string;
    culturas_normalizadas?: number;
    culturas_nao_normalizadas?: number;
  };
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
  preco_normalizado?: PriceNormalization; // Normalização de preço
  lucro_mercado_estimado?: number; // Lucro calculado com preço de mercado
  lucro_mercado_aplicado?: boolean; // Se lucro de mercado foi aplicado
  lucro_original?: number; // Lucro original antes de aplicar mercado
  produtividade?: number; // Produtividade em t/ha
  custo?: number; // Custo por hectare
  validacao_lucro_mercado?: MarketProfitValidation; // Validação de confiabilidade
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
  validacao_lucro_mercado?: MarketProfitValidationSummary;
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
  validacao_lucro_mercado?: MarketProfitValidationSummary;
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

export interface MarketComparisonItem {
  talhao?: number;
  cultura?: string;
  lucro_sistema?: number;
  lucro_mercado_estimado?: number;
  preco_real?: PriceData;
  preco_normalizado?: PriceNormalization;
  validacao_lucro_mercado?: MarketProfitValidation;
}

export interface MarketComparisonSummary {
  lucro_sistema_total: number;
  lucro_mercado_total: number;
  diferenca_absoluta: number;
  diferenca_percentual: number;
  itens_alta_confiabilidade: number;
  itens_media_confiabilidade: number;
  itens_baixa_confiabilidade: number;
  itens_criticos: number;
  percentual_alta_confiabilidade: number;
  pode_usar_mercado: boolean;
  motivo_bloqueio?: string;
}

export interface MarketComparisonResponse {
  modo: "avaliacao_comparativa";
  descricao: string;
  plano_sistema: any;
  avaliacao_mercado: {
    lucro_mercado_total: number;
    itens: MarketComparisonItem[];
  };
  comparacao: MarketComparisonSummary;
}

export interface MarketOptimizationResponse {
  modo: "otimizacao_mercado_experimental";
  experimental: boolean;
  aviso: string;
  plano: PlanoItem[];
  lucro_mercado_total: number;
  lucro_sistema_total_referencial: number;
  fitness_mercado: number;
  fitness_sistema_referencial: number;
  risco_medio: number;
  diversidade: number;
  area_total: number;
  geracoes: number;
  objetivo: string;
  seed: number;
  validacao_lucro_mercado: MarketProfitValidationSummary;
  bloqueado: boolean;
  pode_usar_como_recomendacao: boolean;
  motivo_bloqueio?: string;
  zarc?: any;
  precos?: PriceSummary;
}
