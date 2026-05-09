# Fase 8.5 - Backend Version Diagnostics (Diagnóstico de Versão do Backend)

**Data:** 09/05/2026  
**Status:** ✅ Concluído  
**Commit:** `088248f` - fix: add local backend version diagnostics and reliable update  
**Versão CLI:** 1.0.21

---

## 📋 Problema Identificado

Após implementar detecção de versão da CLI (Fase 8.4), descobrimos que a **API Local** ainda mostrava cobertura ZARC diferente da Render:

- **Render API:** Cobertura ZARC 10/10 ✅
- **API Local:** Cobertura ZARC 4/10 (Dashboard) e 6/10 (Talhões) ❌

### Causa Raiz

A CLI sabia sua própria versão, mas **não verificava qual backend-template foi realmente copiado** para `C:\Users\Defal\.agroplan\backend`.

Possíveis causas:
1. Processo Python antigo ainda rodando na porta 8000
2. Backend local não foi removido/copiado completamente
3. CLI nova instalada, mas backend-template local ainda antigo
4. Cache em memória do Python com código antigo

**Sem diagnóstico do backend**, era impossível saber se o problema era:
- Índice ZARC antigo
- Fallbacks faltando (sorgo/mandioca)
- Normalização de solo ausente
- Arquivo zarc_provider.py desatualizado

---

## 🎯 Solução Implementada

### 1. VERSION.json - Manifesto do Backend

Criado arquivo que viaja com o backend-template:

**Arquivo:** `backend/VERSION.json` e `tools/agroplan-cli/backend-template/VERSION.json`

```json
{
  "cli_version": "1.0.21",
  "backend_template_version": "1.0.21",
  "zarc_index_version": "2025-2026-fast-index-v2",
  "features": [
    "zarc_fast_index",
    "zarc_fallback_sorgo_mandioca",
    "soil_normalization_misto_siltoso",
    "climate_real_data",
    "hybrid_mode"
  ],
  "generated_at": "2026-05-09T18:30:00Z"
}
```

**Propósito:**
- Rastrear versão do backend-template
- Listar features ativas
- Identificar versão do índice ZARC
- Permitir diagnóstico preciso

---

### 2. Endpoint /debug/version

Novo endpoint que retorna diagnóstico completo do backend:

**Arquivo:** `backend/api.py`

```python
@app.get("/debug/version")
def debug_version():
    """Retorna informações detalhadas de versão e configuração do backend"""
    try:
        import json
        from providers.zarc_provider import (
            ZARC_FAST_INDEX_ENABLED,
            ZARC_ALLOW_FULL_SCAN,
            load_zarc_index,
            get_zarc_fallback
        )
        
        # Carregar VERSION.json
        version_info = {}
        version_path = os.path.join(os.path.dirname(__file__), "VERSION.json")
        if os.path.exists(version_path):
            with open(version_path, 'r') as f:
                version_info = json.load(f)
        
        # Verificar índice ZARC
        zarc_index = load_zarc_index()
        zarc_index_info = {}
        if zarc_index:
            zarc_index_info = {
                "exists": True,
                "total_records": len(zarc_index.get("records", {})),
                "generated_at": zarc_index.get("generated_at"),
                "source": zarc_index.get("source")
            }
        else:
            zarc_index_info = {"exists": False}
        
        # Verificar fallbacks
        fallback_data = get_zarc_fallback()
        culturas_fallback = set(item.get("cultura") for item in fallback_data)
        
        return {
            "api_version": "5.0.0",
            "backend_file": __file__,
            "backend_template_version": version_info.get("backend_template_version", "unknown"),
            "cli_version": version_info.get("cli_version", "unknown"),
            "zarc_index_version": version_info.get("zarc_index_version", "unknown"),
            "features": version_info.get("features", []),
            "generated_at": version_info.get("generated_at"),
            "zarc_config": {
                "fast_index_enabled": ZARC_FAST_INDEX_ENABLED,
                "allow_full_scan": ZARC_ALLOW_FULL_SCAN,
                "index": zarc_index_info
            },
            "zarc_fallback": {
                "total_records": len(fallback_data),
                "culturas": sorted(list(culturas_fallback)),
                "has_sorgo": "sorgo" in culturas_fallback,
                "has_mandioca": "mandioca" in culturas_fallback
            },
            "data_mode": DATA_MODE,
            "weather_provider": WEATHER_PROVIDER
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Retorna:**
```json
{
  "api_version": "5.0.0",
  "backend_template_version": "1.0.21",
  "cli_version": "1.0.21",
  "zarc_index_version": "2025-2026-fast-index-v2",
  "features": [
    "zarc_fast_index",
    "zarc_fallback_sorgo_mandioca",
    "soil_normalization_misto_siltoso",
    "climate_real_data",
    "hybrid_mode"
  ],
  "zarc_config": {
    "fast_index_enabled": true,
    "allow_full_scan": false,
    "index": {
      "exists": true,
      "total_records": 52,
      "generated_at": "2026-05-05T10:00:00Z"
    }
  },
  "zarc_fallback": {
    "total_records": 12,
    "culturas": ["cafe", "cana", "feijao", "mandioca", "milho", "soja", "sorgo"],
    "has_sorgo": true,
    "has_mandioca": true
  }
}
```

---

### 3. Endpoint /health Melhorado

Adicionado informações de versão no health check:

**Arquivo:** `backend/api.py`

```python
@app.get("/health")
def health():
    """Verifica saúde da API"""
    try:
        # ... código existente ...
        
        # Carregar VERSION.json se existir
        version_info = {}
        version_path = os.path.join(os.path.dirname(__file__), "VERSION.json")
        if os.path.exists(version_path):
            import json
            with open(version_path, 'r') as f:
                version_info = json.load(f)
        
        response = {
            "status": "healthy",
            # ... campos existentes ...
        }
        
        # Adicionar info de versão se disponível
        if version_info:
            response["backend_template_version"] = version_info.get("backend_template_version")
            response["zarc_index_version"] = version_info.get("zarc_index_version")
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

### 4. Comando `agroplan doctor` Melhorado

Agora mostra versão do backend local:

**Arquivo:** `tools/agroplan-cli/src/commands/doctor.ts`

```typescript
// Verificar VERSION.json do backend local
try {
  const { getHomeAgroplanDir } = await import("../utils/paths");
  const homeDir = getHomeAgroplanDir();
  const versionPath = `${homeDir}/backend/VERSION.json`;
  const { existsSync, readFileSync } = await import("fs");
  
  if (existsSync(versionPath)) {
    const versionContent = readFileSync(versionPath, 'utf-8');
    const versionInfo = JSON.parse(versionContent);
    
    console.log(`   📦 Backend template: ${versionInfo.backend_template_version || 'unknown'}`);
    console.log(`   🗂️  ZARC index: ${versionInfo.zarc_index_version || 'unknown'}`);
    
    if (versionInfo.features && versionInfo.features.length > 0) {
      console.log(`   ✨ Features: ${versionInfo.features.slice(0, 3).join(', ')}...`);
    }
  } else {
    console.log("   ⚠️  VERSION.json não encontrado no backend local");
  }
} catch (error) {
  // Ignorar erro ao ler VERSION.json
}
```

**Output:**
```
🛠️ Setup Local:
   ✅ Setup concluído
   📦 Versão CLI: 1.0.21
   🐍 Python: Python 3.11.9
   📦 Backend template: 1.0.21
   🗂️  ZARC index: 2025-2026-fast-index-v2
   ✨ Features: zarc_fast_index, zarc_fallback_sorgo_mandioca, soil_normalization_misto_siltoso...
```

---

### 5. Comando `agroplan update` Melhorado

Agora remove backend antigo completamente e verifica instalação:

**Arquivo:** `tools/agroplan-cli/src/commands/update.ts`

```typescript
// Passo 1: Parar API
await serveOffCommand();

// Passo 2: Verificar porta 8000
const portInUse = await checkPort(8000);
if (portInUse) {
  console.log("\n⚠️  Porta 8000 ainda está ocupada por outro processo!");
  console.log("\n💡 Para identificar e encerrar o processo:");
  console.log("   netstat -ano | findstr :8000");
  console.log("   taskkill /PID <PID> /F");
  return;
}

// Passo 3: Remover backend antigo COMPLETAMENTE
const backendDir = join(homeDir, "backend");
if (existsSync(backendDir)) {
  rmSync(backendDir, { recursive: true, force: true });
  console.log("   ✅ Backend antigo removido");
}

// Passo 4: Reinstalar
await setupCommand(true, pythonPath);

// Passo 5: Verificar VERSION.json
const versionPath = join(homeDir, "backend", "VERSION.json");
if (existsSync(versionPath)) {
  const versionContent = readFileSync(versionPath, 'utf-8');
  const versionInfo = JSON.parse(versionContent);
  
  console.log(`   ✅ Backend template: ${versionInfo.backend_template_version}`);
  console.log(`   ✅ ZARC index: ${versionInfo.zarc_index_version}`);
  console.log(`   ✅ Features: ${versionInfo.features.length} ativas`);
}
```

**Output:**
```
🔄 Atualizando API local...

1️⃣ Parando API local...
2️⃣ Removendo backend antigo...
   ✅ Backend antigo removido
3️⃣ Instalando backend atualizado...
4️⃣ Verificando instalação...
   ✅ Backend template: 1.0.21
   ✅ ZARC index: 2025-2026-fast-index-v2
   ✅ Features: 5 ativas
5️⃣ Atualização concluída!

🔍 Para verificar a versão da API rodando:
   http://localhost:8000/debug/version
```

---

## 📊 Comparação Antes vs Depois

### Antes (v1.0.20)

```bash
# Atualizar CLI
bun add -g agroplan-ai-cli@latest

# Verificar
agroplan doctor
# 🛠️ Setup Local:
#    ✅ Setup concluído
#    📦 Versão: 1.0.20
#    🐍 Python: Python 3.11.9

# ❌ Não sabe qual backend está instalado
# ❌ Não sabe se ZARC index está atualizado
# ❌ Não sabe se fallbacks estão presentes
# ❌ Não sabe quais features estão ativas
```

**Problemas:**
- ❌ Cobertura ZARC diferente (Render 10/10, Local 4/10)
- ❌ Impossível diagnosticar causa raiz
- ❌ Não sabe se backend foi realmente atualizado
- ❌ Processo manual de verificação

---

### Depois (v1.0.21)

```bash
# Atualizar CLI
bun add -g agroplan-ai-cli@latest

# Atualizar backend
agroplan update
# 4️⃣ Verificando instalação...
#    ✅ Backend template: 1.0.21
#    ✅ ZARC index: 2025-2026-fast-index-v2
#    ✅ Features: 5 ativas

# Verificar
agroplan doctor
# 🛠️ Setup Local:
#    ✅ Setup concluído
#    📦 Versão CLI: 1.0.21
#    📦 Backend template: 1.0.21
#    🗂️  ZARC index: 2025-2026-fast-index-v2
#    ✨ Features: zarc_fast_index, zarc_fallback_sorgo_mandioca...

# Verificar API rodando
curl http://localhost:8000/debug/version
# {
#   "backend_template_version": "1.0.21",
#   "zarc_fallback": {
#     "has_sorgo": true,
#     "has_mandioca": true
#   }
# }
```

**Melhorias:**
- ✅ Cobertura ZARC sincronizada (Render 10/10, Local 10/10)
- ✅ Diagnóstico completo disponível
- ✅ Verifica backend foi realmente atualizado
- ✅ Processo automatizado com verificação

---

## 🧪 Testes Realizados

### 1. Correção Forte Imediata
```bash
# Parar API
agroplan serve off

# Verificar porta
netstat -ano | findstr :8000
# (vazio - porta livre)

# Remover backend antigo
rmdir /s /q "%USERPROFILE%\.agroplan\backend"

# Reinstalar
agroplan setup --force --python="C:\Python311\python.exe"

# Iniciar
agroplan serve on
```
✅ Passou

### 2. Endpoint /debug/version
```bash
curl http://localhost:8000/debug/version
```
**Resposta:**
```json
{
  "backend_template_version": "1.0.21",
  "zarc_index_version": "2025-2026-fast-index-v2",
  "features": [
    "zarc_fast_index",
    "zarc_fallback_sorgo_mandioca",
    "soil_normalization_misto_siltoso",
    "climate_real_data",
    "hybrid_mode"
  ],
  "zarc_fallback": {
    "has_sorgo": true,
    "has_mandioca": true
  }
}
```
✅ Passou

### 3. Comando `agroplan update`
```bash
agroplan update
# 4️⃣ Verificando instalação...
#    ✅ Backend template: 1.0.21
#    ✅ ZARC index: 2025-2026-fast-index-v2
#    ✅ Features: 5 ativas
```
✅ Passou

### 4. Comando `agroplan doctor`
```bash
agroplan doctor
# 🛠️ Setup Local:
#    📦 Versão CLI: 1.0.21
#    📦 Backend template: 1.0.21
#    🗂️  ZARC index: 2025-2026-fast-index-v2
#    ✨ Features: zarc_fast_index, zarc_fallback_sorgo_mandioca...
```
✅ Passou

### 5. Endpoint /health
```bash
curl http://localhost:8000/health
```
**Resposta:**
```json
{
  "status": "healthy",
  "backend_template_version": "1.0.21",
  "zarc_index_version": "2025-2026-fast-index-v2"
}
```
✅ Passou

---

## 📦 Arquivos Modificados

```
backend/
├── VERSION.json                                  # NOVO: Manifesto do backend
└── api.py                                        # /debug/version, /health melhorado

tools/agroplan-cli/
├── backend-template/
│   └── VERSION.json                              # NOVO: Copiado para instalação
├── package.json                                  # Versão 1.0.20 → 1.0.21
└── src/commands/
    ├── doctor.ts                                 # Mostra versão do backend
    └── update.ts                                 # Remove backend, verifica instalação
```

---

## 🎯 Benefícios

### Diagnóstico Preciso
- ✅ Sabe exatamente qual backend está instalado
- ✅ Sabe qual versão do índice ZARC
- ✅ Sabe quais features estão ativas
- ✅ Sabe se fallbacks estão presentes

### Atualização Confiável
- ✅ Remove backend antigo completamente
- ✅ Verifica porta 8000 antes de atualizar
- ✅ Confirma instalação após update
- ✅ Mostra features instaladas

### Troubleshooting Fácil
- ✅ Endpoint /debug/version para diagnóstico remoto
- ✅ `agroplan doctor` mostra tudo localmente
- ✅ Fácil comparar Render vs Local
- ✅ Identifica problemas rapidamente

---

## 🏆 Resultado Final

### API Render
```
GET /debug/version
{
  "backend_template_version": "1.0.21",
  "zarc_fallback": {
    "has_sorgo": true,
    "has_mandioca": true
  }
}

GET /dashboard?uf=SP&municipio=Clementina
{
  "zarc": {
    "culturas_com_zarc": 10,
    "total_culturas": 10
  }
}
```

### API Local
```
GET /debug/version
{
  "backend_template_version": "1.0.21",
  "zarc_fallback": {
    "has_sorgo": true,
    "has_mandioca": true
  }
}

GET /dashboard?uf=SP&municipio=Clementina
{
  "zarc": {
    "culturas_com_zarc": 10,
    "total_culturas": 10
  }
}
```

**✅ SINCRONIZADAS! Cobertura ZARC 10/10 em ambas!**

---

## ✅ Critérios de Sucesso

- [x] VERSION.json criado e copiado para backend-template
- [x] Endpoint /debug/version implementado
- [x] Endpoint /health melhorado com versão
- [x] `agroplan doctor` mostra versão do backend
- [x] `agroplan update` remove backend antigo completamente
- [x] `agroplan update` verifica porta 8000
- [x] `agroplan update` confirma instalação
- [x] Versão CLI bumped para 1.0.21
- [x] Publicado no npm com sucesso
- [x] Testado instalação e update
- [x] Cobertura ZARC sincronizada (10/10)
- [x] Commit e push realizados

---

## 🚀 Próximos Passos

O sistema agora está **100% rastreável e diagnosticável**:

1. ✅ CLI sabe sua versão
2. ✅ CLI sabe versão do backend instalado
3. ✅ Backend expõe sua versão via API
4. ✅ Fácil comparar Render vs Local
5. ✅ Update remove backend antigo completamente
6. ✅ Verificação automática após update

**Não há mais problemas de sincronização ou diagnóstico!**

---

**Commit:** `088248f`  
**Versão CLI:** 1.0.21  
**Status:** ✅ Concluído  
**Impacto:** Crítico - resolve inconsistência de cobertura ZARC
