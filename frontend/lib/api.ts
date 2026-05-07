/**
 * API Client para AgroPlan AI Backend
 * Suporta detecção automática entre API local e Render
 */

const ONLINE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agroplan-ai-api.onrender.com';
const LOCAL_API_URL = 'http://localhost:8000';

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
  return (localStorage.getItem('agroplan_api_mode') as any) || 'auto';
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
  } catch (error: any) {
    results.local.error = error.name === 'AbortError' ? 'Timeout' : 'Conexão falhou';
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
  } catch (error: any) {
    results.render.error = error.name === 'AbortError' ? 'Timeout' : 'Conexão falhou';
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
 * Fetch inteligente com failover automático
 */
async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const mode = getApiMode();
  
  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}${path}`, options);
    
    if (response.ok) {
      return response;
    }
    
    // Se não for modo auto, não tentar fallback
    if (mode !== 'auto') {
      throw new Error(`API ${mode} falhou: ${response.status}`);
    }
    
    // Em modo auto, tentar fallback
    throw new Error('Tentando fallback...');
    
  } catch (error) {
    // Se não for modo auto, relançar erro
    if (mode !== 'auto') {
      throw error;
    }
    
    // Modo auto: tentar fallback
    console.warn('API primária falhou, tentando fallback...', error);
    
    clearApiCache();
    
    try {
      const fallbackUrl = await getApiUrl();
      const fallbackResponse = await fetch(`${fallbackUrl}${path}`, options);
      
      if (fallbackResponse.ok) {
        // Mostrar notificação discreta de fallback
        if (typeof window !== 'undefined') {
          console.info('Alternando para API de backup');
        }
        return fallbackResponse;
      }
      
      throw new Error(`Fallback também falhou: ${fallbackResponse.status}`);
    } catch (fallbackError) {
      throw new Error('Nenhuma API disponível');
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

export async function getDashboard() {
  try {
    const response = await apiFetch('/dashboard', {
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

export async function getRecomendacoes() {
  try {
    const response = await apiFetch('/recomendacoes', {
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

export async function getCenarios() {
  try {
    const response = await apiFetch('/cenarios', {
      cache: 'no-store',
    });
    return response.json();
  } catch (error) {
    console.error('Erro em getCenarios:', error);
    throw error;
  }
}

export async function otimizar(objetivo: string = 'equilibrado', seed: number = 42) {
  try {
    const response = await apiFetch('/otimizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objetivo, seed }),
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

export async function gerarRelatorio(objetivo: string = 'equilibrado', formato: string = 'md') {
  const response = await apiFetch('/relatorio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ objetivo, formato })
  });
  if (!response.ok) throw new Error('Falha ao gerar relatório');
  return response.json();
}
