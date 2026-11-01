const db = require('../src/backend/db');

async function runMigration() {
  console.log('Iniciando migração de banco de dados para LMS Completo...');

  const queries = [
    // 1. Atualizar admin passwords para admin123
    `UPDATE admin SET password = '$2a$10$9WfX3ncxzfqmwdPdf3ij5uWd.uegVYHJVbyW7NUVKjQpwD.I0bP0m' WHERE username IN ('admin1', 'admin2');`,

    // 2. Colunas adicionais para courses
    `ALTER TABLE courses ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'publicado';`,
    `ALTER TABLE courses ADD COLUMN IF NOT EXISTS category VARCHAR(100) NOT NULL DEFAULT 'Geral';`,
    `ALTER TABLE courses ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100) NOT NULL DEFAULT '';`,
    `ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_id INT REFERENCES users(id) ON DELETE SET NULL;`,
    `ALTER TABLE courses ADD COLUMN IF NOT EXISTS workload_hours VARCHAR(50) DEFAULT '40h';`,
    `ALTER TABLE courses ADD COLUMN IF NOT EXISTS level VARCHAR(50) DEFAULT 'Todos os níveis';`,
    `ALTER TABLE courses ALTER COLUMN course DROP NOT NULL;`,
    `ALTER TABLE courses ALTER COLUMN course SET DEFAULT '';`,

    // 3. Colunas adicionais para users
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ativo';`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT '';`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;`,

    // 4. Colunas adicionais para compras (matriculas)
    `ALTER TABLE compras ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'ativa';`,
    `ALTER TABLE compras ADD COLUMN IF NOT EXISTS progress INT NOT NULL DEFAULT 0;`,
    `ALTER TABLE compras ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;`,

    // 5. Colunas adicionais para exam_classes
    `ALTER TABLE exam_classes ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';`,
    `ALTER TABLE exam_classes ADD COLUMN IF NOT EXISTS time_limit_minutes INT NOT NULL DEFAULT 60;`,
    `ALTER TABLE exam_classes ADD COLUMN IF NOT EXISTS passing_score DECIMAL(5,2) NOT NULL DEFAULT 50.00;`,
    `ALTER TABLE exam_classes ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ativo';`,

    // 6. Colunas adicionais para exam_questions
    `ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS points DECIMAL(5,2) NOT NULL DEFAULT 1.00;`,
    `ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS explanation TEXT DEFAULT '';`,

    // 7. Tabela course_modules
    `CREATE TABLE IF NOT EXISTS course_modules (
      id SERIAL PRIMARY KEY,
      course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT DEFAULT '',
      order_index INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 8. Tabela course_lessons
    `CREATE TABLE IF NOT EXISTS course_lessons (
      id SERIAL PRIMARY KEY,
      module_id INT REFERENCES course_modules(id) ON DELETE CASCADE,
      course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT DEFAULT '',
      content_type VARCHAR(50) NOT NULL DEFAULT 'video',
      video_url VARCHAR(500) DEFAULT '',
      video_drive_url VARCHAR(500) DEFAULT '',
      attachment_url VARCHAR(500) DEFAULT '',
      attachment_name VARCHAR(255) DEFAULT '',
      text_content TEXT DEFAULT '',
      duration_minutes INT DEFAULT 0,
      order_index INT NOT NULL DEFAULT 1,
      is_free_preview BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 9. Tabela lesson_progress
    `CREATE TABLE IF NOT EXISTS lesson_progress (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id INT NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
      course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      completed BOOLEAN DEFAULT TRUE,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_user_lesson UNIQUE (user_id, lesson_id)
    );`,

    // 10. Tabela categories
    `CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      slug VARCHAR(100) NOT NULL,
      description TEXT DEFAULT '',
      parent_id INT REFERENCES categories(id) ON DELETE SET NULL,
      icon VARCHAR(50) DEFAULT 'fa-folder',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    // 11. Tabela certificates
    `CREATE TABLE IF NOT EXISTS certificates (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      grade DECIMAL(5,2) DEFAULT 100.00,
      workload_hours VARCHAR(50) DEFAULT '40h',
      status VARCHAR(20) DEFAULT 'valido',
      pdf_url VARCHAR(500) DEFAULT NULL
    );`,

    // 12. Tabela exam_attempts
    `CREATE TABLE IF NOT EXISTS exam_attempts (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      exam_id INT NOT NULL REFERENCES exam_classes(id) ON DELETE CASCADE,
      course_id INT DEFAULT NULL,
      score DECIMAL(5,2) NOT NULL,
      correct_answers INT NOT NULL,
      wrong_answers INT NOT NULL,
      total_questions INT NOT NULL,
      passed BOOLEAN DEFAULT FALSE,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // 13. Tabela platform_settings
    `CREATE TABLE IF NOT EXISTS platform_settings (
      id SERIAL PRIMARY KEY,
      platform_name VARCHAR(255) NOT NULL DEFAULT 'prepUni Cursos Preparatórios',
      contact_email VARCHAR(255) DEFAULT 'contato@prepuni.com',
      support_phone VARCHAR(50) DEFAULT '+244 941 908 927',
      support_whatsapp VARCHAR(50) DEFAULT '941908927',
      payment_whatsapp VARCHAR(50) DEFAULT '941908927',
      bna_iban VARCHAR(100) DEFAULT '0040.0000.3762.4337.1015.4',
      bna_express VARCHAR(100) DEFAULT '941908927',
      currency_symbol VARCHAR(10) DEFAULT 'Kz',
      allow_registration BOOLEAN DEFAULT TRUE,
      certificate_min_score INT DEFAULT 70,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // Inserir platform_settings padrão se não existir
    `INSERT INTO platform_settings (id, platform_name, contact_email, support_phone, support_whatsapp, payment_whatsapp, bna_iban, bna_express, currency_symbol, allow_registration, certificate_min_score)
     VALUES (1, 'prepUni - Plataforma LMS', 'contato@prepuni.com', '+244 941 908 927', '941908927', '941908927', '0040.0000.3762.4337.1015.4', '941908927', 'Kz', TRUE, 70)
     ON CONFLICT (id) DO NOTHING;`,

    // Inserir categorias padrão
    `INSERT INTO categories (name, slug, description, icon) VALUES
      ('Ciências da Saúde', 'ciencias-da-saude', 'Cursos e preparatórios para medicina, enfermagem e saúde', 'fa-heartbeat'),
      ('Ciências Sociais e Humanas', 'ciencias-sociais-humanas', 'Direito, administração, pedagogia e humanidades', 'fa-balance-scale'),
      ('Ciências das Engenharias', 'ciencias-das-engenharias', 'Engenharias, informática, tecnologias e exatas', 'fa-cogs'),
      ('Carreiras Policiais', 'carreiras-policiais', 'Preparação para concursos militares, polícia e bombeiros', 'fa-shield-alt'),
      ('Geral e Outros', 'geral', 'Cursos gerais e complementares', 'fa-graduation-cap')
     ON CONFLICT (name) DO NOTHING;`
  ];

  for (const q of queries) {
    try {
      await db.rawPool.query(q);
      console.log('Executado com sucesso:', q.split('\n')[0].substring(0, 70) + '...');
    } catch (err) {
      console.error('Erro na query:', q.split('\n')[0], err.message);
      throw err;
    }
  }

  console.log('✅ Migração do banco para LMS Completo finalizada com sucesso!');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Falha geral na migração:', err);
  process.exit(1);
});

