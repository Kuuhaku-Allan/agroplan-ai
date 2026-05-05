/**
 * Tipos TypeScript para AgroPlan AI
 */

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
