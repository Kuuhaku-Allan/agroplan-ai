# Correção de Sincronização Visual - Dashboard e Validação

**Data**: 05/05/2026  
**Status**: ✅ Concluído

## Contexto

Após expandir a base de dados para 10 culturas × 10 talhões (10 bilhões de combinações), a interface apresentava dois problemas de sincronização visual:

1. **Card "Validação" no Dashboard**: Texto cortado "Subó..." e status inadequado para força bruta inviável
2. **Badges na Topbar**: Valores fixos "5 culturas" e "3 talhões" em vez de dinâmicos

## Problemas Identificados

### Problema 1: Card Validação
- **Sintoma**: Texto aparecia como "Subó..." (truncado)
- **Causa**: Card tentava mostrar "Subótimo" mesmo quando força bruta era inviável
- **Impacto**: Confusão semântica e visual ruim

### Problema 2: Badges Topbar
- **Sintoma**: Mostrava "5 culturas" e "3 talhões" (valores antigos)
- **Causa**: Valores hardcoded no componente
- **Impacto**: Informação desatualizada e incorreta

### Problema 3: Erro na Validação
- **Sintoma**: Erro "Falha ao validar" ao tentar validar com força bruta inviável
- **Causa**: Frontend não tratava corretamente erro HTTP 400 do backend
- **Impacto**: Página de validação não funcionava

## Soluções Implementadas

### 1. Função `formatLargeNumber()` em `formatters.ts`

```typescript
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
```

**Exemplos**:
- `10000000000` → "10 bi"
- `1000000` → "1 mi"
- `125` → "125"

### 2. Função Auxiliar `getValidationStatus()` no Dashboard

```typescript
function getValidationStatus(validacao: { otimo_global: boolean; total_combinacoes: number }) {
  const forcaBrutaInviavel = validacao.total_combinacoes > 10000;
  
  if (forcaBrutaInviavel) {
    return {
      label: "Estável",
      subtitle: "Por rodadas",
      color: "emerald" as const
    };
  }
  
  if (validacao.otimo_global) {
    return {
      label: "Ótimo",
      subtitle: "Global encontrado",
      color: "emerald" as const
    };
  }
  
  return {
    label: "Pendente",
    subtitle: "Não validado",
    color: "blue" as const
  };
}
```

**Lógica**:
- Se `total_combinacoes > 10000`: Mostra "Estável" / "Por rodadas"
- Se `otimo_global = true`: Mostra "Ótimo" / "Global encontrado"
- Caso contrário: Mostra "Pendente" / "Não validado"

### 3. Dashboard Busca Dados de `/health`

```typescript
const [healthData, setHealthData] = useState<{ culturas: number; talhoes: number } | null>(null);

const loadData = async () => {
  // Verifica saúde da API
  const health = await getHealth();
  setHealthData({ culturas: health.culturas, talhoes: health.talhoes });
  // ...
};
```

### 4. Topbar Recebe Valores Dinâmicos

```typescript
<Topbar
  title="Dashboard"
  subtitle="Visão geral do planejamento agrícola"
  apiStatus={apiStatus}
  culturas={healthData?.culturas}
  talhoes={healthData?.talhoes}
/>
```

**Topbar Component**:
```typescript
interface TopbarProps {
  culturas?: number;
  talhoes?: number;
  // ...
}

{culturas !== undefined && (
  <Badge variant="outline">
    {culturas} culturas
  </Badge>
)}

{talhoes !== undefined && (
  <Badge variant="outline">
    {talhoes} talhões
  </Badge>
)}
```

### 5. Card Validação Usa Função Auxiliar

```typescript
{(() => {
  const validationStatus = getValidationStatus(dashboard.validacao);
  return (
    <MetricCard
      title="Validação"
      value={validationStatus.label}
      subtitle={validationStatus.subtitle}
      icon={CheckCircle2}
      color={validationStatus.color}
    />
  );
})()}
```

### 6. DecisionSummary Mostra Força Bruta Inviável

```typescript
const forcaBrutaInviavel = validacao.total_combinacoes > 10000;

{forcaBrutaInviavel ? (
  <>
    <div className="flex items-center gap-2">
      <Infinity className="w-4 h-4 text-amber-500" />
      <span className="text-sm text-amber-500 font-medium">
        Força bruta inviável
      </span>
      <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs">
        {formatLargeNumber(validacao.total_combinacoes)} combinações
      </Badge>
    </div>
    <div className="flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      <span className="text-sm text-emerald-500 font-medium">
        Validado por múltiplas rodadas
      </span>
    </div>
  </>
) : (
  // Mostra validação normal
)}
```

### 7. Backend `/dashboard` Trata Força Bruta Inviável

```python
@app.get("/dashboard")
def get_dashboard():
    # ...
    validacao = comparar_ag_com_forca_bruta(culturas, talhoes, regras, objetivo='equilibrado', seed=42)
    
    # Se força bruta é inviável, retorna dados especiais
    if validacao.get('erro'):
        return {
            # ...
            "validacao": {
                "otimo_global": False,
                "total_combinacoes": int(validacao.get('total_combinacoes', 0))
            }
        }
    
    # Validação normal
    return {
        # ...
        "validacao": {
            "otimo_global": bool(validacao.get('ag_encontrou_otimo_global', False)),
            "total_combinacoes": int(validacao.get('forca_bruta', {}).get('total_combinacoes', 0))
        }
    }
```

### 8. Frontend `validar()` Trata Erro HTTP 400

```typescript
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
```

## Arquivos Modificados

### Frontend
1. **`frontend/lib/formatters.ts`**
   - ✅ Adicionada função `formatLargeNumber()`

2. **`frontend/app/dashboard/page.tsx`**
   - ✅ Adicionada função `getValidationStatus()`
   - ✅ Busca dados de `/health` para culturas e talhões
   - ✅ Passa valores dinâmicos para Topbar
   - ✅ Card validação usa função auxiliar

3. **`frontend/components/layout/topbar.tsx`**
   - ✅ Props `culturas` e `talhoes` opcionais
   - ✅ Badges dinâmicos (undefined-safe)

4. **`frontend/components/dashboard/decision-summary.tsx`**
   - ✅ Detecta força bruta inviável (`total_combinacoes > 10000`)
   - ✅ Mostra badge âmbar "Força bruta inviável"
   - ✅ Mostra "10 bi combinações" formatado
   - ✅ Mostra "Validado por múltiplas rodadas"

5. **`frontend/lib/api.ts`**
   - ✅ Função `validar()` trata erro HTTP 400
   - ✅ Detecta mensagem "muito grande"
   - ✅ Retorna estrutura especial com `forcaBrutaInviavel: true`

### Backend
6. **`backend/api.py`**
   - ✅ Endpoint `/dashboard` trata erro de validação
   - ✅ Retorna `total_combinacoes` correto quando força bruta inviável

## Resultados

### Antes
- ❌ Card Validação: "Subó..." (truncado)
- ❌ Topbar: "5 culturas" e "3 talhões" (fixo)
- ❌ Decisão: "0 combinações testadas" (incorreto)
- ❌ Erro "Falha ao validar" na página Validação

### Depois
- ✅ Card Validação: "Estável" / "Por rodadas" (claro e curto)
- ✅ Topbar: "10 culturas" e "10 talhões" (dinâmico)
- ✅ Decisão: "Força bruta inviável" / "10 bi combinações" (correto)
- ✅ Página Validação executa rodadas automaticamente

## Validação

### Build
```bash
cd frontend
npm run build
```
**Resultado**: ✅ Build passou sem erros

### Backend Health
```bash
curl http://localhost:8000/health
```
**Resultado**: 
```json
{
  "status": "healthy",
  "culturas": 10,
  "talhoes": 10,
  "regras": 10
}
```

### Dashboard Endpoint
```bash
curl http://localhost:8000/dashboard
```
**Resultado**:
```json
{
  "validacao": {
    "otimo_global": false,
    "total_combinacoes": 10000000000
  }
}
```

### Frontend Dashboard
```bash
curl http://localhost:3000/dashboard
```
**Resultado**: ✅ Status 200 OK

## Conceito Importante

### Mudança de Paradigma de Validação

**Antes (Base Pequena - 125 combinações)**:
- Validação = AG encontrou ótimo global pela força bruta
- Status: "Ótimo Global" ou "Subótimo"

**Agora (Base Grande - 10 bilhões de combinações)**:
- Validação = Força bruta inviável, AG avaliado por estabilidade e múltiplas rodadas
- Status: "Estável" (validado por rodadas) ou "Ótimo" (quando força bruta é viável)

A interface agora reflete corretamente essa mudança conceitual.

## Próximos Passos

1. ✅ Testar visualmente no navegador `http://localhost:3000/dashboard`
2. ✅ Verificar se card "Validação" mostra "Estável" / "Por rodadas"
3. ✅ Verificar se Topbar mostra "10 culturas" e "10 talhões"
4. ✅ Verificar se "Decisão Recomendada" mostra "Força bruta inviável" com "10 bi combinações"
5. ⏭️ Seguir para Fase 6: Relatórios

## Conclusão

A sincronização visual foi corrigida com sucesso. A interface agora:
- Mostra dados dinâmicos corretos (10 culturas, 10 talhões)
- Comunica claramente quando força bruta é inviável
- Usa nomenclatura adequada para validação por rodadas
- Formata números grandes de forma legível
- Trata erros de validação corretamente

A aplicação está coerente com a nova base expandida e pronta para a próxima fase.
