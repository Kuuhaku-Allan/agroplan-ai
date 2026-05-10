# 🔄 INSTRUÇÕES IMPORTANTES - Reiniciar Backend

## ⚠️ AÇÃO NECESSÁRIA

O backend precisa ser **reiniciado** para carregar as 10 culturas no calendário agrícola.

Atualmente, o backend está rodando com a versão antiga (3 culturas). Após reiniciar, ele carregará a versão nova (10 culturas).

---

## 🚀 Como Reiniciar

### Opção 1: Backend Local (Python)

Se você está rodando o backend diretamente com Python:

```bash
# 1. Parar o backend atual
# Pressione Ctrl+C no terminal onde o backend está rodando

# 2. Reiniciar
cd backend
python api.py
```

### Opção 2: CLI do AgroPlan

Se você está usando a CLI:

```bash
# 1. Parar o servidor
agroplan serve off

# 2. Atualizar a CLI para versão 1.0.32
bun add -g agroplan-ai-cli@1.0.32

# 3. Reiniciar o servidor
agroplan serve on

# 4. Verificar
agroplan doctor
```

---

## ✅ Como Verificar se Funcionou

### Teste 1: Listar Culturas

**PowerShell**:
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/planejamento/culturas" -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

**Resultado esperado**:
```json
{
  "total": 10,
  "culturas": [
    "soja", "milho", "feijao", "cafe", "cana",
    "arroz", "trigo", "sorgo", "mandioca", "algodao"
  ]
}
```

Se ainda mostrar `"total": 3`, o backend não foi reiniciado.

### Teste 2: Testar Nova Cultura

**PowerShell**:
```powershell
$body = @{
    cultura = "cafe"
    planting_date = "2026-11-01"
    field = @{
        name = "Talhão Teste"
        area_ha = 5.0
        soil_type = "argiloso"
        slope = "plano"
        water_availability = "media"
    }
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/planejamento/calendario" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

**Resultado esperado**:
- `cycle_days`: 730
- `total_tasks`: ~15-20
- `cautela`: "Este calendário é uma base inicial..."

---

## 📋 O Que Foi Alterado

### Backend
- ✅ `backend/core/crop_calendar_engine.py` - 7 novas culturas adicionadas
- ✅ `backend/VERSION.json` - Versão 1.0.32
- ✅ Aviso de cautela em todos os calendários

### CLI
- ✅ `tools/agroplan-cli/` - Versão 1.0.32 publicada no npm
- ✅ Backend template sincronizado

### Documentação
- ✅ `docs/PLANEJADOR_SAFRA.md` - Fase 10.4 marcada como completa
- ✅ `README.md` - Mencionadas as 10 culturas
- ✅ `FASE10.4_CALENDARIO_10_CULTURAS.md` - Documentação completa da fase

---

## 🎯 Próximos Passos Após Reiniciar

1. **Testar no Frontend**:
   - Acesse `http://localhost:3000/planejamento`
   - Crie um talhão
   - Selecione uma das novas culturas (café, cana, arroz, etc.)
   - Gere o calendário
   - Verifique se as tarefas aparecem

2. **Testar Modo Guiado**:
   - Acesse `http://localhost:3000/planejamento`
   - Clique em "Modo Guiado"
   - Siga o wizard
   - Verifique se as 10 culturas aparecem nas recomendações

3. **Verificar Metadados**:
   - Teste o endpoint `/planejamento/culturas/cafe`
   - Verifique se retorna `category`, `water_need`, `risk_notes`, `calendar_notes`

---

## 🐛 Problemas Comuns

### "Ainda mostra 3 culturas"
**Solução**: O backend não foi reiniciado. Pare completamente o processo e inicie novamente.

### "Erro ao gerar calendário para nova cultura"
**Solução**: Verifique se o backend foi reiniciado e se a versão é 1.0.32:
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

### "CLI não atualiza"
**Solução**: Force a reinstalação:
```bash
bun remove -g agroplan-ai-cli
bun add -g agroplan-ai-cli@1.0.32
```

---

## 📞 Suporte

Se após reiniciar ainda houver problemas:

1. Verifique os logs do backend
2. Confirme que o arquivo `backend/core/crop_calendar_engine.py` tem as 10 culturas
3. Verifique se o commit `bbea00d` foi aplicado:
   ```bash
   git log --oneline -1
   ```

---

**Última atualização**: 2026-05-10  
**Versão**: 1.0.32  
**Commit**: bbea00d
