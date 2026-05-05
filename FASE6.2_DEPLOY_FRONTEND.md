# ⚡ Fase 6.2 - Deploy do Frontend na Vercel

## Pré-requisito

✅ Backend deployado no Render e funcionando  
✅ URL do backend copiada: `https://agroplan-backend-xxxx.onrender.com`

---

## Instruções Passo a Passo

### 1. Acesse a Vercel

Vá para: https://vercel.com/dashboard

Se não tiver conta, crie uma (pode usar GitHub para login).

---

### 2. Importar Projeto

1. Clique em **"Add New..."** (canto superior direito)
2. Selecione **"Project"**
3. Na lista de repositórios, procure por **"agroplan-ai"**
4. Clique em **"Import"**

---

### 3. Configurar o Projeto

#### Configurações Básicas

- **Project Name**: `agroplan-frontend` (ou nome de sua escolha)
- **Framework Preset**: `Next.js` (detectado automaticamente)
- **Root Directory**: `frontend`

#### Build Settings

A Vercel detecta automaticamente:
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

**Não precisa alterar nada aqui!**

---

### 4. Variáveis de Ambiente

Na seção **"Environment Variables"**, adicione:

**Variável**:
- **Key**: `NEXT_PUBLIC_API_URL`
- **Value**: `https://agroplan-backend-xxxx.onrender.com`

⚠️ **IMPORTANTE**: 
- Substitua `xxxx` pela URL real do seu backend Render
- **SEM barra no final**: ✅ `.onrender.com` ❌ `.onrender.com/`

---

### 5. Deploy

1. Clique em **"Deploy"** (no final da página)
2. Aguarde o build e deploy (2-5 minutos)
3. Você verá logs em tempo real

**Logs esperados**:
```
Installing dependencies...
npm install

Building...
npm run build

Route (app)
├ ○ /
├ ○ /dashboard
├ ○ /talhoes
├ ○ /genetico
├ ○ /validacao
├ ○ /cenarios
└ ○ /relatorios

✓ Compiled successfully
```

---

### 6. Copiar URL do Frontend

Após o deploy concluir, você verá:

```
🎉 Your project has been deployed!

https://agroplan-frontend.vercel.app
```

**Copie essa URL!** Você precisará dela para atualizar o CORS.

---

### 7. Testar o Frontend

Abra no navegador:

```
https://agroplan-frontend.vercel.app
```

**Verificações iniciais**:
- ✅ Página carrega
- ✅ Sidebar aparece
- ⚠️ Topbar pode mostrar "Conectando..." ou "API Offline"

**Isso é normal!** Você ainda precisa atualizar o CORS no backend.

---

### 8. Atualizar CORS no Backend

Agora que você tem a URL do frontend, precisa atualizar o CORS:

1. Volte ao [Render Dashboard](https://dashboard.render.com)
2. Clique no seu Web Service `agroplan-backend`
3. Vá em **"Environment"** (menu lateral)
4. Encontre a variável `CORS_ORIGINS`
5. Clique em **"Edit"**
6. Atualize o valor para:
   ```
   https://agroplan-frontend.vercel.app,http://localhost:3000
   ```
   ⚠️ **Substitua** `agroplan-frontend.vercel.app` pela sua URL real
7. Clique em **"Save Changes"**
8. O Render fará **redeploy automático** (aguarde 2-3 minutos)

---

### 9. Teste Final

Após o redeploy do backend, recarregue o frontend:

```
https://agroplan-frontend.vercel.app
```

**Verificações**:
- ✅ Topbar mostra **"API Conectada"**
- ✅ Badges mostram **"10 culturas"** e **"10 talhões"**
- ✅ Dashboard carrega com dados
- ✅ Gráficos renderizam

---

### 10. Testar Todas as Páginas

Navegue e teste:

- ✅ `/dashboard` - Visão geral
- ✅ `/talhoes` - Lista de talhões
- ✅ `/genetico` - Algoritmo Genético
- ✅ `/validacao` - Validação
- ✅ `/cenarios` - Comparação de cenários
- ✅ `/relatorios` - Geração de relatórios

**Todas devem funcionar!**

---

## 🐛 Troubleshooting

### Build falha com "Module not found"

**Causa**: Dependências não instaladas

**Solução**:
1. Verifique se `package.json` está correto
2. Vá em **Settings** → **General** → **Redeploy**

### "API Offline" ou "Conectando..." infinito

**Causa**: CORS não atualizado ou backend dormindo

**Soluções**:
1. Verifique se `CORS_ORIGINS` no Render inclui a URL do Vercel
2. Aguarde 30-60s (backend pode estar acordando)
3. Abra o console do navegador (F12) e veja o erro
4. Teste o backend diretamente: `https://seu-backend.onrender.com/health`

### Erro "Failed to fetch" no console

**Causa**: URL do backend incorreta ou CORS

**Soluções**:
1. Vá em **Settings** → **Environment Variables**
2. Verifique se `NEXT_PUBLIC_API_URL` está correto
3. Sem barra no final: ✅ `.onrender.com` ❌ `.onrender.com/`
4. Redeploy: **Deployments** → **...** → **Redeploy**

### Página 404 ao acessar rotas

**Causa**: Build incorreto ou root directory errado

**Solução**:
1. Vá em **Settings** → **General**
2. Verifique se **Root Directory** é `frontend`
3. Redeploy

---

## 🔄 Atualizações Futuras

### Deploy Automático

A Vercel faz deploy automático quando você faz push para `main`:

```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

A Vercel detecta o push e faz deploy automaticamente!

### Rollback

Se algo der errado:

1. Vá em **Deployments**
2. Encontre o deploy anterior que funcionava
3. Clique nos **três pontos** (...)
4. Selecione **"Promote to Production"**

---

## 📊 Informações do Plano Hobby

### Recursos Gratuitos

- **100 GB bandwidth/mês**
- **Builds ilimitados**
- **Sempre ativo** (não dorme)
- **HTTPS automático**
- **Domínio personalizado gratuito**

### Sem Limitações de Uptime

Diferente do backend (Render), o frontend Vercel:
- ✅ Está sempre ativo
- ✅ Não dorme
- ✅ Responde instantaneamente

---

## 🌐 Domínio Personalizado (Opcional)

Se quiser usar seu próprio domínio:

1. Compre um domínio (Namecheap, GoDaddy, etc.)
2. Na Vercel, vá em **Settings** → **Domains**
3. Clique em **"Add"**
4. Digite seu domínio
5. Configure DNS conforme instruções
6. Aguarde propagação (pode levar até 48h)

---

## 📝 Checklist

- [ ] Conta criada na Vercel
- [ ] Projeto importado do GitHub
- [ ] Root Directory: `frontend`
- [ ] Framework: Next.js
- [ ] `NEXT_PUBLIC_API_URL` configurado
- [ ] Deploy concluído
- [ ] URL copiada
- [ ] CORS atualizado no Render
- [ ] Topbar mostra "API Conectada"
- [ ] Todas as páginas testadas e funcionando

---

## 🎯 URLs Finais

Anote aqui suas URLs:

**Backend (Render)**:
```
https://agroplan-backend-xxxx.onrender.com
```

**Frontend (Vercel)**:
```
https://agroplan-frontend.vercel.app
```

---

## 🎉 Parabéns!

Seu AgroPlan AI está no ar! 🚀

Compartilhe a URL do frontend com outras pessoas para testar.

---

**Status**: Aguardando deploy manual na Vercel

**Próximo**: Após tudo funcionando, considerar Fase 7 (APIs Reais)
