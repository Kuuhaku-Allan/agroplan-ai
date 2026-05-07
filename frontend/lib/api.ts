/**
 * API Client para AgroPlan AI Backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getHealth() {
  try {
    const response = await fetch(`${API_URL}/health`, {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Falha ao verificar saúde da API: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erro em getHealth:', error);
    throw error;
  }
}

export async function getDashboard() {
  try {
    const response = await fetch(`${API_URL}/dashboard`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error(`Falha ao carregar dashboard: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erro em getDashboard:', error);
    throw error;
  }
}

export async function getTalhoes() {
  const response = await fetch(`${API_URL}/talhoes`);
  if (!response.ok) throw new Error('Falha ao carregar talhões');
  return response.json();
}

export async function getRecomendacoes() {
  try {
    const response = await fetch(`${API_URL}/recomendacoes`, {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Falha ao carregar recomendações: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erro em getRecomendacoes:', error);
    throw error;
  }
}

export async function getCulturas() {
  const response = await fetch(`${API_URL}/culturas`);
  if (!response.ok) throw new Error('Falha ao carregar culturas');
  return response.json();
}

export async function getCenarios() {
  try {
    const response = await fetch(`${API_URL}/cenarios`, {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Falha ao carregar cenários: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erro em getCenarios:', error);
    throw error;
  }
}

export async function otimizar(objetivo: string = 'equilibrado', seed: number = 42) {
  try {
    const response = await fetch(`${API_URL}/otimizar`, {
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
  const response = await fetch(`${API_URL}/validar`, {
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
  const response = await fetch(`${API_URL}/rodadas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ objetivo, rodadas: numRodadas })
  });
  if (!response.ok) throw new Error('Falha ao executar rodadas');
  return response.json();
}

export async function gerarRelatorio(objetivo: string = 'equilibrado', formato: string = 'md') {
  const response = await fetch(`${API_URL}/relatorio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ objetivo, formato })
  });
  if (!response.ok) throw new Error('Falha ao gerar relatório');
  return response.json();
}
