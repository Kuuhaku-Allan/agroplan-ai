# Fase 8.2 - Parser de Decêndios ZARC - COMPLETO ✅

**Data:** 08/05/2026  
**Status:** Implementado e testado com sucesso

## Objetivo

Transformar os decêndios do CSV ZARC (dec1-dec36) em janelas de plantio compreensíveis para o sistema e para o usuário.

## Implementação Realizada

### 1. Funções de Parser Implementadas

#### `decendio_para_periodo(dec: int)`
Converte número do decêndio (1-36) para período do ano (DD/MM).

**Exemplo:**
- `dec1` → 01/01 a 10/01
- `dec10` → 01/04 a 10/04
- `dec36` → 21/12 a 31/12

#### `mapear_codigo_solo(cod_solo: str)`
Mapeia códigos de solo do CSV para nomes legíveis.

**Mapeamento:**
- Códigos 1, 11-13 → "arenoso"
- Códigos 2, 14-16 → "medio"
- Códigos 3, 17-19 → "argiloso"

#### `extrair_janelas_plantio(registro: Dict)`
Extrai janelas de plantio dos decêndios do CSV.

**Lógica:**
1. Percorre dec1-dec36
2. Valores válidos: 20 (baixo), 30 (médio), 40 (alto)
3. Agrupa decêndios consecutivos
4. Calcula risco predominante pela média:
   - Média ≤ 25 → baixo
   - Média ≤ 35 → médio
   - Média > 35 → alto

**Exemplo:**
```
Entrada: dec10=20, dec11=20, dec12=20, dec13=30, dec14=30
Saída: {
  "inicio": "01/04",
  "fim": "20/05",
  "risco_predominante": "baixo",
  "decendios": [10, 11, 12, 13, 14]
}
```

#### `escolher_melhor_janela(janelas: List)`
Escolhe a melhor janela de plantio.

**Critérios (em ordem):**
1. Menor risco predominante
2. Maior duração (mais decêndios)
3. Primeira janela (desempate)

#### `normalizar_registro_oficial(row: Dict)`
Normaliza registro do CSV oficial para formato padrão interno.

### 2. Atualização do `buscar_zarc()`

A função foi atualizada para:
- Detectar se está usando CSV oficial ou fallback
- Processar decêndios quando usar CSV oficial
- Extrair janelas de plantio
- Escolher melhor janela
- Retornar resposta estruturada com rastreabilidade honesta

**Resposta quando encontra no CSV oficial:**
```json
{
  "source": "zarc-oficial" ou "zarc-cache",
  "safra": "2025/2026",
  "cultura": "Soja",
  "uf": "SP",
  "municipio": "Clementina",
  "geocodigo": "3511904",
  "solo_codigo": "16",
  "solo": "medio",
  "janela_plantio": {
    "inicio": "11/09",
    "fim": "31/12"
  },
  "risco": "baixo",
  "decendios_recomendados": [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
  "fallback": false,
  "encontrado": true,
  "observacao": "Dados obtidos da Tábua de Risco do ZARC (Ministério da Agricultura)."
}
```

**Resposta quando não encontra:**
```json
{
  "source": "zarc-cache",
  "fallback": false,
  "encontrado": false,
  "message": "Nenhuma recomendação ZARC encontrada para os parâmetros informados."
}
```

**Resposta quando usa fallback:**
```json
{
  "source": "zarc-fallback",
  "safra": "2025/2026",
  "cultura": "soja",
  "uf": "SP",
  "municipio": "sao paulo",
  "solo": "argiloso",
  "janela_plantio": {
    "inicio": "10/10",
    "fim": "15/12"
  },
  "risco": "baixo",
  "fallback": true,
  "encontrado": true,
  "observacao": "Dados simplificados locais usados porque o CSV oficial não estava disponível."
}
```

## Testes Realizados

### Teste 1: Parser de Decêndios
```bash
python backend/test_zarc_parser.py
```

**Resultado:** ✅ Todas as funções testadas com sucesso
- Conversão de decêndios funcionando
- Mapeamento de solo correto
- Extração de janelas funcionando
- Escolha da melhor janela correta

### Teste 2: Endpoint API - Soja/SP/Clementina
```bash
GET /dados/zarc?cultura=soja&uf=SP&municipio=Clementina&solo=medio
```

**Resultado:** ✅ Sucesso
```json
{
  "source": "zarc-cache",
  "cultura": "Soja",
  "uf": "SP",
  "municipio": "Clementina",
  "janela_plantio": {
    "inicio": "11/09",
    "fim": "31/12"
  },
  "risco": "baixo",
  "decendios_recomendados": [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
  "fallback": false,
  "encontrado": true
}
```

### Teste 3: Endpoint API - Feijão/SP (genérico)
```bash
GET /dados/zarc?cultura=feijao&uf=SP
```

**Resultado:** ✅ Sucesso
```json
{
  "source": "zarc-cache",
  "cultura": "Feijão",
  "uf": "SP",
  "municipio": "Taiaçu",
  "janela_plantio": {
    "inicio": "01/01",
    "fim": "20/07"
  },
  "risco": "baixo",
  "decendios_recomendados": [1, 2, 3, ..., 20],
  "fallback": false,
  "encontrado": true
}
```

### Teste 4: Endpoint API - Cultura inexistente
```bash
GET /dados/zarc?cultura=banana&uf=SP
```

**Resultado:** ✅ Sucesso (resposta honesta)
```json
{
  "source": "zarc-cache",
  "fallback": false,
  "encontrado": false,
  "message": "Nenhuma recomendação ZARC encontrada para os parâmetros informados."
}
```

### Teste 5: Endpoint API - Milho/PR/Londrina
```bash
GET /dados/zarc?cultura=milho&uf=PR&municipio=Londrina&solo=argiloso
```

**Resultado:** ✅ Sucesso (não encontrado no CSV, resposta honesta)
```json
{
  "source": "zarc-cache",
  "fallback": false,
  "encontrado": false,
  "message": "Nenhuma recomendação ZARC encontrada para os parâmetros informados."
}
```

## Arquivos Modificados

1. ✅ `backend/providers/zarc_provider.py` - Parser implementado
2. ✅ `backend/api.py` - Endpoint `/dados/zarc` já existente e funcionando
3. ✅ `backend/test_zarc_parser.py` - Testes criados
4. ✅ `docs/ZARC.md` - Documentação atualizada
5. ✅ `tools/agroplan-cli/backend-template/providers/zarc_provider.py` - Sincronizado

## CLI

### Versão Atualizada
- **Versão:** 1.0.15
- **Build:** ✅ Concluído
- **Publicação:** ⏳ Pendente (requer autenticação npm)

**Para publicar manualmente:**
```bash
cd tools/agroplan-cli
npm login
npm publish
```

### Teste na API Local

**Após publicação, testar:**
```bash
# Instalar nova versão
bun add -g agroplan-ai-cli@latest

# Parar servidor
agroplan serve off

# Reinstalar backend
agroplan setup --force --python="C:\Users\Defal\AppData\Local\Programs\Python\Python311\python.exe"

# Iniciar servidor
agroplan serve on

# Testar endpoint
curl "http://localhost:8000/dados/zarc?cultura=soja&uf=SP&municipio=Clementina&solo=medio"
```

## Rastreabilidade Honesta

O sistema mantém rastreabilidade honesta em todos os casos:

| Situação | source | fallback | encontrado |
|----------|--------|----------|------------|
| CSV oficial baixado agora | `zarc-oficial` | `false` | `true` |
| CSV oficial em cache válido | `zarc-cache` | `false` | `true` |
| CSV oficial mas não encontrou | `zarc-cache` | `false` | `false` |
| Usando dados simplificados | `zarc-fallback` | `true` | `true` |

## Próximos Passos

### Fase 8.3 - Integração no Produto

1. **Talhões** - Mostrar janela ZARC da cultura recomendada
2. **Relatórios** - Seção ZARC por talhão
3. **Dashboard** - Banner ZARC ativo
4. **Genético** - Ajuste leve por risco ZARC

### Melhorias Futuras

- Indexar CSV por cultura/UF/município para busca mais rápida
- Cache em memória para buscas frequentes
- Compressão do CSV
- Suporte a múltiplas safras

## Conclusão

✅ **Fase 8.2 concluída com sucesso!**

O parser de decêndios ZARC está:
- ✅ Implementado e testado
- ✅ Funcionando no endpoint `/dados/zarc`
- ✅ Sincronizado com CLI
- ✅ Documentado
- ✅ Mantendo rastreabilidade honesta

O sistema agora transforma os dados brutos do CSV oficial (dec1-dec36) em janelas de plantio legíveis e úteis para o usuário, mantendo sempre a honestidade sobre a origem dos dados (oficial, cache ou fallback).

---

**Commits:**
- Parser de decêndios implementado
- Testes criados e validados
- Documentação atualizada
- CLI sincronizada (v1.0.15)
