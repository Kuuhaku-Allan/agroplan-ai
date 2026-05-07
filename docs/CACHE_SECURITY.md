# Segurança do Cache - Endpoint /cache/limpar

## Implementação

O endpoint `/cache/limpar` foi protegido com autenticação por token para evitar que usuários não autorizados limpem o cache em produção.

## Como Funciona

### Desenvolvimento (Sem Token)
```bash
# Sem CACHE_ADMIN_TOKEN configurado
POST /cache/limpar
# ✅ Funciona normalmente (modo desenvolvimento)
```

### Produção (Com Token)
```bash
# Com CACHE_ADMIN_TOKEN configurado no ambiente
POST /cache/limpar
# ❌ HTTP 403 - Token de administração inválido ou ausente

POST /cache/limpar
X-Cache-Token: seu-token-secreto
# ✅ HTTP 200 - Cache limpo com sucesso
```

## Configuração

### 1. Variável de Ambiente
```env
# .env ou configuração do Render
CACHE_ADMIN_TOKEN=seu-token-secreto-aqui
```

### 2. Header Obrigatório
```
X-Cache-Token: seu-token-secreto-aqui
```

## Exemplos de Uso

### cURL
```bash
# Produção - com token
curl -X POST https://agroplan-ai-api.onrender.com/cache/limpar \
  -H "X-Cache-Token: seu-token-secreto"

# Desenvolvimento - sem token
curl -X POST http://localhost:8000/cache/limpar
```

### PowerShell
```powershell
# Com token
$headers = @{"X-Cache-Token" = "seu-token-secreto"}
Invoke-WebRequest -Uri "https://agroplan-ai-api.onrender.com/cache/limpar" -Method POST -Headers $headers

# Sem token (desenvolvimento)
Invoke-WebRequest -Uri "http://localhost:8000/cache/limpar" -Method POST
```

### JavaScript/Frontend
```javascript
// Com token (não recomendado no frontend - use backend)
fetch('/cache/limpar', {
  method: 'POST',
  headers: {
    'X-Cache-Token': 'seu-token-secreto'
  }
})

// Melhor: criar endpoint administrativo no backend
```

## Respostas

### Sucesso (200)
```json
{
  "status": "ok",
  "message": "Cache limpo. 5 itens removidos.",
  "protected": true
}
```

### Erro - Token Ausente/Inválido (403)
```json
{
  "detail": "Token de administração inválido ou ausente. Use header X-Cache-Token."
}
```

## Segurança

### ✅ Implementado
- Token obrigatório em produção
- Header X-Cache-Token validado
- HTTP 403 para acesso não autorizado
- Modo desenvolvimento sem proteção

### 🔒 Recomendações
- Use token forte (32+ caracteres aleatórios)
- Mantenha token secreto (não commite no código)
- Configure apenas no ambiente de produção
- Considere rotação periódica do token

### ⚠️ Importante
- Não exponha o token no frontend
- Use HTTPS em produção
- Monitore logs de acesso ao endpoint
- Token é opcional (desenvolvimento funciona sem)

## Deploy no Render

1. Vá em **Environment Variables**
2. Adicione: `CACHE_ADMIN_TOKEN` = `seu-token-secreto`
3. Redeploy automático
4. Teste: endpoint agora requer header

## Testando

```bash
# 1. Teste sem token (deve funcionar em dev)
curl -X POST http://localhost:8000/cache/limpar

# 2. Configure token no Render
# CACHE_ADMIN_TOKEN=abc123xyz789

# 3. Teste sem header (deve falhar)
curl -X POST https://agroplan-ai-api.onrender.com/cache/limpar
# Esperado: HTTP 403

# 4. Teste com header (deve funcionar)
curl -X POST https://agroplan-ai-api.onrender.com/cache/limpar \
  -H "X-Cache-Token: abc123xyz789"
# Esperado: HTTP 200
```