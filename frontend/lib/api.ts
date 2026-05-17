/**
 * API Client para AgroPlan AI Backend
 * Suporta detecção automática entre API local e Render
 */

import type { ClimateLocation } from './types/climate';
import type {
  ManualField,
  ManualFieldCreate,
  GenerateFieldCalendarPayload,
  CropCalendarResponse,
  CropInfo,
} from './types';

const ONLINE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agroplan-ai-api.onrender.com';
const LOCAL_API_URL = 'http://localhost:8000';
const CLIMATE_STORAGE_KEY = 'agroplan_climate_location';

// Cache da URL resolvida
let resolvedApiUrl: string | null = null;
let lastResolveTime = 0;
const CACHE_DURATION = 30000; // 30 segundos

/**
 * Resolve qual API usar: local ou online
 */
async function resolveApiUrl(): Promise<{ url: string; origin: 'local' | 'render' }> {
  const now = Date.now();
  
  // Se tem cache válido, usar
  if (resolvedApiUrl && (now - lastResolveTime) < CACHE_DURATION) {
    return {
      url: resolvedApiUrl,
      origin: resolvedApiUrl === LOCAL_API_URL ? 'local' : 'render'
    };
  }
  
  // Verificar modo configurado pelo usuário
  const apiMode = typeof window !== 'undefined' 
    ? localStorage.getItem('agroplan_api_mode') 
    : null;
  
  if (apiMode === 'online') {
    resolvedApiUrl = ONLINE_API_URL;
    lastResolveTime = now;
    return { url: ONLINE_API_URL, origin: 'render' };
  }
  
  if (apiMode === 'local') {
    resolvedApiUrl = LOCAL_API_URL;
    lastResolveTime = now;
    return { url: LOCAL_API_URL, origin: 'local' };
  }
  
  // Modo automático: tentar local primeiro
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800);
    
    const response = await fetch(`${LOCAL_API_URL}/health`, {
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      resolvedApiUrl = LOCAL_API_URL;
      lastResolveTime = now;
      return { url: LOCAL_API_URL, origin: 'local' };
    }
  } catch {
    // Local não disponível, usar online
  }
  
  // Fallback para API online
  resolvedApiUrl = ONLINE_API_URL;
  lastResolveTime = now;
  return { url: ONLINE_API_URL, origin: 'render' };
}

/**
 * Obtém a URL da API atual
 */
export async function getApiUrl(): Promise<string> {
  const result = await resolveApiUrl();
  return result.url;
}

/**
 * Obtém informações sobre qual API está sendo usada
 */
export async function getApiInfo(): Promise<{ url: string; origin: 'local' | 'render' }> {
  return resolveApiUrl();
}

/**
 * Limpa o cache de resolução de API
 */
export function clearApiCache(): void {
  resolvedApiUrl = null;
  lastResolveTime = 0;
}

/**
 * Define o modo de API manualmente
 */
export function setApiMode(mode: 'auto' | 'local' | 'online'): void {
  if (typeof window !== 'undefined') {
    if (mode === 'auto') {
      localStorage.removeItem('agroplan_api_mode');
    } else {
      localStorage.setItem('agroplan_api_mode', mode);
    }
    clearApiCache();
  }
}

/**
 * Obtém o modo de API atual
 */
export function getApiMode(): 'auto' | 'local' | 'online' {
  if (typeof window === 'undefined') return 'auto';
  const mode = localStorage.getItem('agroplan_api_mode');
  return mode === 'local' || mode === 'online' || mode === 'auto' ? mode : 'auto';
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';
}

/**
 * Testa conexão com as APIs
 */
export async function testApiConnection(): Promise<{
  local: { online: boolean; latency?: number; error?: string };
  render: { online: boolean; latency?: number; error?: string };
  active: 'local' | 'render' | 'none';
}> {
  const results = {
    local: { online: false, latency: undefined as number | undefined, error: undefined as string | undefined },
    render: { online: false, latency: undefined as number | undefined, error: undefined as string | undefined },
    active: 'none' as 'local' | 'render' | 'none'
  };

  // Testar API Local
  try {
    const startLocal = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const localResponse = await fetch(`${LOCAL_API_URL}/health`, {
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    
    if (localResponse.ok) {
      results.local.online = true;
      results.local.latency = Date.now() - startLocal;
    }
  } catch (error: unknown) {
    results.local.error = isAbortError(error) ? 'Timeout' : 'Conexão falhou';
  }

  // Testar API Render
  try {
    const startRender = Date.now();
    const renderResponse = await fetch(`${ONLINE_API_URL}/health`, {
      signal: AbortSignal.timeout(5000),
      cache: 'no-store'
    });
    
    if (renderResponse.ok) {
      results.render.online = true;
      results.render.latency = Date.now() - startRender;
    }
  } catch (error: unknown) {
    results.render.error = isAbortError(error) ? 'Timeout' : 'Conexão falhou';
  }

  // Determinar qual está ativa
  if (results.local.online) {
    results.active = 'local';
  } else if (results.render.online) {
    results.active = 'render';
  }

  return results;
}

/**
 * Fetch inteligente com failover automático determinístico
 */
async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const mode = getApiMode();
  
  // Resolver qual API usar primeiro
  const primary = await resolveApiUrl();
  
  try {
    const response = await fetch(`${primary.url}${path}`, options);
    
    if (response.ok) {
      return response;
    }
    
    // Capturar detalhes do erro
    const errorText = await response.text().catch(() => '');
    const primaryError = new Error(
      `API ${primary.origin} falhou em ${path}: ${response.status} ${errorText}`
    );
    
    // Se não for modo auto, não tentar fallback
    if (mode !== 'auto') {
      throw primaryError;
    }
    
    // Em modo auto, tentar fallback com a OUTRA API
    throw primaryError;
    
  } catch (primaryError) {
    // Se não for modo auto, relançar erro
    if (mode !== 'auto') {
      throw primaryError;
    }
    
    // Modo auto: tentar fallback determinístico
    // Se primary foi local, fallback é render; se foi render, fallback é local
    const fallbackUrl = primary.origin === 'local' ? ONLINE_API_URL : LOCAL_API_URL;
    const fallbackOrigin = primary.origin === 'local' ? 'render' : 'local';
    
    console.warn(`API ${primary.origin} falhou, tentando ${fallbackOrigin}...`, primaryError);
    
    try {
      const fallbackResponse = await fetch(`${fallbackUrl}${path}`, options);
      
      if (fallbackResponse.ok) {
        // Atualizar cache para usar fallback
        resolvedApiUrl = fallbackUrl;
        lastResolveTime = Date.now();
        
        if (typeof window !== 'undefined') {
          console.info(`Alternando de ${primary.origin} para ${fallbackOrigin}`);
        }
        return fallbackResponse;
      }
      
      // Fallback também falhou
      const fallbackText = await fallbackResponse.text().catch(() => '');
      throw new Error(
        `Fallback ${fallbackOrigin} falhou em ${path}: ${fallbackResponse.status} ${fallbackText}`
      );
    } catch (fallbackError) {
      // Ambas as APIs falharam
      throw new Error(
        `Nenhuma API conseguiu responder ${path}.\n` +
        `Primária (${primary.origin}): ${String(primaryError)}\n` +
        `Fallback (${fallbackOrigin}): ${String(fallbackError)}`
      );
    }
  }
}

export async function getHealth() {
  try {
    const response = await apiFetch('/health', {
      cache: 'no-store',
    });
    
    const data = await response.json();
    const apiInfo = await getApiInfo();
    
    return {
      ...data,
      api_origin: apiInfo.origin
    };
  } catch (error) {
    console.error('Erro em getHealth:', error);
    throw error;
  }
}

export async function getDashboard(location?: Partial<ClimateLocation>) {
  try {
    let url = '/dashboard';
    
    // Adicionar parâmetros climáticos e ZARC se localização fornecida
    if (location) {
      const params = new URLSearchParams();

      if (location.lat !== undefined && location.lon !== undefined) {
        params.append('lat', location.lat.toString());
        params.append('lon', location.lon.toString());
        params.append('days', (location.days || 30).toString());
      }
      
      // Adicionar parâmetros ZARC se disponíveis
      if (location.uf) {
        params.append('uf', location.uf);
      }
      if (location.municipio) {
        params.append('municipio', location.municipio);
      }
      if (location.safra) {
        params.append('safra', location.safra);
      }
      
      const query = params.toString();
      if (query) {
        url += `?${query}`;
      }
    }
    
    const response = await apiFetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  } catch (error) {
    console.error('Erro em getDashboard:', error);
    throw error;
  }
}

export async function getTalhoes() {
  const response = await apiFetch('/talhoes');
  return response.json();
}

export async function getRecomendacoes(location?: ClimateLocation) {
  try {
    let url = '/recomendacoes';
    
    // Adicionar parâmetros ZARC se localização fornecida
    if (location?.uf) {
      const params = new URLSearchParams();
      params.append('uf', location.uf);
      if (location.municipio) {
        params.append('municipio', location.municipio);
      }
      if (location.safra) {
        params.append('safra', location.safra);
      }
      url += `?${params.toString()}`;
    }
    
    const response = await apiFetch(url, {
      cache: 'no-store',
    });
    return response.json();
  } catch (error) {
    console.error('Erro em getRecomendacoes:', error);
    throw error;
  }
}

export async function getCulturas() {
  const response = await apiFetch('/culturas');
  return response.json();
}

export async function getCenarios(location?: Partial<ClimateLocation>) {
  try {
    let url = '/cenarios';
    
    // Adicionar parâmetros climáticos se localização fornecida
    if (location?.lat !== undefined && location.lon !== undefined) {
      const params = new URLSearchParams({
        lat: location.lat.toString(),
        lon: location.lon.toString(),
        days: (location.days || 30).toString()
      });
      url += `?${params.toString()}`;
    }
    
    const response = await apiFetch(url, {
      cache: 'no-store',
    });
    return response.json();
  } catch (error) {
    console.error('Erro em getCenarios:', error);
    throw error;
  }
}

export async function otimizar(objetivo: string = 'equilibrado', seed: number = 42, location?: ClimateLocation) {
  try {
    const body: Record<string, string | number> = { objetivo, seed };
    
    // Adicionar parâmetros climáticos se localização fornecida
    if (location) {
      body.lat = location.lat;
      body.lon = location.lon;
      body.days = location.days || 30;
      
      // Adicionar parâmetros ZARC se disponíveis
      if (location.uf) {
        body.uf = location.uf;
      }
      if (location.municipio) {
        body.municipio = location.municipio;
      }
      if (location.safra) {
        body.safra = location.safra;
      }
    }
    
    const response = await apiFetch('/otimizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
      throw new Error(error.detail || `Falha ao otimizar: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Erro em otimizar:', error);
    throw error;
  }
}

export async function validar(objetivo: string = 'equilibrado', seed: number = 42) {
  const response = await apiFetch('/validar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ objetivo, seed })
  });
  
  // Se retornou erro HTTP 400, pode ser força bruta inviável
  if (response.status === 400) {
    const errorData = await response.json();
    
    // Se é erro de força bruta inviável, retorna estrutura especial
    if (errorData.detail && errorData.detail.includes('muito grande')) {
      return {
        erro: true,
        mensagem: errorData.detail,
        forcaBrutaInviavel: true
      };
    }
    
    throw new Error(errorData.detail || 'Falha ao validar');
  }
  
  // Outros erros HTTP
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Falha ao validar' }));
    throw new Error(errorData.detail || 'Falha ao validar');
  }
  
  return response.json();
}

export async function rodadas(objetivo: string = 'equilibrado', numRodadas: number = 5) {
  const response = await apiFetch('/rodadas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ objetivo, rodadas: numRodadas })
  });
  if (!response.ok) throw new Error('Falha ao executar rodadas');
  return response.json();
}

export async function gerarRelatorio(objetivo: string = 'equilibrado', formato: string = 'md', location?: ClimateLocation) {
  try {
    const body: Record<string, string | number> = { objetivo, formato };
    
    // Adicionar parâmetros climáticos se localização fornecida
    if (location) {
      body.lat = location.lat;
      body.lon = location.lon;
      body.days = location.days || 30;
      
      // Adicionar parâmetros ZARC se disponíveis
      if (location.uf) {
        body.uf = location.uf;
      }
      if (location.municipio) {
        body.municipio = location.municipio;
      }
      if (location.safra) {
        body.safra = location.safra;
      }
    }
    
    const response = await apiFetch('/relatorio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
      throw new Error(errorData.detail || `Falha ao gerar relatório: ${response.status}`);
    }
    
    return response.json();
  } catch (error: unknown) {
    console.error('Erro em gerarRelatorio:', error);
    throw new Error(error instanceof Error ? error.message : 'Falha ao gerar relatório');
  }
}


// ===== Funções de Gerenciamento de Localização Climática =====

/**
 * Obtém a localização climática salva
 */
export function getClimateLocation(): ClimateLocation | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(CLIMATE_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Erro ao ler localização climática:', error);
    return null;
  }
}

/**
 * Salva a localização climática
 */
export function setClimateLocation(location: ClimateLocation | null): void {
  if (typeof window === 'undefined') return;
  
  try {
    if (location) {
      localStorage.setItem(CLIMATE_STORAGE_KEY, JSON.stringify(location));
    } else {
      localStorage.removeItem(CLIMATE_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Erro ao salvar localização climática:', error);
  }
}

/**
 * Remove a localização climática
 */
export function clearClimateLocation(): void {
  setClimateLocation(null);
}

/**
 * Obtém dados climáticos para uma localização
 */
export async function getClimateData(location: ClimateLocation) {
  try {
    const params = new URLSearchParams({
      lat: location.lat.toString(),
      lon: location.lon.toString(),
      days: (location.days || 30).toString()
    });
    
    const response = await apiFetch(`/dados/clima?${params.toString()}`, {
      cache: 'no-store',
    });
    
    return response.json();
  } catch (error) {
    console.error('Erro ao obter dados climáticos:', error);
    throw error;
  }
}


/**
 * Obtém comparação de preços normalizados
 */
export async function getComparacaoPrecos(uf?: string) {
  const params = new URLSearchParams();
  if (uf) params.append("uf", uf);
  const query = params.toString();
  
  const response = await apiFetch(`/dados/precos/comparar${query ? `?${query}` : ""}`, {
    cache: "no-store"
  });
  
  if (!response.ok) {
    throw new Error(`Falha ao obter comparação de preços: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Avalia o plano do sistema usando lucro de mercado para comparação
 */
export async function compararLucroMercado(location?: Partial<ClimateLocation>, options?: {
  objetivo?: string;
  seed?: number;
  geracoes?: number;
  populacao?: number;
}) {
  const params = new URLSearchParams();
  
  params.set("objetivo", options?.objetivo ?? "equilibrado");
  params.set("seed", String(options?.seed ?? 42));
  params.set("geracoes", String(options?.geracoes ?? 50));
  params.set("populacao", String(options?.populacao ?? 50));
  
  if (location?.lat !== undefined) params.set("lat", String(location.lat));
  if (location?.lon !== undefined) params.set("lon", String(location.lon));
  if (location?.days) params.set("days", String(location.days));
  if (location?.uf) params.set("uf", location.uf);
  if (location?.municipio) params.set("municipio", location.municipio);
  if (location?.safra) params.set("safra", location.safra);
  
  const response = await apiFetch(`/comparar/lucro-mercado?${params.toString()}`, {
    cache: "no-store"
  });
  
  if (!response.ok) {
    throw new Error(`Falha ao comparar lucro de mercado: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Otimização EXPERIMENTAL usando lucro de mercado como fitness
 */
export async function otimizarLucroMercadoExperimental(location?: Partial<ClimateLocation>, options?: {
  seed?: number;
  geracoes?: number;
  populacao?: number;
}) {
  const params = new URLSearchParams();
  
  params.set("objetivo", "mercado"); // Sempre mercado para este modo
  params.set("seed", String(options?.seed ?? 42));
  params.set("geracoes", String(options?.geracoes ?? 50));
  params.set("populacao", String(options?.populacao ?? 50));
  
  if (location?.lat !== undefined) params.set("lat", String(location.lat));
  if (location?.lon !== undefined) params.set("lon", String(location.lon));
  if (location?.days) params.set("days", String(location.days));
  if (location?.uf) params.set("uf", location.uf);
  if (location?.municipio) params.set("municipio", location.municipio);
  if (location?.safra) params.set("safra", location.safra);
  
  const response = await apiFetch(`/otimizar/lucro-mercado-experimental?${params.toString()}`, {
    cache: "no-store"
  });
  
  if (!response.ok) {
    throw new Error(`Falha ao otimizar lucro de mercado experimental: ${response.status}`);
  }
  
  return response.json();
}


// Planning API Functions

export async function getPlanningFields(): Promise<{ total: number; talhoes: ManualField[] }> {
  const response = await apiFetch('/planejamento/talhoes');
  return response.json();
}

export async function createPlanningField(data: ManualFieldCreate): Promise<ManualField> {
  const response = await apiFetch('/planejamento/talhoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function getPlanningField(id: string): Promise<ManualField> {
  const response = await apiFetch(`/planejamento/talhoes/${id}`);
  return response.json();
}

export async function updatePlanningField(id: string, data: Partial<ManualFieldCreate>): Promise<ManualField> {
  const response = await apiFetch(`/planejamento/talhoes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deletePlanningField(id: string): Promise<{ message: string; id: string }> {
  const response = await apiFetch(`/planejamento/talhoes/${id}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function generateFieldCalendar(
  id: string,
  payload: GenerateFieldCalendarPayload
): Promise<CropCalendarResponse> {
  const response = await apiFetch(`/planejamento/talhoes/${id}/calendario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function getPlanningCultures(): Promise<{
  total: number;
  culturas: string[];
  detalhes: Record<string, CropInfo>;
}> {
  const response = await apiFetch('/planejamento/culturas');
  return response.json();
}

export async function getPlanningCultureInfo(cultura: string): Promise<CropInfo> {
  const response = await apiFetch(`/planejamento/culturas/${cultura}`);
  return response.json();
}

/**
 * Envia um imprevisto e o calendário atual para o motor de replanejamento.
 * Retorna sugestões de ajuste sem aplicá-las automaticamente.
 */
export async function replanCalendar(payload: {
  calendar: import('./types').CropCalendarResponse;
  event: import('./types').ReplanningEvent;
}): Promise<import('./types').ReplanningResponse> {
  const response = await apiFetch('/planejamento/replanejar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
    throw new Error(errorData.detail || `Falha ao processar replanejamento: ${response.status}`);
  }

  return response.json();
}

/**
 * Aplica uma sugestão de replanejamento em modo de simulação.
 * Retorna o calendário ajustado.
 */
export async function applyReplanningSuggestion(
  payload: import('./types').ApplyReplanningRequest
): Promise<import('./types').ApplyReplanningResponse> {
  const response = await apiFetch('/planejamento/replanejar/aplicar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
    throw new Error(errorData.detail || `Falha ao aplicar sugestão: ${response.status}`);
  }

  return response.json();
}
