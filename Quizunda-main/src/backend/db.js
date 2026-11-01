const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config(); // fallback se estiver rodando a partir de src/backend

// Configuração de conexão com suporte a DATABASE_URL ou parâmetros individuais
const connectionConfig = process.env.DATABASE_URL
  ? {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  }
  : {
    host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
    user: process.env.PGUSER || process.env.DB_USER || 'postgres',
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'postgres',
    database: process.env.PGDATABASE || process.env.DB_NAME || 'prepUni_db',
    port: parseInt(process.env.PGPORT || process.env.DB_PORT || '5432', 10),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  };

const pool = new Pool(connectionConfig);

// Prevenir encerramento do processo em caso de desconexão de clientes ociosos
pool.on('error', (err) => {
  console.error('⚠️ [PostgreSQL Pool] Erro em cliente ocioso (ignorado para reconexão):', err.message);
});

// Mapeamento de colunas em minúsculas para camelCase para total compatibilidade com o frontend e queries
const COLUMN_MAPPINGS = {
  courseid: 'courseId',
  ownerid: 'ownerId',
  createdat: 'createdAt',
  accounttype: 'accountType',
  emailorphone: 'emailOrPhone',
  roomid: 'roomId',
  roomname: 'roomName',
  correctanswer: 'correctAnswer',
  wronganswer1: 'wrongAnswer1',
  wronganswer2: 'wrongAnswer2',
  wronganswer3: 'wrongAnswer3',
  wronganswer4: 'wrongAnswer4',
  materialurl: 'materialUrl',
  urldrive: 'urlDrive',
  url_drive: 'url_drive',
  module_id: 'moduleId',
  course_id: 'courseId',
  user_id: 'userId',
  exam_id: 'examId',
  order_index: 'orderIndex',
  content_type: 'contentType',
  video_url: 'videoUrl',
  video_drive_url: 'videoDriveUrl',
  attachment_url: 'attachmentUrl',
  attachment_name: 'attachmentName',
  text_content: 'textContent',
  duration_minutes: 'durationMinutes',
  is_free_preview: 'isFreePreview',
  time_limit_minutes: 'timeLimitMinutes',
  passing_score: 'passingScore',
  workload_hours: 'workloadHours',
  data_compra: 'dataCompra',
  data_expiracao: 'dataExpiracao',
  issued_at: 'issuedAt',
  started_at: 'startedAt',
  completed_at: 'completedAt'
};

function normalizeRow(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
  for (const [lower, camel] of Object.entries(COLUMN_MAPPINGS)) {
    if (lower in row && !(camel in row)) {
      row[camel] = row[lower];
    }
  }
  return row;
}

// Converte sintaxe de queries MySQL para PostgreSQL (? -> $1, RAND() -> RANDOM(), etc.)
function convertSql(sql) {
  let paramIndex = 1;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let converted = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (char === "'" && !inDoubleQuote) {
      if (inSingleQuote && sql[i + 1] === "'") {
        converted += "''";
        i++;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      converted += char;
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      converted += char;
    } else if (char === '?' && !inSingleQuote && !inDoubleQuote) {
      converted += '$' + (paramIndex++);
    } else {
      converted += char;
    }
  }

  // Compatibilidade de funções MySQL -> PostgreSQL
  converted = converted.replace(/\bORDER\s+BY\s+RAND\(\)/gi, 'ORDER BY RANDOM()');
  converted = converted.replace(/\bCURDATE\(\)/gi, 'CURRENT_DATE');
  converted = converted.replace(
    /DATE_ADD\s*\(\s*(NOW\(\)|CURRENT_TIMESTAMP)\s*,\s*INTERVAL\s+1\s+YEAR\s*\)/gi,
    "($1 + INTERVAL '1 year')"
  );

  // Se for um INSERT INTO sem RETURNING, anexa RETURNING id para obter result.insertId
  const trimmed = converted.trim();
  const isInsert = /^INSERT\s+INTO\b/i.test(trimmed);
  const hasReturning = /\bRETURNING\b/i.test(trimmed);

  if (isInsert && !hasReturning) {
    converted = converted.replace(/;?\s*$/, ' RETURNING id;');
  }

  return { sql: converted, isInsert };
}

// Adaptador com interface idêntica ao mysql2/promise ([rows, fields])
const db = {
  rawPool: pool,

  async query(sqlText, params = []) {
    const { sql, isInsert } = convertSql(sqlText);
    const result = await pool.query(sql, params);

    const isSelect =
      Array.isArray(result.rows) &&
      !isInsert &&
      !/^\s*(UPDATE|DELETE|SET|DROP|CREATE|ALTER|BEGIN|COMMIT|ROLLBACK)\b/i.test(sqlText);

    if (isSelect) {
      const normalizedRows = result.rows.map(normalizeRow);
      return [normalizedRows, result.fields];
    }

    // Para INSERT / UPDATE / DELETE, retorna objeto com propriedades esperadas pelo código
    const header = {
      insertId: result.rows && result.rows[0] && result.rows[0].id ? result.rows[0].id : 0,
      affectedRows: result.rowCount || 0,
      rowCount: result.rowCount || 0
    };

    return [header, result.fields];
  },

  async execute(sqlText, params = []) {
    return this.query(sqlText, params);
  },

  async getConnection() {
    const client = await pool.connect();
    return {
      query: (sql, params) => db.query(sql, params),
      release: () => client.release()
    };
  }
};

// Log amigável de conexão
pool.query('SELECT 1')
  .then(() => {
    console.log('✅ Conexão com o banco de dados PostgreSQL estabelecida com sucesso!');
  })
  .catch((err) => {
    console.warn('⚠️  PostgreSQL: Não foi possível conectar ao banco de dados no momento:', err.message);
    console.warn('   (Certifique-se de configurar as credenciais no arquivo .env e executar o script prepUni_db_postgresql.sql)');
  });

module.exports = db;
