# 🔧 Correção do Erro "Failed to fetch"

## 🐛 Problema Identificado

**Erro:** `TypeError: Failed to fetch at getDashboard`

**Causa Raiz:** O FastAPI não conseguia serializar objetos numpy para JSON, resultando em erro 500 (Internal Server Error) nos endpoints `/dashboard` e `/cenarios`.

---

## 🔍 Diagnóstico

### 1. Teste inicial
```bash
curl http://localhost:8000/health
# ✅ Status: 200 OK
```

### 2. Teste do endpoint problemático
```bash
curl http://localhost:8000/dashboard
# ❌ Status: 500 Internal Server Error
```

### 3. Análise dos logs
```
ValueError: [TypeError("'numpy.bool' object is not iterable"), 
TypeError('vars() argument must have __dict__ attribute')]
```

**Conclusão:** O FastAPI não consegue serializar tipos numpy (numpy.bool, numpy.int64, numpy.float64) automaticamente para JSON.

---

## ✅ Solução Implementada

### 1. Conversão Explícita de Tipos no Endpoint `/dashboard`

**Antes:**
```python
return {
    "lucro_total": resultado_ag['lucro_total'],  # numpy.float64
    "risco_medio": resultado_ag['risco_medio'],  # numpy.float64
    "fitness": resultado_ag['fitness'],          # numpy.float64
    "diversidade": resultado_ag['diversidade'],  # numpy.int64
    # ...
}
```

**Depois:**
```python
return {
    "lucro_total": float(resultado_ag['lucro_total']),
    "risco_medio": float(resultado_ag['risco_medio']),
    "fitness": float(resultado_ag['fitness']),
    "diversidade": int(resultado_ag['diversidade']),
    "objetivo": str(resultado_ag['objetivo']),
    "culturas_escolhidas": [str(p['cultura']) for p in resultado_ag['plano']],
    "validacao": {
        "otimo_global": bool(validacao.get('ag_encontrou_otimo_global', False)),
        "total_combinacoes": int(validacao.get('forca_bruta', {}).get('total_combinacoes', 0))
    },
    "plano": [
        {
            "talhao": int(p['talhao']),
            "area": float(p['area']),
            "solo": str(p['solo']),
            "clima": str(p['clima']),
            "relevo": str(p['relevo']),
            "agua": str(p['agua']),
            "cultura": str(p['cultura']),
            "lucro_estimado": float(p['lucro_estimado']),
            "risco": float(p['risco']),
            "nota": float(p['nota']),
            "tempo": int(p['tempo'])
        }
        for p in resultado_ag['plano']
    ]
}
```

### 2. Correção do Endpoint `/cenarios`

**Problema adicional:** Os cenários simples não tinham todos os campos (solo, clima, relevo, água).

**Solução:**
- Criou um mapa de talhões para buscar os dados faltantes
- Adicionou conversão explícita de tipos
- Tratou o campo `tempo` que não existe nos cenários simples

```python
# Cria um mapa de talhões para facilitar o acesso
talhoes_dict = {int(row['id']): row for _, row in talhoes.iterrows()}

# Formata resposta
for key, cenario in cenarios.items():
    cenarios_formatados[key] = {
        'nome': str(cenario['nome']),
        'descricao': str(cenario['descricao']),
        'lucro_total': float(cenario['lucro_total']),
        'risco_medio': float(cenario['risco_medio']),
        'area_total': float(cenario['area_total']),
        'plano': [
            {
                "talhao": int(p['talhao']),
                "area": float(p['area']),
                "solo": str(talhoes_dict[int(p['talhao'])]['solo']),
                "clima": str(talhoes_dict[int(p['talhao'])]['clima']),
                "relevo": str(talhoes_dict[int(p['talhao'])]['relevo']),
                "agua": str(talhoes_dict[int(p['talhao'])]['agua']),
                "cultura": str(p['cultura']),
                "lucro_estimado": float(p['lucro_estimado']),
                "risco": float(p['risco']),
                "nota": float(p['nota']),
                "tempo": 0  # Não disponível nos cenários simples
            }
            for p in cenario['plano']
        ]
    }
```

### 3. Melhorias no Frontend

**Adicionado tratamento de erro mais robusto:**

```typescript
// lib/api.ts
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
```

**Garantido execução apenas no cliente:**

```typescript
// app/dashboard/page.tsx
useEffect(() => {
  // Só executa no cliente
  if (typeof window !== 'undefined') {
    loadData();
  }
}, []);
```

---

## 🧪 Testes Realizados

### ✅ Endpoint /health
```bash
curl http://localhost:8000/health
# Status: 200 OK
# Response: {"status":"healthy","culturas":5,"talhoes":3,"regras":5}
```

### ✅ Endpoint /dashboard
```bash
curl http://localhost:8000/dashboard
# Status: 200 OK
# Response: JSON válido com todos os dados
```

### ✅ Endpoint /cenarios
```bash
curl http://localhost:8000/cenarios
# Status: 200 OK
# Response: JSON válido com 6 cenários
```

---

## 📝 Arquivos Modificados

1. **backend/api.py**
   - Endpoint `/dashboard` - Conversão de tipos numpy
   - Endpoint `/cenarios` - Conversão de tipos + busca de dados de talhões

2. **frontend/lib/api.ts**
   - Funções `getHealth`, `getDashboard`, `getCenarios` - Tratamento de erro melhorado

3. **frontend/app/dashboard/page.tsx**
   - Hook `useEffect` - Garantia de execução apenas no cliente

---

## 🎯 Resultado

### ✅ Backend
- Todos os endpoints funcionando
- JSON válido sendo retornado
- Tipos Python nativos (não numpy)

### ✅ Frontend
- Carregamento de dados funcionando
- Dashboard renderizando corretamente
- Gráficos exibindo dados reais

---

## 🚀 Como Verificar

### 1. Backend rodando
```bash
cd backend
python api.py
# Servidor em: http://localhost:8000
```

### 2. Frontend rodando
```bash
cd frontend
npm run dev
# Aplicação em: http://localhost:3000
```

### 3. Acessar Dashboard
```
Abrir: http://localhost:3000/dashboard
```

**Resultado esperado:**
- ✅ 5 cards de métricas com dados reais
- ✅ 2 gráficos (lucro e risco por cenário)
- ✅ Plano recomendado (3 talhões)
- ✅ Decisão recomendada
- ✅ Badge "API Conectada" (verde)

---

## 💡 Lições Aprendidas

### 1. Numpy e JSON não são compatíveis
- FastAPI não serializa tipos numpy automaticamente
- Sempre converter para tipos Python nativos: `int()`, `float()`, `str()`, `bool()`

### 2. Estrutura de dados inconsistente
- Cenários simples não tinham todos os campos
- Necessário buscar dados complementares dos talhões

### 3. Debugging de API
- Testar endpoints diretamente com `curl`
- Verificar logs do servidor
- Adicionar tratamento de erro detalhado

---

## 🔧 Comandos Úteis para Debug

### Testar endpoint específico
```bash
curl http://localhost:8000/dashboard
```

### Ver logs do backend
```bash
# Verificar terminal onde o backend está rodando
# Procurar por erros 500 ou stack traces
```

### Testar no navegador
```javascript
// Console do navegador
fetch('http://localhost:8000/dashboard')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

---

## ✅ Status Final

**Backend:** ✅ Funcionando perfeitamente
**Frontend:** ✅ Carregando dados reais
**Dashboard:** ✅ Renderizando corretamente

**Problema:** ✅ RESOLVIDO

---

**Data da correção:** 05/05/2026
**Tempo de debug:** ~15 minutos
**Causa:** Serialização numpy → JSON
**Solução:** Conversão explícita de tipos
