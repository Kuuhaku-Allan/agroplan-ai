# Fase 10.5.2.2 — Correção do Parser NASA POWER

**Status**: ✅ Concluída  
**Data**: 10/05/2026  
**Versão Backend**: 1.0.37  
**Versão CLI**: 1.0.37

## 🎯 Objetivo

Corrigir o parser NASA POWER que estava sempre caindo em fallback devido a bug no mapeamento de chaves mensais.

## 🐛 Problema Identificado

### Sintoma
- NASA POWER sempre retornava `None`
- Sistema sempre caía no fallback `climate-fallback`
- Endpoint `/dados/clima/nasa-power` retornava "Não foi possível obter dados NASA POWER"

### Causa Raiz
O parser estava procurando chaves numéricas (`"5"`, `"6"`, etc.) mas a NASA POWER Climatology API retorna chaves alfabéticas (`"MAY"`, `"JUN"`, etc.):

```python
# ❌ Código antigo (errado)
month_str = str(month)  # "5"
temp_avg = properties.get("T2M", {}).get(month_str)  # None

# ✅ Código novo (correto)
month_key = MONTH_KEYS.get(month)  # "MAY"
temp_avg = get_month_value(properties.get("T2M"), month)  # 20.7
```

### Evidência
Debug endpoint mostrou a estrutura real da resposta NASA POWER:

```json
{
  "parameter_keys": {
    "T2M": ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "ANN"],
    "PRECTOTCORR": ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "ANN"]
  }
}
```

## ✅ Solução Implementada

### 1. Mapeamento de Meses
Criado dicionário para mapear mês numérico → chave alfabética:

```python
MONTH_KEYS = {
    1: "JAN", 2: "FEB", 3: "MAR", 4: "APR",
    5: "MAY", 6: "JUN", 7: "JUL", 8: "AUG",
    9: "SEP", 10: "OCT", 11: "NOV", 12: "DEC"
}
```

### 2. Função Helper com Fallback Robusto
Criada função `get_month_value()` que tenta múltiplos formatos:

```python
def get_month_value(parameter_data: Dict, month: int) -> Optional[float]:
    if not parameter_data:
        return None
    
    # Tentativa 1: Chave alfabética (MAY)
    month_key = MONTH_KEYS.get(month)
    if month_key and month_key in parameter_data:
        return parameter_data.get(month_key)
    
    # Tentativa 2: Chave numérica string ("5")
    if str(month) in parameter_data:
        return parameter_data.get(str(month))
    
    # Tentativa 3: Chave numérica com zero ("05")
    if f"{month:02d}" in parameter_data:
        return parameter_data.get(f"{month:02d}")
    
    return None
```

### 3. Parâmetro PRECTOTCORR_SUM
Adicionado parâmetro para obter precipitação total mensal:

```python
parameters = [
    "T2M",              # Temperatura média
    "T2M_MAX",          # Temperatura máxima
    "T2M_MIN",          # Temperatura mínima
    "PRECTOTCORR",      # Precipitação diária média
    "PRECTOTCORR_SUM",  # Precipitação total mensal ✨ NOVO
]
```

### 4. Lógica de Precipitação
Prioriza total mensal, fallback para média diária:

```python
precip_sum = get_month_value(properties.get("PRECTOTCORR_SUM"), month)
precip_daily = get_month_value(properties.get("PRECTOTCORR"), month)

if precip_sum is not None:
    precip_monthly = precip_sum
    precip_daily_avg = precip_sum / 30
elif precip_daily is not None:
    precip_daily_avg = precip_daily
    precip_monthly = precip_daily * 30
else:
    return None
```

### 5. Endpoint de Debug
Criado `/dados/clima/nasa-power/debug` para diagnóstico:

```bash
GET /dados/clima/nasa-power/debug?lat=-21.56&lon=-50.45&month=5
```

Retorna:
- URL e parâmetros da requisição
- Status code da resposta
- Chaves de cada parâmetro
- Valores extraídos
- Estrutura bruta da resposta

### 6. Correção de Nomes de Campos
Atualizados campos em `calendar_weather_provider.py` e `calendar_weather_adapter.py`:

```python
# ❌ Antigo
"precipitation_mm_avg": nasa_data["precipitation_mm_avg"]

# ✅ Novo
"precipitation_daily_avg": nasa_data["precipitation_daily_avg"]
"precipitation_monthly_total": nasa_data["precipitation_monthly_total"]
```

## 📊 Resultados

### Antes (v1.0.36)
```json
{
  "message": "Não foi possível obter dados NASA POWER para esta localização.",
  "lat": -21.56,
  "lon": -50.45,
  "month": 5
}
```

### Depois (v1.0.37)
```json
{
  "source": "nasa-power",
  "forecast_type": "climatology",
  "month": 5,
  "month_key": "MAY",
  "temperature_avg": 20.7,
  "temperature_max": 33.1,
  "temperature_min": 6.1,
  "precipitation_expected": "Chuvas ocasionais",
  "precipitation_daily_avg": 2.4,
  "precipitation_monthly_total": 71.0,
  "confidence": "media",
  "note": "Dados climatológicos/históricos NASA POWER, não previsão exata."
}
```

### Calendário com Clima
```json
{
  "weather_enabled": true,
  "weather_summary": {
    "forecast_tasks": 0,
    "climatology_tasks": 8,
    "no_weather_tasks": 7,
    "sources": ["nasa-power"]
  },
  "tasks": [
    {
      "date": "2027-02-12",
      "title": "Colher soja",
      "weather_context": {
        "active": true,
        "source": "nasa-power",
        "forecast_type": "climatology",
        "summary": "Climatologia NASA POWER: temperatura média 26°C, Chuvas frequentes",
        "precipitation_mm": 170.9,
        "temperature_min": 15.9,
        "temperature_max": 40.6,
        "recommendation": "Calor elevado previsto (40.6°C). Monitorar estresse hídrico da cultura.",
        "confidence": "media"
      }
    }
  ]
}
```

## 🧪 Testes Realizados

### 1. Endpoint NASA POWER
```bash
# Local
curl "http://localhost:8000/dados/clima/nasa-power?lat=-21.56&lon=-50.45&month=5"
# ✅ Retorna source: "nasa-power"

# Render (após deploy)
curl "https://agroplan-ai-api.onrender.com/dados/clima/nasa-power?lat=-21.56&lon=-50.45&month=5"
# ✅ Retorna source: "nasa-power"
```

### 2. Endpoint Debug
```bash
curl "http://localhost:8000/dados/clima/nasa-power/debug?lat=-21.56&lon=-50.45&month=5"
# ✅ Mostra chaves: ["JAN", "FEB", "MAY", ...]
# ✅ Mostra valores extraídos: T2M: 20.66, PRECTOTCORR_SUM: 71.04
```

### 3. Calendário com Clima
```bash
POST /planejamento/calendario
{
  "cultura": "soja",
  "planting_date": "2026-10-15",
  "field": {
    "lat": -21.56,
    "lon": -50.45,
    ...
  },
  "usar_clima": true
}
# ✅ weather_enabled: true
# ✅ sources: ["nasa-power"]
# ✅ climatology_tasks: 8
```

### 4. Frontend Build
```bash
cd frontend
npm run build
# ✅ Build successful
```

## 📦 Arquivos Modificados

### Backend
- `backend/providers/nasa_power_provider.py` - Parser corrigido + debug function
- `backend/providers/calendar_weather_provider.py` - Nomes de campos atualizados
- `backend/core/calendar_weather_adapter.py` - Nomes de campos atualizados
- `backend/api.py` - Endpoint debug adicionado
- `backend/VERSION.json` - v1.0.37 + feature `nasa_power_parser_fix`

### CLI
- `tools/agroplan-cli/package.json` - v1.0.37
- `tools/agroplan-cli/backend-template/*` - Sincronizado

## 🚀 Deploy

### CLI
```bash
cd tools/agroplan-cli
bun run build
npm publish --access public
# ✅ agroplan-ai-cli@1.0.37 published
```

### Render
```bash
git add .
git commit -m "fix: parse NASA POWER climatology monthly keys (MAY not 5)"
git push origin main
# ✅ Deploy automático iniciado
```

## 🎓 Lições Aprendidas

### 1. Sempre Verificar Formato Real da API
- Não assumir formato de resposta
- Criar endpoint debug para diagnóstico
- Testar com dados reais antes de considerar concluído

### 2. Fallback é Segurança, Não Solução
- Fallback funcionando não prova que integração funciona
- Deve-se verificar que a fonte primária retorna dados reais
- Logs devem distinguir entre sucesso e fallback

### 3. Robustez com Múltiplos Formatos
- Tentar formato esperado primeiro
- Ter fallbacks para formatos alternativos
- Documentar qual formato é o padrão

### 4. Nomes de Campos Consistentes
- Atualizar todos os lugares que usam um campo renomeado
- Usar busca global para encontrar todas as ocorrências
- Testar integração completa após mudanças

## 📈 Próximos Passos

### Fase 10.5.2.3 — Verificação Render
- [ ] Aguardar deploy Render completar
- [ ] Testar endpoint NASA POWER no Render
- [ ] Testar calendário com clima no Render
- [ ] Verificar logs do Render para confirmar NASA POWER ativo
- [ ] Testar frontend em produção

### Fase 10.6 — Replanejamento (Futuro)
- Só iniciar após NASA POWER 100% funcional
- Implementar ajuste de calendário baseado em clima
- Notificações de mudanças climáticas
- Sugestões de replanejamento

## ✅ Critérios de Aceitação

- [x] NASA POWER retorna `source: "nasa-power"` para Clementina-SP
- [x] `month_key: "MAY"` aparece na resposta
- [x] Temperatura e precipitação não são `None`
- [x] Calendário usa `nasa-power` para tarefas longas (17+ dias)
- [x] Fallback só acontece quando NASA falha de verdade
- [x] CLI 1.0.37 publicada
- [x] Frontend build passa
- [x] Commit e push realizados
- [x] Render deploy verificado

## 🌐 Verificação em Produção

### Render Version Check
```bash
GET https://agroplan-ai-api.onrender.com/debug/version
```

**Resultado**:
```json
{
  "backend_template_version": "1.0.37",
  "cli_version": "1.0.37",
  "features": [..., "nasa_power_parser_fix"]
}
```
✅ **Render atualizado para v1.0.37**

### NASA POWER Endpoint
```bash
GET https://agroplan-ai-api.onrender.com/dados/clima/nasa-power?lat=-21.56&lon=-50.45&month=5
```

**Resultado**:
```json
{
  "source": "nasa-power",
  "forecast_type": "climatology",
  "month": 5,
  "month_key": "MAY",
  "temperature_avg": 20.7,
  "temperature_max": 33.1,
  "temperature_min": 6.1,
  "precipitation_expected": "Chuvas ocasionais",
  "precipitation_daily_avg": 2.4,
  "precipitation_monthly_total": 71.0,
  "confidence": "media"
}
```
✅ **NASA POWER funcionando em produção**

### Debug Endpoint
```bash
GET https://agroplan-ai-api.onrender.com/dados/clima/nasa-power/debug?lat=-21.56&lon=-50.45&month=5
```

**Resultado**:
```json
{
  "status": "success",
  "month_key": "MAY",
  "parameter_keys": {
    "T2M": ["JAN", "FEB", "MAR", "APR", "MAY", ...],
    "PRECTOTCORR_SUM": ["JAN", "FEB", "MAR", "APR", "MAY", ...]
  },
  "extracted_values": {
    "T2M": 20.66,
    "T2M_MAX": 33.13,
    "T2M_MIN": 6.14,
    "PRECTOTCORR": 2.29,
    "PRECTOTCORR_SUM": 71.04
  }
}
```
✅ **Parser lendo chaves alfabéticas corretamente**

### Calendário com Clima
```bash
POST https://agroplan-ai-api.onrender.com/planejamento/calendario
{
  "cultura": "milho",
  "planting_date": "2026-05-10",
  "usar_clima": true,
  "field": {
    "lat": -21.56,
    "lon": -50.45,
    ...
  }
}
```

**Resultado**:
```json
{
  "weather_enabled": true,
  "weather_summary": {
    "forecast_tasks": 2,
    "climatology_tasks": 6,
    "no_weather_tasks": 7,
    "sources": ["nasa-power", "open-meteo"]
  },
  "tasks": [
    {
      "date": "2026-05-10",
      "title": "Plantar milho",
      "weather_context": {
        "source": "open-meteo",
        "forecast_type": "forecast"
      }
    },
    {
      "date": "2026-09-27",
      "title": "Colher milho",
      "weather_context": {
        "source": "nasa-power",
        "forecast_type": "climatology"
      }
    }
  ]
}
```
✅ **Calendário usando Open-Meteo (0-16 dias) e NASA POWER (17+ dias)**

### Hierarquia de Fontes Confirmada

1. **0-16 dias**: Open-Meteo (previsão meteorológica real)
2. **17+ dias**: NASA POWER (climatologia/histórico)
3. **Fallback**: climate-fallback local (apenas se NASA POWER falhar)

## 🏆 Conclusão

**Fase 10.5.2.2 concluída com sucesso!**

O parser NASA POWER agora funciona corretamente em **local e produção**:
- ✅ Lê chaves alfabéticas (MAY, JUN, etc.)
- ✅ Tem fallback robusto para formatos alternativos
- ✅ Retorna precipitação diária e mensal
- ✅ Integra com calendário agrícola
- ✅ Endpoint debug para diagnóstico
- ✅ CLI 1.0.37 publicada
- ✅ Render v1.0.37 verificado
- ✅ NASA POWER ativo em produção

**Sistema de clima completo e funcional**:
- 0-16 dias: Previsão real (Open-Meteo)
- 17+ dias: Climatologia (NASA POWER)
- Fallback: Dados locais simplificados

**Próximo passo**: Fase 10.6 — Replanejamento por Imprevistos (agora que a base climática está correta).
