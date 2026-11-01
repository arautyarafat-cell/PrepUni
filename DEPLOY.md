# 🚀 Guia de Deploy: Frontend na Vercel & Backend no Render

Este guia passo a passo explica como colocar a plataforma **PrepUni** em produção com o **Backend no Render** e o **Frontend na Vercel**.

---

## 📋 Sumário dos Componentes

- **Backend (API Express + PostgreSQL)**: Hospedado no [Render](https://render.com)
- **Frontend (React SPA)**: Hospedado na [Vercel](https://vercel.com)
- **Banco de Dados**: PostgreSQL (Pode ser criado no próprio Render, Neon, Supabase ou Railway)

---

## 🗄️ PARTE 1: Backend no Render

### 1.1 Criar o Banco de Dados PostgreSQL no Render (ou Neon/Supabase)
1. Acesse o [Render Dashboard](https://dashboard.render.com).
2. Clique em **New +** > **PostgreSQL**.
3. Preencha:
   - **Name**: `prepuni-db`
   - **Database**: `prepUni_db`
   - **User**: `postgres`
   - **Plan**: `Free`
4. Clique em **Create Database**.
5. Quando o banco estiver pronto, copie a **Internal Database URL** (se o backend for rodar no Render) ou a **External Database URL**.

---

### 1.2 Criar o Web Service do Backend no Render
1. No [Render Dashboard](https://dashboard.render.com), clique em **New +** > **Web Service**.
2. Conecte o repositório GitHub do seu projeto.
3. Preencha as configurações:
   - **Name**: `prepuni-backend`
   - **Region**: Escolha a mesma região do banco (ex: *Frankfurt* ou *Ohio*)
   - **Root Directory**: `Quizunda-main` *(se o repositório tiver a pasta Quizunda-main)*
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/backend/server.js`
   - **Health Check Path**: `/health`

4. Em **Environment Variables** (Variáveis de Ambiente), adicione:
   | Chave | Valor | Observação |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Modo de produção |
   | `PORT` | `10000` | Porta padrão do Render |
   | `DATABASE_URL` | *Sua connection string do PostgreSQL* | Ex: `postgresql://postgres:...@dpg-...-a.render.com/prepUni_db` |
   | `DB_SSL` | `true` | Habilita SSL para a nuvem |
   | `JWT_SECRET` | *Uma chave secreta longa e segura* | Ex: `b8f9e2a14589d8123...` |
   | `CORS_ORIGIN` | `*` *(ou a URL da Vercel depois de criar)* | Ex: `https://meu-app.vercel.app` |

5. Clique em **Create Web Service**.
6. Guarde a URL gerada pelo Render (exemplo: `https://prepuni-backend.onrender.com`).
   - Teste no navegador acessando: `https://prepuni-backend.onrender.com/health` (deve retornar `{"status":"ok"}`).

---

### 1.3 Inicializar as Tabelas no Banco de Dados
Você pode rodar as migrações de **duas formas**:

#### Opção A (Pelo Render Shell - Mais Rápido):
1. No painel do seu Web Service no Render, clique na aba **Shell**.
2. Execute o comando:
   ```bash
   npm run db:init
   ```
   *(Este comando executa a criação de tabelas, o schema LMS e a inserção do usuário admin automaticamente).*

#### Opção B (Pelo seu computador local):
1. No arquivo `Quizunda-main/.env`, configure temporariamente a `DATABASE_URL` com a URL Externa do Render.
2. No seu terminal local, execute:
   ```bash
   npm run db:init
   ```

---

## ⚡ PARTE 2: Frontend na Vercel

### 2.1 Importar o Projeto na Vercel
1. Acesse o [Vercel Dashboard](https://vercel.com/dashboard).
2. Clique em **Add New...** > **Project**.
3. Importe o repositório GitHub do projeto.

### 2.2 Configurar o Projeto na Vercel
1. Na tela **Configure Project**:
   - **Framework Preset**: Selecione `Create React App`.
   - **Root Directory**: Clique em `Edit` e selecione `Quizunda-main`.
   - **Build Command**: Deixe o padrão (`npm run build`).
   - **Output Directory**: Deixe o padrão (`build`).

2. Na seção **Environment Variables**, adicione:
   | Chave | Valor |
   | :--- | :--- |
   | `REACT_APP_API_URL` | `https://prepuni-backend.onrender.com/api` |
   | `CI` | `false` |

   *(Substitua `prepuni-backend.onrender.com` pela URL real do seu serviço Render gerada na Parte 1).*

3. Clique em **Deploy**.

---

## 🔒 PARTE 3: Conexão Final & Segurança CORS

1. Após o deploy na Vercel, você terá o domínio final (ex: `https://prepuni.vercel.app`).
2. Volte ao **Render Dashboard** > **Web Service** > **Environment**.
3. Atualize a variável `CORS_ORIGIN`:
   ```env
   CORS_ORIGIN=https://prepuni.vercel.app
   ```
4. O Render fará o deploy automático da nova configuração.

---

## ✅ Resumo dos Arquivos Preparados

- [`vercel.json`](file:///d:/prep%20plataforma/Quizunda-main/vercel.json): Configuração de rotas SPA (Single Page Application) para evitar erros 404 ao atualizar a página.
- [`render.yaml`](file:///d:/prep%20plataforma/render.yaml): Blueprint declarativo para o Render.
- [`Quizunda-main/src/backend/server.js`](file:///d:/prep%20plataforma/Quizunda-main/src/backend/server.js): CORS configurado para Vercel, `/health` endpoint para o Render e cabeçalhos adequados para uploads.
- [`Quizunda-main/scripts/init_database.js`](file:///d:/prep%20plataforma/Quizunda-main/scripts/init_database.js): Comando unificado `npm run db:init` para preparar todas as tabelas e dados iniciais.

