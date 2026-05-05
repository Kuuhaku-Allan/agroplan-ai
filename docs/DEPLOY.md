# 🚀 Guia de Deploy - AgroPlan AI

Este guia detalha como fazer o deploy do AgroPlan AI em plataformas gratuitas.

---

## 📋 Pré-requisitos

- Conta no [GitHub](https://github.com)
- Conta no [Render](https://render.com) (backend)
- Conta na [Vercel](https://vercel.com) (frontend)
- Repositório Git configurado

---

## 🔄 Preparação

### 1. Commit e Push para GitHub

```bash
# Adicione todos os arquivos
git add .

# Commit
git commit -m "chore: prepare project for deployment"

# Push para GitHub
git push origin main
```

### 2. Verifique os arquivos

Certifique-se de que os seguintes arquivos existem:

- ✅ `backend/.env.example`
- ✅ `backend/Dockerfile`
- ✅ `backend/requirements.txt`
- ✅ `frontend/.env.example`
- ✅ `.gitignore` (atualizado)

---

## 🐳 Deploy do Backend (Render)

### Passo 1: Criar Web Service

1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub
4. Selecione o repositório `agroplan-ai`

### Passo 2: Configurar o Service

**Configurações básicas**:
- **Name**: `agroplan-backend` (ou nome de sua escolha)
- **Region**: Escolha a região mais próxima
- **Branch**: `main`
- **Root Directory**: `backend`

**Build & Deploy** (Opção Recomendada - Python Runtime):
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn api:app --host 0.0.0.0 --port $PORT`

**Alternativa - Docker** (se preferir):
- **Runtime**: `Docker`
- **Build Command**: (deixe vazio, usa Dockerfile)
- **Start Command**: (deixe vazio, usa CMD do Dockerfile)

**💡 Recomendação**: Use **Python Runtime** para deploy mais simples e rápido. O Dockerfile está disponível caso precise, mas não é necessário para o deploy inicial.

### Passo 3: Configurar Variáveis de Ambiente

Na seção **Environment**, adicione:

```bash
# Obrigatório - será preenchido após deploy do frontend
CORS_ORIGINS=http://localhost:3000

# Opcional
HOST=0.0.0.0
DATA_MODE=simulated
```

**⚠️ Importante**: Você atualizará `CORS_ORIGINS` depois de fazer deploy do frontend.

### Passo 4: Plano Gratuito

- **Instance Type**: Selecione **"Free"**
- O plano gratuito pode dormir após 15 minutos de inatividade
- Acorda automaticamente quando recebe uma requisição

### Passo 5: Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o build e deploy (pode levar 5-10 minutos)
3. Após o deploy, copie a URL: `https://seu-backend.onrender.com`

### Passo 6: Testar o Backend

Acesse no navegador:
```
https://seu-backend.onrender.com/health
```

Deve retornar:
```json
{
  "status": "healthy",
  "culturas": 10,
  "talhoes": 10,
  "regras": 10
}
```

---

## ⚡ Deploy do Frontend (Vercel)

### Passo 1: Importar Projeto

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em **"Add New..."** → **"Project"**
3. Importe seu repositório GitHub `agroplan-ai`

### Passo 2: Configurar o Projeto

**Configurações básicas**:
- **Project Name**: `agroplan-frontend` (ou nome de sua escolha)
- **Framework Preset**: `Next.js` (detectado automaticamente)
- **Root Directory**: `frontend`

### Passo 3: Configurar Variáveis de Ambiente

Na seção **Environment Variables**, adicione:

```bash
NEXT_PUBLIC_API_URL=https://seu-backend.onrender.com
```

**⚠️ Substitua** `seu-backend.onrender.com` pela URL real do seu backend Render.

### Passo 4: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build e deploy (2-5 minutos)
3. Após o deploy, copie a URL: `https://seu-frontend.vercel.app`

### Passo 5: Testar o Frontend

Acesse no navegador:
```
https://seu-frontend.vercel.app
```

---

## 🔄 Atualizar CORS no Backend

Agora que você tem a URL do frontend, precisa atualizar o CORS no backend:

### Opção 1: Via Dashboard do Render

1. Acesse seu Web Service no Render
2. Vá em **Environment**
3. Edite a variável `CORS_ORIGINS`:
   ```bash
   CORS_ORIGINS=https://seu-frontend.vercel.app,http://localhost:3000
   ```
4. Clique em **"Save Changes"**
5. O Render fará redeploy automaticamente

### Opção 2: Via Código

1. Edite `backend/.env.example` (para documentação)
2. Commit e push:
   ```bash
   git add backend/.env.example
   git commit -m "docs: update CORS origins example"
   git push origin main
   ```
3. O Render fará redeploy automaticamente

---

## ✅ Verificação Final

### 1. Teste o Backend

```bash
curl https://seu-backend.onrender.com/health
```

Deve retornar status `healthy`.

### 2. Teste o Frontend

Acesse `https://seu-frontend.vercel.app` e verifique:

- ✅ Dashboard carrega
- ✅ Topbar mostra "API Conectada"
- ✅ Badges mostram "10 culturas" e "10 talhões"
- ✅ Gráficos renderizam
- ✅ Navegação entre páginas funciona

### 3. Teste Todas as Páginas

- ✅ `/dashboard` - Visão geral
- ✅ `/talhoes` - Lista de talhões
- ✅ `/genetico` - Algoritmo Genético
- ✅ `/validacao` - Validação
- ✅ `/cenarios` - Comparação de cenários
- ✅ `/relatorios` - Geração de relatórios

---

## 🐛 Troubleshooting

### Backend não inicia

**Erro**: Build falha no Render

**Solução**:
1. Verifique se `Dockerfile` está correto
2. Verifique se `requirements.txt` está completo
3. Veja os logs no Render Dashboard

### Frontend não conecta com Backend

**Erro**: "API Offline" ou "Conectando..." infinito

**Soluções**:
1. Verifique se `NEXT_PUBLIC_API_URL` está correto
2. Verifique se backend está rodando (acesse `/health`)
3. Verifique CORS no backend
4. Veja o console do navegador (F12)

### CORS Error

**Erro**: `Access-Control-Allow-Origin` no console

**Solução**:
1. Verifique `CORS_ORIGINS` no Render
2. Deve incluir a URL exata do Vercel
3. Sem barra no final: ✅ `https://app.vercel.app` ❌ `https://app.vercel.app/`

### Backend "dorme" muito

**Comportamento**: Primeira requisição demora muito

**Explicação**: 
- Plano gratuito do Render dorme após 15 min de inatividade
- Primeira requisição acorda o serviço (pode levar 30-60s)
- Requisições subsequentes são rápidas

**Soluções**:
- Aceitar o comportamento (é normal no plano gratuito)
- Upgrade para plano pago (sempre ativo)
- Usar serviço de "keep-alive" (ping periódico)

### Build do Frontend falha

**Erro**: Build error na Vercel

**Soluções**:
1. Teste o build localmente: `npm run build`
2. Verifique erros de TypeScript
3. Verifique se todas as dependências estão em `package.json`
4. Veja os logs detalhados na Vercel

---

## 🔄 Atualizações Futuras

### Deploy Automático

Ambas as plataformas fazem deploy automático quando você faz push para `main`:

```bash
# Faça suas alterações
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# Render e Vercel farão deploy automaticamente
```

### Rollback

**Vercel**:
1. Acesse o projeto na Vercel
2. Vá em **Deployments**
3. Clique nos três pontos do deploy anterior
4. Selecione **"Promote to Production"**

**Render**:
1. Acesse o Web Service no Render
2. Vá em **Events**
3. Clique em **"Rollback"** no deploy anterior

---

## 💰 Custos

### Plano Gratuito

**Render Free**:
- ✅ 750 horas/mês
- ✅ 512 MB RAM
- ✅ Dorme após 15 min de inatividade
- ✅ Acorda automaticamente
- ⚠️ Pode ser lento na primeira requisição

**Vercel Hobby**:
- ✅ 100 GB bandwidth/mês
- ✅ Builds ilimitados
- ✅ Sempre ativo
- ✅ HTTPS automático
- ✅ Domínio personalizado

### Upgrade (Opcional)

Se precisar de mais recursos:

**Render Starter** ($7/mês):
- Sempre ativo (não dorme)
- 512 MB RAM
- Melhor performance

**Vercel Pro** ($20/mês):
- 1 TB bandwidth
- Mais builds simultâneos
- Suporte prioritário

---

## 🌐 Domínio Personalizado

### Vercel

1. Compre um domínio (Namecheap, GoDaddy, etc.)
2. No Vercel, vá em **Settings** → **Domains**
3. Adicione seu domínio
4. Configure DNS conforme instruções

### Render

1. No Render, vá em **Settings** → **Custom Domain**
2. Adicione seu domínio
3. Configure DNS conforme instruções

---

## 📊 Monitoramento

### Logs do Backend (Render)

1. Acesse seu Web Service
2. Clique em **Logs**
3. Veja logs em tempo real

### Logs do Frontend (Vercel)

1. Acesse seu projeto
2. Clique em **Deployments**
3. Clique em um deploy
4. Veja **Build Logs** e **Function Logs**

### Analytics (Vercel)

Vercel oferece analytics gratuito:
1. Vá em **Analytics**
2. Veja visitantes, performance, etc.

---

## 🔒 Segurança

### Variáveis de Ambiente

- ✅ Nunca commite `.env` ou `.env.local`
- ✅ Use `.env.example` para documentação
- ✅ Configure variáveis nas plataformas

### CORS

- ✅ Configure CORS apenas para domínios específicos
- ❌ Não use `allow_origins=["*"]` em produção

### HTTPS

- ✅ Vercel e Render fornecem HTTPS automático
- ✅ Sempre use HTTPS em produção

---

## 📝 Checklist de Deploy

### Antes do Deploy

- [ ] Código commitado e pushed para GitHub
- [ ] `.env.example` criado e documentado
- [ ] `.gitignore` atualizado
- [ ] `Dockerfile` criado (backend)
- [ ] `requirements.txt` atualizado (backend)
- [ ] `package.json` atualizado (frontend)
- [ ] Build local funciona (`npm run build`)
- [ ] Backend local funciona (`python api.py`)

### Durante o Deploy

- [ ] Backend deployado no Render
- [ ] URL do backend copiada
- [ ] Frontend deployado na Vercel
- [ ] `NEXT_PUBLIC_API_URL` configurado
- [ ] URL do frontend copiada
- [ ] `CORS_ORIGINS` atualizado no backend

### Após o Deploy

- [ ] `/health` retorna status healthy
- [ ] Frontend carrega sem erros
- [ ] Topbar mostra "API Conectada"
- [ ] Todas as páginas funcionam
- [ ] Gráficos renderizam
- [ ] Relatórios são gerados
- [ ] Sem erros no console do navegador

---

## 🎉 Pronto!

Seu AgroPlan AI está no ar! 🚀

Compartilhe a URL do frontend com outras pessoas para testar.

---

## 📞 Suporte

- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs
- **Next.js**: https://nextjs.org/docs
- **FastAPI**: https://fastapi.tiangolo.com

---

**Última atualização**: Maio 2026
