/**
 * Funções de formatação
 */

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

export function formatFitness(value: number): string {
  return value.toFixed(2);
}

export function formatArea(value: number): string {
  return `${value} ha`;
}

export function formatCurrencyCompactBRL(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1)} mi`;
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1)} mil`;
  }
  return formatCurrencyBRL(value);
}

export function normalizeCompatibility(value: number): number {
  // Se o valor já está em escala 0-100, retorna como está
  if (value > 10) return value;
  // Se está em escala 0-10, converte para 0-100
  return value * 10;
}

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(1)} tri`;
  }
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)} bi`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} mi`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)} mil`;
  }
  return value.toLocaleString('pt-BR');
}
