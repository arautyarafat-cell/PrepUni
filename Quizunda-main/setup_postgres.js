const fs = require('fs');
const path = require('path');
const { Pool, Client } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const host = process.env.PGHOST || process.env.DB_HOST || 'localhost';
const user = process.env.PGUSER || process.env.DB_USER || 'postgres';
const password = process.env.PGPASSWORD || process.env.DB_PASSWORD || '';
const database = process.env.PGDATABASE || process.env.DB_NAME || 'prepUni_db';
const port = parseInt(process.env.PGPORT || process.env.DB_PORT || '5432', 10);
const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;

async function ensureDatabaseExists() {
  if (process.env.DATABASE_URL) return; // Se for URL remota direta, pula criação

  const rootClient = new Client({
    host,
    user,
    password,
    port,
    database: 'postgres',
    ssl
  });

  try {
    await rootClient.connect();
    const checkDb = await rootClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
    if (checkDb.rows.length === 0) {
      console.log(`📦 Criando banco de dados "${database}" no PostgreSQL...`);
      await rootClient.query(`CREATE DATABASE "${database}"`);
      console.log(`✅ Banco de dados "${database}" criado com sucesso!`);
    } else {
      console.log(`ℹ️  Banco de dados "${database}" já existe.`);
    }
  } catch (err) {
    console.warn(`⚠️ Não foi possível verificar/criar o banco no catálogo padrão: ${err.message}`);
  } finally {
    await rootClient.end().catch(() => {});
  }
}

async function setupPostgres() {
  console.log('🔄 Iniciando configuração do PostgreSQL...');
  await ensureDatabaseExists();

  const connectionConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false
      }
    : {
        host,
        user,
        password,
        database,
        port,
        ssl
      };

  const pool = new Pool(connectionConfig);

  try {
    const client = await pool.connect();
    console.log(`📡 Conectado ao banco "${database}" com sucesso!`);

    const sqlPath = path.join(__dirname, 'prepUni_db_postgresql.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Arquivo SQL não encontrado em: ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('📄 Executando script prepUni_db_postgresql.sql...');

    await client.query(sqlContent);
    console.log('✅ Todas as tabelas, funções, índices e dados iniciais foram criados com sucesso!');

    // Listar tabelas criadas
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n📊 Tabelas disponíveis no banco PostgreSQL:');
    res.rows.forEach(r => console.log(`  - ${r.table_name}`));

    client.release();
  } catch (err) {
    console.error('\n❌ Erro durante a execução:');
    console.error(err.message);
  } finally {
    await pool.end();
  }
}

setupPostgres();
