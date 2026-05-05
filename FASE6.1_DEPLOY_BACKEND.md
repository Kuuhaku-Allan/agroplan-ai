# 🚀 Fase 6.1 - Deploy do Backend no Render

## Instruções Passo a Passo

### 1. Acesse o Render

Vá para: https://dashboard.render.com

Se não tiver conta, crie uma (pode usar GitHub para login).

---

### 2. Criar Web Service

1. Clique em **"New +"** (canto superior direito)
2. Selecione **"Web Service"**

---

### 3. Conectar Repositório

1. Se for a primeira vez, clique em **"Connect GitHub"**
2. Autorize o Render a acessar seus repositórios
3. Procure por **"agroplan-ai"**
4. Clique em **"Connect"**

---

### 4. Configurar o Service

#### Configurações Básicas

- **Name**: `agroplan-backend` (ou nome de sua escolha)
- **Region**: Escolha a região mais próxima (ex: Oregon, Ohio, Frankfurt)
- **Branch**: `main`
- **Root Directory**: `backend`

#### Build & Deploy

- **Runtime**: `Python 3` ⚠️ **IMPORTANTE: Não escolher Docker**
- **Build Command**: 
  ```
  pip install -r requirements.txt
  ```
- **Start Command**: 
  ```
  uvicorn api:app --host 0.0.0.0 --port $PORT
  ```

#### Instance Type

- Selecione **"Free"** (plano gratuito)

---

### 5. Variáveis de Ambiente

Na seção **"Environment Variables"**, adicione:

**Variável 1**:
- Key: `CORS_ORIGINS`
- Value: `http://localhost:3000`

**Variável 2**:
- Key: `DATA_MODE`
- Value: `simulated`

**Nota**: Você atualizará `CORS_ORIGINS` depois de fazer deploy do frontend.

---

### 6. Deploy

1. Clique em **"Create Web Service"** (no final da página)
2. Aguarde o build e deploy (pode levar 5-10 minutos)
3. Você verá logs em tempo real

**Logs esperados**:
```
==> Building...
Collecting fastapi
Collecting uvicorn
...
Successfully installed fastapi uvicorn pandas numpy

==> Starting service...
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:10000
```

---

### 7. Copiar URL do Backend

Após o deploy concluir, você verá a URL no topo da página:

```
https://agroplan-backend-xxxx.onrender.com
```

**Copie essa URL!** Você precisará dela para o frontend.

---

### 8. Testar o Backend

Abra no navegador:

```
https://agroplan-backend-xxxx.onrender.com/health
```

**Resposta esperada**:
```json
{
  "status": "healthy",
  "culturas": 10,
  "talhoes": 10,
  "regras": 10
}
```

Se aparecer isso, **backend está funcionando!** ✅

---

## 🐛 Troubleshooting

### Build falha com "No module named 'fastapi'"

**Causa**: Build command incorreto

**Solução**: 
1. Vá em **Settings** → **Build & Deploy**
2. Verifique se Build Command é: `pip install -r requirements.txt`
3. Salve e faça redeploy

### Erro "Application startup failed"

**Causa**: Start command incorreto ou PORT não configurado

**Solução**:
1. Vá em **Settings** → **Build & Deploy**
2. Verifique se Start Command é: `uvicorn api:app --host 0.0.0.0 --port $PORT`
3. Certifique-se de que `$PORT` está com cifrão
4. Salve e faça redeploy

### Erro 503 ou "Service Unavailable"

**Causa**: Serviço ainda está iniciando ou dormiu (plano gratuito)

**Solução**:
- Aguarde 30-60 segundos
- Recarregue a página
- Primeira requisição após dormir pode demorar

### CORS Error ao testar do frontend local

**Causa**: CORS_ORIGINS não inclui localhost

**Solução**:
1. Vá em **Environment**
2. Edite `CORS_ORIGINS` para: `http://localhost:3000,http://127.0.0.1:3000`
3. Salve (redeploy automático)

---

## 📊 Informações do Plano Gratuito

### Limitações

- **750 horas/mês** de uptime
- **512 MB RAM**
- **Dorme após 15 minutos** de inatividade
- **Acorda automaticamente** quando recebe requisição
- Primeira requisição após dormir: 30-60 segundos

### Comportamento Normal

- ✅ Backend dorme quando não está sendo usado
- ✅ Acorda quando você acessa
- ✅ Requisições subsequentes são rápidas
- ⚠️ Primeira requisição pode demorar

**Isso é esperado e normal no plano gratuito!**

---

## 🔄 Próximos Passos

Após o backend estar funcionando:

1. ✅ Backend deployado no Render
2. ✅ URL copiada
3. ✅ `/health` testado e funcionando
4. ⏭️ **Próximo**: Fase 6.2 - Deploy do Frontend na Vercel

---

## 📝 Checklist

- [ ] Conta criada no Render
- [ ] Repositório conectado
- [ ] Web Service criado
- [ ] Runtime: Python 3
- [ ] Build Command: `pip install -r requirements.txt`
- [ ] Start Command: `uvicorn api:app --host 0.0.0.0 --port $PORT`
- [ ] CORS_ORIGINS configurado
- [ ] DATA_MODE configurado
- [ ] Deploy concluído
- [ ] URL copiada
- [ ] `/health` testado e retorna JSON correto

---

## 🎯 URL do Backend

Anote aqui a URL do seu backend:

```
https://agroplan-backend-xxxx.onrender.com
```

Você precisará dela para configurar o frontend!

---

**Status**: Aguardando deploy manual no Render

**Próximo**: Após backend no ar, seguir para Fase 6.2 (Deploy Frontend)
