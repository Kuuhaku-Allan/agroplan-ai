# Fase Final 3 - Performance Baseline

## Objetivo

Otimizar performance da seção **Validação** e **Relatórios** do AgroPlan AI.

## Metas

- **Validação (10 rodadas)**: Reduzir de ~60s para ~10s
- **Relatórios**: Reduzir tempo de geração quando possível

## Baseline (Antes das Otimizações)

Para executar os testes de baseline:

```bash
cd backend
python main.py  # Em um terminal separado
python test_performance_validation_reports.py
```

### Tempos Esperados (Antes)

| Endpoint | Descrição | Tempo Estimado |
|----------|-----------|----------------|
| POST /validar | Força bruta | ~5-15s (depende do tamanho) |
| POST /rodadas (3) | 3 rodadas AG | ~15-20s |
| POST /rodadas (5) | 5 rodadas AG | ~25-35s |
| POST /rodadas (10) | 10 rodadas AG | ~50-70s |
| POST /relatorio | Sem clima/ZARC | ~20-30s |
| POST /relatorio | Com clima/ZARC | ~30-45s |

### Diagnóstico

#### Problema 1: /rodadas é muito lento

**Causa:**
- `executar_multiplas_rodadas()` executa `otimizar_plano_genetico()` uma vez por rodada
- Cada execução usa 100 gerações × 50 população (padrão)
- 10 rodadas = 10 × 100 × 50 = 50.000 avaliações de fitness

**Solução:**
- Criar modo "rápido" com 30 gerações × 25 população
- Implementar cache para evitar recomputação
- Permitir configuração de gerações/população

#### Problema 2: /relatorio é pesado

**Causa:**
- Executa tudo de uma vez:
  - Gera cenários
  - Executa AG
  - Valida com força bruta
  - Executa estabilidade (5 rodadas)
  - Busca ZARC
  - Busca preços
  - Valida lucro de mercado

**Solução:**
- Criar perfil "rápido" que pula estabilidade completa
- Usar cache quando possível
- Permitir passar dados já computados

## Otimizações Implementadas

### 1. Cache para /validar e /rodadas

- Cache em memória com chave baseada em parâmetros
- Segunda chamada idêntica retorna instantaneamente

### 2. Modo Rápido para Rodadas

Três modos disponíveis:

| Modo | Gerações | População | Max Rodadas |
|------|----------|-----------|-------------|
| rápido | 30 | 25 | 5 |
| normal | 60 | 35 | 10 |
| completo | 100 | 50 | 20 |

### 3. Perfil Rápido para Relatórios

- **rápido**: Usa cache, pula estabilidade completa
- **completo**: Comportamento atual (análise completa)

### 4. Frontend Atualizado

- Modo rápido como padrão
- Seletor de modo visível
- Explicação clara das diferenças

## Resultados Esperados (Depois)

| Endpoint | Modo | Tempo Esperado |
|----------|------|----------------|
| POST /rodadas (10) | rápido | ~10-15s |
| POST /rodadas (10) | completo | ~50-70s |
| POST /rodadas (10) | cache | <1s |
| POST /relatorio | rápido | ~10-15s |
| POST /relatorio | completo | ~30-45s |

## Como Testar

### Teste 1: Baseline (Antes)

```bash
cd backend
python test_performance_validation_reports.py
```

### Teste 2: Após Otimizações

```bash
# Mesmo comando, comparar resultados
python test_performance_validation_reports.py
```

### Teste 3: Cache

```bash
# Executar duas vezes seguidas
# Segunda execução deve ser quase instantânea
```

## Notas

- Modo rápido é honesto: avisa que é análise interativa
- Modo completo continua disponível para análise final
- Cache é transparente para o usuário
- Performance melhora sem perder funcionalidade
