# 🧪 Instruções de Teste - Fase Final de Validação

**Versão:** Backend 5.0.0 | CLI 1.0.41  
**Data:** 17 de maio de 2026

---

## 📋 Checklist de Testes

### ✅ Fase 1: Verificar Instalação

```bash
# 1. Verificar versão da CLI
agroplan --version
# Esperado: 1.0.41

# 2. Verificar saúde do backend
agroplan doctor
# Esperado: Todas as verificações passando
```

---

### ✅ Fase 2: Testes Automatizados

#### Teste 1: Iniciar Backend Local

```bash
# Terminal 1: Iniciar backend
cd backend
python api.py

# Aguardar mensagem:
# INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### Teste 2: Executar Testes de Combinações (48 testes)

```bash
# Terminal 2: Executar testes
python backend/test_planning_field_options.py --mode combinacoes

# Resultado esperado:
# ================================================================================
#                   TESTE DE VALIDAÇÃO DE OPÇÕES DE PLANEJAMENTO                  
# ================================================================================
# 
# ℹ API Base URL: http://localhost:8000
# ℹ Cultura de teste: milho
# ℹ Total de combinações: 4 x 4 x 3 = 48
# ✓ API está disponível
# 
# [1/48] Testando: argiloso/plano/baixa... ✓ OK
# [2/48] Testando: argiloso/plano/media... ✓ OK
# ...
# [48/48] Testando: siltoso/ingreme/alta... ✓ OK
# 
# ================================================================================
#                               RESUMO DOS TESTES                              
# ================================================================================
# Total de combinações testadas: 48
# ✓ Sucessos: 48
# ✓ Todas as combinações passaram! ✓
```

#### Teste 3: Executar Testes de Culturas (10 testes)

```bash
python backend/test_planning_field_options.py --mode culturas

# Resultado esperado:
# ================================================================================
#                           TESTE DE TODAS AS CULTURAS                           
# ================================================================================
# 
# ℹ Combinação padrão: argiloso/plano/media
# ℹ Total de culturas: 10
# 
# [1/10] Testando cultura: soja... ✓ OK
# [2/10] Testando cultura: milho... ✓ OK
# [3/10] Testando cultura: feijao... ✓ OK
# [4/10] Testando cultura: cafe... ✓ OK
# [5/10] Testando cultura: cana... ✓ OK
# [6/10] Testando cultura: arroz... ✓ OK
# [7/10] Testando cultura: trigo... ✓ OK
# [8/10] Testando cultura: sorgo... ✓ OK
# [9/10] Testando cultura: mandioca... ✓ OK
# [10/10] Testando cultura: algodao... ✓ OK
# 
# ================================================================================
#                              RESUMO - CULTURAS                              
# ================================================================================
# Total de culturas testadas: 10
# ✓ Sucessos: 10
# ✓ Todas as culturas passaram! ✓
```

#### Teste 4: Executar Todos os Testes (58 testes)

```bash
python backend/test_planning_field_options.py --mode all

# Resultado esperado:
# - 48 combinações passando
# - 10 culturas passando
# - Total: 58 testes com sucesso
```

---

### ✅ Fase 3: Teste Manual na UI

#### Teste 1: Criar Talhão com "Moderado"

1. Abrir navegador em `http://localhost:3000/planejamento`

2. Clicar em "Adicionar Talhão Manualmente"

3. Preencher formulário:
   - **Nome:** Teste Moderado
   - **Área:** 10 ha
   - **Solo:** Argiloso
   - **Relevo:** **Moderado** ⭐
   - **Água:** Média
   - **UF:** SP
   - **Município:** São Paulo

4. Clicar em "Salvar"

5. **Resultado esperado:** ✅ Talhão criado com sucesso

#### Teste 2: Gerar Calendário para Talhão com "Moderado"

1. Na lista de talhões, encontrar "Teste Moderado"

2. Clicar em "Gerar Calendário"

3. Selecionar:
   - **Cultura:** Milho
   - **Data de Plantio:** (30 dias no futuro)

4. Clicar em "Gerar Calendário"

5. **Resultado esperado:** 
   - ✅ Calendário gerado com sucesso
   - ✅ Sem erro 400
   - ✅ Tarefas exibidas corretamente

#### Teste 3: Testar Todas as Opções de Relevo

Repetir Teste 1 e 2 para cada relevo:

- [x] **Plano** → ✅ Deve funcionar
- [x] **Suave** → ✅ Deve funcionar
- [x] **Moderado** → ✅ Deve funcionar (bug corrigido!)
- [x] **Íngreme** → ✅ Deve funcionar

#### Teste 4: Testar Todas as Culturas

Com um talhão criado, gerar calendário para cada cultura:

- [x] Soja
- [x] Milho
- [x] Feijão
- [x] Café
- [x] Cana
- [x] Arroz
- [x] Trigo
- [x] Sorgo
- [x] Mandioca
- [x] Algodão

**Resultado esperado:** ✅ Todas as 10 culturas devem gerar calendário sem erro

---

### ✅ Fase 4: Teste de Retrocompatibilidade

#### Cenário: Talhão Antigo com "leve" ou "medio"

Se você tem talhões antigos no sistema:

1. **Verificar dados antigos:**
   ```bash
   # Ver conteúdo do storage
   cat backend/data/user_fields/fields.json
   
   # Procurar por "leve" ou "medio"
   ```

2. **Gerar calendário para talhão antigo:**
   - Abrir UI
   - Selecionar talhão antigo
   - Gerar calendário
   - **Resultado esperado:** ✅ Funciona sem erro (normalização automática)

3. **Editar talhão antigo:**
   - Editar qualquer campo
   - Salvar
   - **Resultado esperado:** ✅ Valor de relevo é normalizado automaticamente

---

### ✅ Fase 5: Verificar Versões

#### Backend Local

```bash
curl http://localhost:8000/debug/version | python -m json.tool

# Resultado esperado:
# {
#   "api_version": "5.0.0",
#   "backend_template_version": "1.0.41",
#   "features": [
#     ...
#     "planning_field_validation_fix"  ⭐
#   ]
# }
```

#### CLI

```bash
agroplan --version

# Resultado esperado:
# 1.0.41
```

#### NPM

```bash
npm view agroplan-ai-cli version

# Resultado esperado:
# 1.0.41
```

---

## 🐛 Troubleshooting

### Problema: Testes falhando com "Connection refused"

**Causa:** Backend não está rodando

**Solução:**
```bash
cd backend
python api.py
```

### Problema: Erro "ModuleNotFoundError"

**Causa:** Dependências não instaladas

**Solução:**
```bash
cd backend
pip install -r requirements.txt
```

### Problema: CLI não encontrada

**Causa:** CLI não instalada globalmente

**Solução:**
```bash
bun add -g agroplan-ai-cli@1.0.41
# ou
npm install -g agroplan-ai-cli@1.0.41
```

### Problema: Versão antiga da CLI

**Causa:** Cache do npm/bun

**Solução:**
```bash
# Desinstalar versão antiga
bun remove -g agroplan-ai-cli

# Limpar cache
npm cache clean --force

# Reinstalar versão nova
bun add -g agroplan-ai-cli@1.0.41
```

---

## 📊 Resultados Esperados

### Testes Automatizados

| Teste | Quantidade | Status Esperado |
|-------|-----------|-----------------|
| Combinações | 48 | ✅ 100% passando |
| Culturas | 10 | ✅ 100% passando |
| **Total** | **58** | ✅ **100% passando** |

### Testes Manuais

| Teste | Status Esperado |
|-------|-----------------|
| Criar talhão com "moderado" | ✅ Sucesso |
| Gerar calendário com "moderado" | ✅ Sucesso (sem erro 400) |
| Todas as opções de relevo | ✅ Funcionando |
| Todas as 10 culturas | ✅ Funcionando |
| Retrocompatibilidade | ✅ Funcionando |

---

## ✅ Checklist Final

Após executar todos os testes, verificar:

- [ ] Backend iniciando sem erros
- [ ] Testes automatizados: 48/48 combinações passando
- [ ] Testes automatizados: 10/10 culturas passando
- [ ] UI: Criar talhão com "moderado" funciona
- [ ] UI: Gerar calendário com "moderado" funciona
- [ ] UI: Todas as opções de relevo funcionam
- [ ] UI: Todas as 10 culturas funcionam
- [ ] Retrocompatibilidade: Talhões antigos funcionam
- [ ] Versão backend: 1.0.41 (debug/version)
- [ ] Versão CLI: 1.0.41 (agroplan --version)
- [ ] Feature "planning_field_validation_fix" presente

---

## 🎉 Conclusão

Se todos os testes passarem:

✅ **Bug do "moderado" está corrigido!**  
✅ **Sistema está robusto e retrocompatível!**  
✅ **Pronto para produção!**

---

## 📞 Suporte

### Documentação Completa
- `FASE_FINAL_VALIDACAO_PLANEJAMENTO.md` - Documentação técnica detalhada
- `RESUMO_FASE_FINAL.md` - Resumo executivo
- `INSTRUCOES_TESTE.md` - Este arquivo

### Contato
- GitHub: https://github.com/Kuuhaku-Allan/agroplan-ai
- Issues: https://github.com/Kuuhaku-Allan/agroplan-ai/issues

---

**Última atualização:** 17 de maio de 2026  
**Versão do documento:** 1.0
