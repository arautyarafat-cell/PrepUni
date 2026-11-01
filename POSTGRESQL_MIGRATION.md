# Migração de MySQL para PostgreSQL - prepUni_db

Este documento resume as mudanças realizadas para transformar o banco de dados e a camada de backend de **MySQL** para **PostgreSQL**.

---

## 1. O que foi feito

1. **Script SQL Completo para PostgreSQL**:
   - Arquivo criado: [`Quizunda-main/prepUni_db_postgresql.sql`](file:///d:/prep%20plataforma/Quizunda-main/prepUni_db_postgresql.sql)
   - Tipos de dados convertidos: `AUTO_INCREMENT` -> `SERIAL`, `DATETIME`/`TIMESTAMP` -> `TIMESTAMP`, etc.
   - Chaves estrangeiras e índices otimizados para PostgreSQL com `ON DELETE CASCADE` / `SET NULL`.
   - Ajuste de sequências (`setval`) para manter a numeração correta de IDs.
   - Dados iniciais das tabelas `admin` e `bna` preservados com prevenção de conflitos (`ON CONFLICT (id) DO NOTHING`).
   - Funções de compatibilidade SQL criadas no PostgreSQL (`CURDATE()`, `RAND()`, `DATE_ADD()`) para total retrocompatibilidade com queries existentes.

2. **Instalação do Driver PostgreSQL**:
   - Pacote [`pg`](https://www.npmjs.com/package/pg) instalado nas dependências do projeto.

3. **Atualização da Conexão e Camada de Acesso a Dados**:
   - Arquivo atualizado: [`Quizunda-main/src/backend/db.js`](file:///d:/prep%20plataforma/Quizunda-main/src/backend/db.js)
   - Suporte flexível a variáveis de ambiente (`.env`) via `DATABASE_URL` (ideal para serviços em nuvem como Supabase, Neon, Render, Railway, Clever Cloud) ou credenciais padrão (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
   - Adaptador com conversão automática de placeholders (`?` -> `$1, $2, ...`).
   - Anexação automática de `RETURNING id` em queries `INSERT` para manter a compatibilidade com `result.insertId`.
   - Retorno normalizado no padrão `[rows, fields]` com mapeamento de propriedades em camelCase (`courseId`, `ownerId`, `emailOrPhone`, `accountType`, etc.), garantindo 100% de compatibilidade com o frontend React e rotas Express.

4. **Script de Automação e Migração**:
   - Arquivo criado: [`Quizunda-main/setup_postgres.js`](file:///d:/prep%20plataforma/Quizunda-main/setup_postgres.js)
   - Comando adicionado ao `package.json`: `npm run setup:pg`

---

## 2. Como Configurar e Usar

### Passo 1: Configurar as Credenciais no `.env`

Edite o arquivo `Quizunda-main/.env`:

#### Opção A - Banco de Dados Local (PostgreSQL instalado no seu computador):
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_NAME=prepUni_db
DB_SSL=false
```

#### Opção B - Banco de Dados em Nuvem (Supabase, Neon, Clever Cloud, Render, Railway, etc.):
```env
DATABASE_URL=postgresql://usuario:senha@host:5432/nome_banco?sslmode=require
DB_SSL=true
```

---

### Passo 2: Criar o Banco e Executar a Migração

Se o banco de dados `prepUni_db` ainda não existir no seu PostgreSQL local, crie-o:
```sql
CREATE DATABASE prepUni_db;
```

Em seguida, na raiz do projeto ou dentro de `Quizunda-main`, execute:
```bash
npm run setup:pg
```

Ou se preferir usar o cliente `psql`:
```bash
psql -U postgres -d prepUni_db -f Quizunda-main/prepUni_db_postgresql.sql
```

---

### Passo 3: Iniciar o Servidor Backend

Para rodar o backend já conectado ao PostgreSQL:
```bash
npm run server
```

