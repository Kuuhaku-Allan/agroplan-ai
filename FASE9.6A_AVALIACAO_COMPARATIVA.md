# Fase 9.6A - Avaliação Comparativa com Lucro de Mercado - EM PROGRESSO

**Data**: 09/05/2026  
**Status**: 🔄 **EM DESENVOLVIMENTO**

---

## 📋 Objetivo Corrigido

**Antes (incorreto)**: "Comparação de otimização" - sugeria dois AGs diferentes  
**Agora (correto)**: "Avaliação comparativa" - avalia o plano atual com lucro de mercado

### O que é Avaliação Comparativa?

1. Gera plano normal com AG usando lucro do sistema
2. Avalia esse **mesmo plano** com lucro de mercado normalizado
3. Compara os dois valores de lucro
4. **NÃO** gera um segundo plano otimizado por mercado

### Por que não otimizar por mercado ainda?

- Lucro de mercado ainda tem itens críticos
- `PRICE_APPLY_TO_PROFIT=false` deve continuar padrão
- Primeiro validar se os valores de mercado são confiáveis
- Depois (Fase 9.6B) criar AG experimental com fitness de mercado

---

## ✅ Implementado

### 1. Backend - Comparador Renomeado

**Arquivo**: `backend/core/market_profit_comparator.py` ✅

**Função**: `comparar_plano_sistema_com_avaliacao_mercado()` (renomeada)

**O que faz**:
```python
1. Gera plano com gerar_plano_genetico() (AG normal)
2. Enriquece com clima (se lat/lon fornecido)
3. Enriquece com ZARC (se uf/municipio fornecido)
4. Aplica preços com aplicar_precos_no_plano()
5. Calcula lucro_mercado_total (soma dos lucro_mercado_estimado)
6. Compara lucro_sistema_total vs lucro_mercado_total
7. Valida confiabilidade
8. Determina se pode usar avaliação de mercado
```

**Retorno**:
```json
{
  "modo": "avaliacao_comparativa",
  "plano_sistema": {...},
  "avaliacao_mercado": {
    "lucro_mercado_total": 1234567.89,
    "itens": [...]
  },
  "comparacao": {
    "lucro_sistema_total": 1234567.89,
    "lucro_mercado_total": 1345678.90,
    "diferenca_absoluta": 111111.01,
    "diferenca_percentual": 9.0,
    "direcao": "maior",
    "validacao": {
      "itens_criticos": 0,
      "itens_baixa_confiabilidade": 0,
      "itens_alta_confiabilidade": 8,
      "percentual_alta_confiabilidade": 80.0,
      "pode_usar_mercado": true,
      "motivo_bloqueio": null
    }
  },
  "aviso": "Este modo é experimental. O lucro de mercado não substitui a recomendação principal. Esta é apenas uma avaliação comparativa do plano atual usando preços de mercado.",
  "objetivo": "equilibrado",
  "parametros": {...}
}
```

**Regras de Segurança**:
```python
pode_usar_mercado = True apenas se:
    - itens_criticos == 0
    - itens_baixa_confiabilidade == 0
    - percentual_alta_confiabilidade >= 70%
```

### 2. Backend - Endpoint API

**Endpoint**: `GET /comparar/lucro-mercado` ✅

**Parâmetros**:
- `objetivo`: Objetivo de otimização (padrão: "equilibrado")
- `geracoes`: Número de gerações do AG (padrão: 100)
- `populacao`: Tamanho da população (padrão: 50)
- `seed`: Seed para reprodutibilidade (opcional)
- `lat`, `lon`: Coordenadas geográficas (opcional)
- `days`: Dias para análise climática (padrão: 30)
- `uf`: Unidade Federativa (opcional)
- `municipio`: Município (opcional)
- `safra`: Safra ZARC (padrão: "2025/2026")

**Exemplo**:
```bash
GET /comparar/lucro-mercado?uf=SP&municipio=Clementina&safra=2025/2026&seed=42&geracoes=50
```

---

## 🔧 Problemas Encontrados e Corrigidos

### 1. Nome Enganoso
**Problema**: Função chamada `comparar_otimizacao_lucro_sistema_vs_mercado`  
**Correção**: Renomeada para `comparar_plano_sistema_com_avaliacao_mercado`  
**Motivo**: Não gera dois planos otimizados, apenas avalia um plano

### 2. Dois AGs Desnecessários
**Problema**: Código original rodava AG duas vezes  
**Correção**: Roda AG apenas uma vez, depois avalia com lucro de mercado  
**Motivo**: Mais rápido e conceitualmente correto

### 3. PRICE_APPLY_TO_PROFIT=true
**Problema**: Código tentava ativar temporariamente  
**Correção**: Removido completamente  
**Motivo**: Não é necessário, `aplicar_precos_no_plano` já calcula lucro_mercado_estimado

### 4. Parâmetros Incorretos
**Problema**: `tamanho_populacao` em vez de `populacao`  
**Correção**: Ajustado para `populacao`  
**Motivo**: Assinatura correta de `gerar_plano_genetico()`

### 5. Parâmetros Extras
**Problema**: Passando `municipio` e `safra` para `aplicar_precos_no_plano()`  
**Correção**: Removidos, função aceita apenas `uf`  
**Motivo**: Assinatura correta da função

---

## 🔄 Status Atual

### Implementado
- ✅ Função de comparação renomeada e corrigida
- ✅ Endpoint API criado
- ✅ Documentação interna atualizada
- ✅ Conceito corrigido (avaliação vs otimização)

### Em Teste
- 🔄 Endpoint `/comparar/lucro-mercado` com erros internos
- 🔄 Necessário debug adicional

### Pendente
- ❌ Testes completos do endpoint
- ❌ Frontend (aguardando endpoint estável)
- ❌ Relatórios (aguardando endpoint estável)
- ❌ Documentação (README, API_PROVIDERS)
- ❌ CLI v1.0.28
- ❌ Commit e deploy

---

## 🎯 Próximos Passos

### 1. Estabilizar Endpoint (Prioridade Máxima)

**Tarefas**:
1. Debug do erro interno no endpoint
2. Verificar se todas as dependências estão corretas
3. Testar com parâmetros mínimos: `?uf=SP&seed=42&geracoes=50`
4. Verificar resposta completa
5. Confirmar campos obrigatórios:
   - `modo` = "avaliacao_comparativa"
   - `lucro_sistema_total` existe
   - `lucro_mercado_total` existe
   - `itens_criticos` existe
   - `pode_usar_mercado` existe

### 2. Testes Obrigatórios

**Cenário 1 - Alta Confiabilidade**:
```bash
GET /comparar/lucro-mercado?uf=SP&seed=42&geracoes=50
```
Esperado: `pode_usar_mercado: true` (se não houver críticos)

**Cenário 2 - Baixa Confiabilidade**:
```bash
GET /comparar/lucro-mercado?uf=RJ&seed=42&geracoes=50
```
Esperado: `pode_usar_mercado: false` com motivos

**Cenário 3 - Sem UF**:
```bash
GET /comparar/lucro-mercado?seed=42&geracoes=50
```
Esperado: Funciona mas sem preços de mercado

### 3. Frontend (Após Endpoint Estável)

**Não criar ainda**. Primeiro garantir que o endpoint funciona 100%.

### 4. Documentação (Após Testes)

**Atualizar**:
- README.md: Seção "Avaliação Comparativa com Lucro de Mercado"
- docs/API_PROVIDERS.md: Endpoint e conceito
- Reforçar: "Avaliação, não otimização"

### 5. CLI v1.0.28 (Após Testes)

**Tarefas**:
- Copiar arquivos para backend-template
- Atualizar VERSION.json (1.0.28)
- Feature: `market_profit_comparative_evaluation`
- Build e publicação

---

## 📝 Conceitos Importantes

### Avaliação vs Otimização

| Aspecto | Avaliação (Fase 9.6A) | Otimização (Fase 9.6B - futura) |
|---------|----------------------|----------------------------------|
| **AG** | Roda 1 vez (lucro sistema) | Roda 2 vezes (sistema + mercado) |
| **Fitness** | Usa lucro do sistema | Usa lucro de mercado |
| **Plano** | Mesmo plano avaliado 2x | Dois planos diferentes |
| **Objetivo** | Comparar valores | Comparar estratégias |
| **Segurança** | Mais seguro | Requer validação |
| **Performance** | Mais rápido | Mais lento |

### Por que Avaliação Primeiro?

1. **Validação**: Confirma se lucro de mercado é confiável
2. **Segurança**: Não altera o plano principal
3. **Performance**: Mais rápido (1 AG em vez de 2)
4. **Honestidade**: Não finge otimizar quando só avalia
5. **Progressão**: Base para Fase 9.6B (AG experimental)

---

## 🚨 Problemas Conhecidos

### 1. Erro Interno no Endpoint
**Status**: Em investigação  
**Impacto**: Endpoint não funciona  
**Prioridade**: Alta  
**Próximo passo**: Debug detalhado

### 2. Cache do Python
**Status**: Recorrente  
**Impacto**: Mudanças não refletem imediatamente  
**Solução**: Parar Python, limpar __pycache__, reiniciar  
**Prevenção**: Usar `agroplan update` após mudanças

---

## ✅ Critérios de Aceitação (Fase 9.6A)

### Backend
- [ ] Endpoint `/comparar/lucro-mercado` funciona sem erros
- [ ] Retorna `modo: "avaliacao_comparativa"`
- [ ] Calcula `lucro_sistema_total` corretamente
- [ ] Calcula `lucro_mercado_total` corretamente
- [ ] Valida confiabilidade corretamente
- [ ] Bloqueia quando há itens críticos
- [ ] Libera quando confiabilidade alta >= 70%
- [ ] Não roda AG duas vezes
- [ ] Não ativa `PRICE_APPLY_TO_PROFIT=true`

### Testes
- [ ] Teste com SP (esperado: pode_usar_mercado depende dos dados)
- [ ] Teste sem UF (esperado: funciona mas sem preços)
- [ ] Teste com seed fixo (esperado: reprodutível)
- [ ] Teste com gerações reduzidas (esperado: mais rápido)

### Documentação
- [ ] README.md atualizado
- [ ] docs/API_PROVIDERS.md atualizado
- [ ] Conceito "avaliação vs otimização" explicado
- [ ] Aviso claro: "não substitui recomendação principal"

### CLI
- [ ] Versão 1.0.28
- [ ] Feature `market_profit_comparative_evaluation`
- [ ] Backend template sincronizado
- [ ] Publicada no npm

---

## 🎯 Fase 9.6B (Futura)

**Objetivo**: AG Experimental com Fitness de Mercado

**Quando fazer**:
- Após Fase 9.6A estável
- Após validação extensiva dos preços de mercado
- Quando `percentual_alta_confiabilidade >= 80%` consistentemente

**O que fazer**:
1. Criar função `gerar_plano_genetico_experimental_mercado()`
2. Fitness usa `lucro_mercado_estimado` em vez de `lucro_estimado`
3. Endpoint `/otimizar/experimental-mercado`
4. Comparação lado a lado: AG sistema vs AG mercado
5. Bloqueio automático se itens críticos
6. Toggle no frontend: "Usar AG experimental de mercado"

---

**Status**: Backend implementado, aguardando estabilização do endpoint  
**Próximo passo**: Debug e testes do endpoint `/comparar/lucro-mercado`
