/**
 * Utilitários para manipulação segura de datas no calendário agrícola.
 * 
 * IMPORTANTE: Datas agrícolas são datas simples (ano-mês-dia) sem timezone.
 * Nunca use `new Date(dateString)` diretamente, pois isso interpreta como UTC
 * e pode causar off-by-one errors devido ao timezone local.
 */

/**
 * Converte string ISO (YYYY-MM-DD) para Date local sem timezone issues.
 * 
 * @param dateString - Data no formato ISO (YYYY-MM-DD)
 * @returns Date object com hora local (00:00:00)
 * 
 * @example
 * parseLocalDate("2026-05-10") // 10/05/2026 00:00:00 (hora local)
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();
  
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formata data ISO para formato brasileiro (DD/MM).
 * 
 * @param dateString - Data no formato ISO (YYYY-MM-DD)
 * @returns Data formatada como DD/MM
 * 
 * @example
 * formatDateBR("2026-05-10") // "10/05"
 */
export function formatDateBR(dateString: string): string {
  if (!dateString) return "";
  
  const [year, month, day] = dateString.split("-").map(Number);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
}

/**
 * Formata data ISO para formato brasileiro com ano (DD/MM/YYYY).
 * 
 * @param dateString - Data no formato ISO (YYYY-MM-DD)
 * @returns Data formatada como DD/MM/YYYY
 * 
 * @example
 * formatDateBRWithYear("2026-05-10") // "10/05/2026"
 */
export function formatDateBRWithYear(dateString: string): string {
  if (!dateString) return "";
  
  const [year, month, day] = dateString.split("-").map(Number);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

/**
 * Converte Date para string ISO (YYYY-MM-DD).
 * 
 * @param date - Date object
 * @returns Data no formato ISO (YYYY-MM-DD)
 * 
 * @example
 * toISODateString(new Date(2026, 4, 10)) // "2026-05-10"
 */
export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Retorna a data de hoje no formato ISO (YYYY-MM-DD).
 * 
 * @returns Data de hoje como string ISO
 * 
 * @example
 * getTodayISO() // "2026-05-10"
 */
export function getTodayISO(): string {
  return toISODateString(new Date());
}

/**
 * Verifica se uma data está no passado.
 * 
 * @param dateString - Data no formato ISO (YYYY-MM-DD)
 * @returns true se a data é anterior a hoje
 * 
 * @example
 * isPastDate("2026-05-09") // true (se hoje for 10/05/2026)
 */
export function isPastDate(dateString: string): boolean {
  if (!dateString) return false;
  
  const date = parseLocalDate(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return date < today;
}

/**
 * Calcula diferença em dias entre duas datas.
 * 
 * @param dateString1 - Primeira data (ISO)
 * @param dateString2 - Segunda data (ISO)
 * @returns Número de dias de diferença (positivo se date1 > date2)
 * 
 * @example
 * daysDifference("2026-05-15", "2026-05-10") // 5
 */
export function daysDifference(dateString1: string, dateString2: string): number {
  const date1 = parseLocalDate(dateString1);
  const date2 = parseLocalDate(dateString2);
  
  const diffTime = date1.getTime() - date2.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
