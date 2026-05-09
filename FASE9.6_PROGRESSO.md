# Fase 9.6 - Modo Comparativo de Otimização - EM PROGRESSO

**Data**: 09/05/2026  
**Status**: 🔄 **EM ANDAMENTO**

---

## 📋 Objetivo

Criar um modo experimental que compare dois planos de otimização lado a lado:
1. **Plano Sistema**: Otimização com lucro interno (atual)
2. **Plano Mercado**: Simulação com lucro de mercado normalizado

**Importante**: Não substituir o plano principal. Bloquear uso automático se houver itens críticos.

---

## ✅ Implementado

### 1. Backend - Comparador

**Arquivo**: `backend/core/market_profit_comparator.py` ✅

**Função principal**: `comparar_otimizacao_lucro_sistema_vs_mercado()`

**Funcionalidades**:
- Gera plano com lucro do sistema (PRICE_APPLY_TO_PROFIT=false)
- Gera plano com lucro de mercado (PRICE_APPLY_TO_PROFIT=true temporariamente)
- Usa mesmo seed para comparação justa
- Calcula diferença absoluta e percentual entre os planos
- Valida confiabilidade do plano de mercado
- Determina se plano de mercado pode ser usado

**Regras de Segurança**:
```python
pode_usar_mercado = True if:
    - itens_criticos == 0
    - itens_baixa_confiabilidade == 0
    - percentual_alta_confiabilidade >= 70%
else:
    pode_usar_mercado = False
```

**Retorno**:
```json
{
  "plano_sistema": {...},
  "plano_mercado": {...},
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
  "aviso": "Este modo é experimental. O lucro de mercado não substitui a recomendação principal.",
  "objetivo": "equilibrado",
  "parametros": {...}
}
```

**Função auxiliar**: `gerar_resumo_comparacao()` ✅
- Gera resumo textual para relatórios
- Formato Markdown
- Inclui totais, validação, status e avisos

### 2. Backend - Endpoint API

**Endpoint**: `GET /comparar/lucro-mercado` ✅

**Parâmetros**:
- `objetivo`: Objetivo de otimização (padrão: "equilibrado")
- `geracoes`: Número de gerações do AG (padrão: 100)
- `populacao`: Tamanho da população (padrão: 50)
- `seed`: Seed para reprodutibilidade (opcional)
- `lat`, `lon`: Coordenadas geográficas (opcional)
- `uf`: Unidade Federativa (opcional)
- `municipio`: Município (opcional)
- `safra`: Safra ZARC (padrão: "2025/2026")

**Exemplo**:
```bash
GET /comparar/lucro-mercado?uf=SP&municipio=Clementina&safra=2025/2026&seed=42&geracoes=50
```

**Resposta**: JSON com plano_sistema, plano_mercado e comparação

---

## 🔄 Em Andamento

### 3. Frontend - Página de Comparação

**Tarefas pendentes**:
- [ ] Criar página `/comparacao-mercado` ou aba no Genético
- [ ] Cards lado a lado para plano sistema vs plano mercado
- [ ] Visualização de diferença de lucro
- [ ] Alerta visual se plano de mercado estiver bloqueado
- [ ] Lista de itens críticos
- [ ] Texto obrigatório: "Este modo é experimental..."

### 4. Relatórios

**Tarefas pendentes**:
- [ ] Adicionar seção opcional "Comparação Experimental com Lucro de Mercado"
- [ ] Usar função `gerar_resumo_comparacao()`
- [ ] Mostrar plano interno vs plano mercado
- [ ] Indicar se bloqueado/liberado
- [ ] Listar motivos de bloqueio

### 5. Documentação

**Tarefas pendentes**:
- [ ] Atualizar README.md
- [ ] Atualizar docs/API_PROVIDERS.md
- [ ] Explicar modo comparativo
- [ ] Documentar regras de bloqueio
- [ ] Reforçar que PRICE_APPLY_TO_PROFIT=false continua padrão

### 6. CLI v1.0.28

**Tarefas pendentes**:
- [ ] Copiar arquivos para backend-template
- [ ] Atualizar VERSION.json (1.0.28)
- [ ] Adicionar feature `market_profit_comparison_mode`
- [ ] Build e publicação

### 7. Testes

**Tarefas pendentes**:
- [ ] Testar endpoint `/comparar/lucro-mercado`
- [ ] Verificar bloqueio quando há itens críticos
- [ ] Verificar liberação quando confiabilidade alta
- [ ] Frontend build
- [ ] CLI update e doctor

---

## 🎯 Próximos Passos

1. **Testar endpoint backend** com diferentes cenários
2. **Criar interface frontend** para visualização comparativa
3. **Adicionar seção em relatórios**
4. **Atualizar documentação**
5. **Publicar CLI v1.0.28**
6. **Commit e deploy**

---

## 📝 Notas Técnicas

### Comparação Justa

O comparador usa o **mesmo seed** para ambos os planos, garantindo que:
- Mesma população inicial
- Mesma sequência de mutações
- Mesma sequência de crossovers
- Diferenças são apenas devido ao lucro usado

### Segurança

- `PRICE_APPLY_TO_PROFIT` é alterado temporariamente apenas durante geração do plano de mercado
- Valor original é sempre restaurado (usando `finally`)
- Plano principal nunca é afetado
- Bloqueio automático protege contra uso de dados não confiáveis

### Performance

- Endpoint pode demorar ~10-20 segundos (roda AG duas vezes)
- Considerar cache para mesmos parâmetros
- Reduzir gerações para testes (ex: 50 em vez de 100)

---

**Status**: Backend implementado, aguardando frontend e testes
