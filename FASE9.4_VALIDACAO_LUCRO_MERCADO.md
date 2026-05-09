# Fase 9.4 - Validação dos Valores de Lucro de Mercado

**Status**: ✅ Backend Completo | ⏳ Frontend em Progresso

## Objetivo

Criar uma camada de validação e diagnóstico para comparar lucro interno vs lucro de mercado, detectar distorções e classificar confiabilidade dos dados antes de permitir ativação de `PRICE_APPLY_TO_PROFIT=true`.

---

## ✅ Parte 1 - Backend: Diagnóstico de Lucro de Mercado (COMPLETO)

### Arquivo Criado: `backend/core/market_profit_validator.py`

**Funções Implementadas:**

1. **`calcular_diferenca_lucro(lucro_sistema, lucro_mercado)`**
   - Calcula diferença absoluta e percentual
   - Determina direção (maior/menor/igual)
   - Trata divisão por zero e valores negativos

2. **`classificar_confiabilidade_lucro(item)`**
   - Critérios de classificação:
     - **Baixa**: Sem preço normalizado, sem produtividade/custo, diferença > 100%
     - **Média**: Diferença 50-100%, lucro negativo, ou fallback
     - **Alta**: Diferença < 50%
   - Retorna confiabilidade e motivos

3. **`validar_plano_lucro_mercado(resultado)`**
   - Valida todo o plano
   - Adiciona `validacao_lucro_mercado` em cada item
   - Gera resumo com contadores e alertas
   - Fornece recomendação baseada em percentuais

4. **`gerar_diagnostico_lucro_mercado(plano, uf)`**
   - Agrupa por cultura
   - Calcula médias de lucro sistema vs mercado
   - Retorna diagnóstico detalhado por cultura

---

## ✅ Parte 2 - Integração nos Endpoints

### Endpoint Criado: `GET /debug/lucro-mercado`

**Parâmetros:**
- `uf`: Unidade Federativa (opcional)
- `municipio`: Município (opcional)
- `safra`: Safra ZARC (padrão: 2025/2026)

**Resposta:**
```json
{
  "diagnostico": {
    "uf": "SP",
    "total_culturas": 6,
    "culturas": {
      "soja": {
        "total_talhoes": 2,
        "lucro_sistema_medio": 97200.0,
        "lucro_mercado_medio": 65200.13,
        "diferenca": {
          "diferenca_absoluta": -31999.87,
          "diferenca_percentual": -32.92,
          "direcao": "menor"
        },
        "confiabilidade": "alta",
        "motivos": ["Diferença aceitável (32.9%)"],
        "preco_original": 130.0,
        "unidade_original": "saca_60kg",
        "preco_por_tonelada": 2166.67,
        "normalizado": true,
        "fallback": false
      }
    }
  },
  "validacao_resumo": {
    "ativo": true,
    "total_itens": 10,
    "itens_alta_confiabilidade": 2,
    "itens_media_confiabilidade": 8,
    "itens_baixa_confiabilidade": 0,
    "percentual_alta_confiabilidade": 20.0,
    "percentual_baixa_confiabilidade": 0.0,
    "alertas": [],
    "total_alertas": 0,
    "recomendacao": "Confiabilidade mista. Revise itens com baixa confiabilidade e valide dados de mercado."
  }
}
```

### Integração Automática

A validação é aplicada automaticamente em:
- ✅ `/dashboard`
- ✅ `/recomendacoes`
- ✅ `/otimizar`
- ✅ `/relatorio`

Através da função `aplicar_precos_no_plano()` que chama `validar_plano_lucro_mercado()`.

---

## 📊 Resultados do Teste Real (SP)

### Resumo de Confiabilidade
- **Total de itens**: 10 talhões
- **Alta confiabilidade**: 2 (20%)
- **Média confiabilidade**: 8 (80%)
- **Baixa confiabilidade**: 0 (0%)

### Análise por Cultura

| Cultura | Lucro Sistema | Lucro Mercado | Diferença % | Confiabilidade | Motivo Principal |
|---------|---------------|---------------|-------------|----------------|------------------|
| Soja | R$ 97.200 | R$ 65.200 | -32.9% | Alta | Diferença aceitável |
| Mandioca | R$ 73.013 | R$ 13.443 | -81.6% | Média | Fallback + diferença moderada |
| Milho | R$ 95.475 | R$ 36.338 | -61.9% | Média | Diferença moderada |
| Sorgo | R$ 71.280 | R$ 31.000 | -56.5% | Média | Fallback + diferença moderada |
| Trigo | R$ 127.800 | R$ 55.350 | -56.7% | Média | Fallback + diferença moderada |
| Arroz | R$ 50.260 | R$ 35.140 | -30.1% | Média | Fallback (apesar de diferença aceitável) |

### Observações Importantes

1. **Soja**: Única cultura com alta confiabilidade e preço real (não fallback)
2. **Fallbacks**: 5 de 6 culturas usam preços de referência
3. **Tendência**: Lucro de mercado consistentemente menor que lucro do sistema
4. **Recomendação**: "Confiabilidade mista. Revise itens com baixa confiabilidade e valide dados de mercado."

---

## 🔧 Correções Técnicas Realizadas

### Problema 1: Import Error
**Erro**: `cannot import name 'gerar_recomendacoes' from 'core.planner'`

**Causa**: Endpoint tentava importar função inexistente

**Solução**: Usar `gerar_plano_inteligente()` e mapear `cultura_recomendada` → `cultura`

### Problema 2: Mapeamento de Campos
**Erro**: `'NoneType' object has no attribute 'lower'`

**Causa**: `gerar_plano_inteligente()` retorna `cultura_recomendada`, mas `price_adapter` espera `cultura`

**Solução**: Adicionar mapeamento explícito no endpoint

### Problema 3: Arquivos Não Copiados
**Erro**: Módulo `market_profit_validator` não encontrado

**Causa**: `agroplan setup --force` não copiou todos os arquivos

**Solução**: Cópia manual dos arquivos:
- `backend/api.py`
- `backend/core/market_profit_validator.py`
- `backend/core/price_adapter.py`

---

## ✅ Parte 3 - Relatórios (COMPLETO)

### Função Criada: `gerar_secao_validacao_lucro_mercado(resultado, formato)`

**Implementação:**
- Gera seção completa de validação para relatórios MD e TXT
- Mostra resumo de confiabilidade com percentuais
- Lista alertas principais (máximo 5)
- Tabela detalhada por talhão com lucros e diferenças
- Explicação sobre classificação de confiabilidade
- Aviso sobre natureza experimental

**Formato Markdown:**
```markdown
## 🔍 Validação do Lucro de Mercado

### Resumo de Confiabilidade
- Total de itens analisados: 10
- Alta confiabilidade: 2 (20.0%) 🟢
- Média confiabilidade: 8 (80.0%) 🟡
- Baixa confiabilidade: 0 (0.0%) 🔴

**Recomendação**: Confiabilidade mista. Revise itens com baixa confiabilidade...

### Detalhes por Talhão
| Talhão | Cultura | Lucro Sistema | Lucro Mercado | Diferença % | Confiabilidade |
|--------|---------|---------------|---------------|-------------|----------------|
| 1 | SOJA | R$ 81.000,00 | R$ 65.200,13 | -32.9% | 🟢 Alta |
...
```

**Integração:**
- Adicionada automaticamente após seção de preços
- Só aparece se `validacao_lucro_mercado.ativo == true`
- Funciona em ambos formatos (MD e TXT)

---

## 📋 Próximas Etapas

### Parte 4 - Frontend ⏳
- [ ] Atualizar `MarketProfitComparison` component
- [ ] Mostrar confiabilidade com cores (verde/âmbar/vermelho)
- [ ] Adicionar banner no Dashboard para baixa confiabilidade
- [ ] Atualizar tipos TypeScript

### Parte 5 - Documentação ⏳
- [ ] Atualizar README.md
- [ ] Atualizar docs/API_PROVIDERS.md
- [ ] Documentar endpoint `/debug/lucro-mercado`

### Parte 6 - CLI ⏳
- [ ] Copiar arquivos para `backend-template`
- [ ] Atualizar VERSION.json para v1.0.26
- [ ] Adicionar feature `market_profit_validation`
- [ ] Build e publicar CLI

### Parte 7 - Testes Finais ⏳
- [ ] Testar todos os endpoints
- [ ] Verificar frontend build
- [ ] Testar CLI update
- [ ] Commit e push

---

## 🎯 Critérios de Aceitação

- [x] Lucro principal não muda
- [x] Lucro de mercado recebe classificação de confiabilidade
- [x] Endpoint `/debug/lucro-mercado` funciona
- [x] Validação integrada em todos os endpoints principais
- [x] Relatório mostra validação
- [ ] UI mostra diferença e confiabilidade
- [x] Valores discrepantes não são tratados como definitivos
- [ ] Build passa
- [ ] CLI publicada

---

## 📝 Arquivos Modificados

### Criados
- `backend/core/market_profit_validator.py`

### Modificados
- `backend/api.py` (novo endpoint `/debug/lucro-mercado`)
- `backend/core/price_adapter.py` (integração com validador)
- `backend/core/report_generator.py` (seção de validação)

### A Modificar
- `frontend/lib/types.ts`
- `frontend/components/prices/market-profit-comparison.tsx`
- `frontend/app/dashboard/page.tsx`
- `tools/agroplan-cli/package.json`
- `backend/VERSION.json`
- `README.md`
- `docs/API_PROVIDERS.md`

---

## 💡 Insights

1. **Validação é Essencial**: Os dados mostram que 80% dos itens têm confiabilidade média, validando a decisão de não ativar `PRICE_APPLY_TO_PROFIT` automaticamente.

2. **Fallbacks Dominam**: 5 de 6 culturas usam preços de referência, indicando necessidade de mais dados reais de mercado.

3. **Lucro Sistema > Lucro Mercado**: Consistentemente, o lucro do sistema é maior, sugerindo que os preços internos podem estar otimistas ou os preços de mercado estão desatualizados.

4. **Soja é Referência**: Única cultura com alta confiabilidade, pode servir como baseline para validação de outras culturas.

5. **Classificação Funciona**: O sistema de classificação (alta/média/baixa) está funcionando conforme esperado e fornece feedback útil.
