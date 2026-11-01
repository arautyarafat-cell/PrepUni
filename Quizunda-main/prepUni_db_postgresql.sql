-- ============================================================
-- Banco de Dados: prepUni_db (PostgreSQL)
-- Convertido de MySQL / MariaDB para PostgreSQL com extensão LMS completa
-- ============================================================

-- 1. Funções de compatibilidade (para suportar sintaxes usadas no código)
CREATE OR REPLACE FUNCTION curdate() RETURNS date AS $$
  SELECT CURRENT_DATE;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION rand() RETURNS double precision AS $$
  SELECT random();
$$ LANGUAGE sql VOLATILE;

CREATE OR REPLACE FUNCTION date_add(start_date timestamp with time zone, added_interval interval)
RETURNS timestamp with time zone AS $$
  SELECT start_date + added_interval;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION date_add(start_date timestamp without time zone, added_interval interval)
RETURNS timestamp without time zone AS $$
  SELECT (start_date + added_interval)::timestamp without time zone;
$$ LANGUAGE sql IMMUTABLE;

-- 2. Remoção de tabelas pré-existentes (ordem inversa de dependências)
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS course_lessons CASCADE;
DROP TABLE IF EXISTS course_modules CASCADE;
DROP TABLE IF EXISTS exam_attempts CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS platform_settings CASCADE;
DROP TABLE IF EXISTS exam_questions CASCADE;
DROP TABLE IF EXISTS exam_rooms CASCADE;
DROP TABLE IF EXISTS exam_classes CASCADE;
DROP TABLE IF EXISTS destacar_curso CASCADE;
DROP TABLE IF EXISTS course_contacts CASCADE;
DROP TABLE IF EXISTS video_lessons CASCADE;
DROP TABLE IF EXISTS support_materials CASCADE;
DROP TABLE IF EXISTS complementary_materials CASCADE;
DROP TABLE IF EXISTS compras CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS used_questions CASCADE;
DROP TABLE IF EXISTS use_questions CASCADE;
DROP TABLE IF EXISTS estatisticas CASCADE;
DROP TABLE IF EXISTS recuperar_senha CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS bna CASCADE;
DROP TABLE IF EXISTS admin CASCADE;

-- 3. Criação das Tabelas

-- Tabela admin
CREATE TABLE admin (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela bna
CREATE TABLE bna (
  id SERIAL PRIMARY KEY,
  express VARCHAR(250) DEFAULT NULL,
  iban VARCHAR(250) DEFAULT NULL
);

-- Tabela users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  accountType VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Estudante',
  emailOrPhone VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  phone VARCHAR(50) DEFAULT '',
  bio TEXT DEFAULT '',
  avatar VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela categories
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  parent_id INT REFERENCES categories(id) ON DELETE SET NULL,
  icon VARCHAR(50) DEFAULT 'fa-folder',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela courses
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  price DECIMAL(10,2) DEFAULT NULL,
  ownerId INT REFERENCES users(id) ON DELETE SET NULL,
  instructor_id INT REFERENCES users(id) ON DELETE SET NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  duration VARCHAR(50) DEFAULT NULL,
  thumbnail VARCHAR(255) DEFAULT NULL,
  country VARCHAR(100) NOT NULL DEFAULT '',
  course VARCHAR(500) DEFAULT '',
  account VARCHAR(100) DEFAULT NULL,
  iban VARCHAR(100) DEFAULT NULL,
  express_number VARCHAR(100) DEFAULT NULL,
  details TEXT DEFAULT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'publicado',
  category VARCHAR(100) NOT NULL DEFAULT 'Geral',
  subcategory VARCHAR(100) NOT NULL DEFAULT '',
  workload_hours VARCHAR(50) DEFAULT '40h',
  level VARCHAR(50) DEFAULT 'Todos os níveis'
);

-- Tabela course_modules
CREATE TABLE course_modules (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  order_index INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela course_lessons
CREATE TABLE course_lessons (
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
);

-- Tabela lesson_progress
CREATE TABLE lesson_progress (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INT NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT TRUE,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_lesson UNIQUE (user_id, lesson_id)
);

-- Tabela complementary_materials (legado mantido)
CREATE TABLE complementary_materials (
  id SERIAL PRIMARY KEY,
  courseId INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  tema VARCHAR(255) NOT NULL DEFAULT '',
  disciplina VARCHAR(255) NOT NULL DEFAULT '',
  materials TEXT DEFAULT NULL,
  ownerID INT DEFAULT NULL
);

-- Tabela compras (Matrículas)
CREATE TABLE compras (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  curso_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  data_compra TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_expiracao DATE DEFAULT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ativa',
  progress INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela course_contacts
CREATE TABLE course_contacts (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL UNIQUE REFERENCES courses(id) ON DELETE CASCADE,
  support_whatsapp VARCHAR(20) NOT NULL,
  payment_whatsapp VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela destacar_curso
CREATE TABLE destacar_curso (
  id SERIAL PRIMARY KEY,
  id_do_curso INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela estatisticas
CREATE TABLE estatisticas (
  id SERIAL PRIMARY KEY,
  disciplina VARCHAR(100) NOT NULL,
  acertos INT NOT NULL,
  errados INT NOT NULL,
  total INT NOT NULL,
  percentual DECIMAL(5,2) NOT NULL,
  data_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INT DEFAULT NULL
);

-- Tabela exam_classes
CREATE TABLE exam_classes (
  id SERIAL PRIMARY KEY,
  courseId INT NOT NULL,
  roomName VARCHAR(255) NOT NULL,
  ownerId INT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  description TEXT DEFAULT '',
  time_limit_minutes INT NOT NULL DEFAULT 60,
  passing_score DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  status VARCHAR(20) NOT NULL DEFAULT 'ativo'
);

-- Tabela exam_rooms (legado)
CREATE TABLE exam_rooms (
  id SERIAL PRIMARY KEY,
  courseId INT NOT NULL,
  title VARCHAR(255) NOT NULL
);

-- Tabela exam_questions
CREATE TABLE exam_questions (
  id SERIAL PRIMARY KEY,
  roomId INT NOT NULL REFERENCES exam_classes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  correctAnswer TEXT NOT NULL,
  wrongAnswer1 TEXT DEFAULT NULL,
  wrongAnswer2 TEXT DEFAULT NULL,
  wrongAnswer3 TEXT DEFAULT NULL,
  wrongAnswer4 TEXT DEFAULT NULL,
  ownerId INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tema VARCHAR(255) NOT NULL DEFAULT '',
  disciplina VARCHAR(255) NOT NULL DEFAULT '',
  points DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  explanation TEXT DEFAULT ''
);

-- Tabela exam_attempts
CREATE TABLE exam_attempts (
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
);

-- Tabela certificates
CREATE TABLE certificates (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  grade DECIMAL(5,2) DEFAULT 100.00,
  workload_hours VARCHAR(50) DEFAULT '40h',
  status VARCHAR(20) DEFAULT 'valido',
  pdf_url VARCHAR(500) DEFAULT NULL
);

-- Tabela platform_settings
CREATE TABLE platform_settings (
  id SERIAL PRIMARY KEY,
  platform_name VARCHAR(255) NOT NULL DEFAULT 'prepUni Cursos Preparatórios',
  contact_email VARCHAR(255) DEFAULT 'contato@prepuni.com',
  support_phone VARCHAR(50) DEFAULT '+244 941 908 927',
  support_whatsapp VARCHAR(50) DEFAULT '5581997570784',
  payment_whatsapp VARCHAR(50) DEFAULT '5581997570784',
  bna_iban VARCHAR(100) DEFAULT '0040.0000.3762.4337.1015.4',
  bna_express VARCHAR(100) DEFAULT '941908927',
  currency_symbol VARCHAR(10) DEFAULT 'Kz',
  allow_registration BOOLEAN DEFAULT TRUE,
  certificate_min_score INT DEFAULT 70,
  whatsapp_display VARCHAR(100) DEFAULT '(81) 99757-0784',
  whatsapp_message TEXT DEFAULT 'Olá, preciso de ajuda!',
  whatsapp_description TEXT DEFAULT 'Atendimento rápido e suporte a dúvidas sobre cursos e matrículas.',
  instagram_url VARCHAR(255) DEFAULT 'https://www.instagram.com/estoupreparadoconcursos/',
  instagram_handle VARCHAR(100) DEFAULT '@estoupreparadoconcursos',
  instagram_description TEXT DEFAULT 'Acompanhe dicas diárias, notícias de editais e lives exclusivas.',
  youtube_url VARCHAR(255) DEFAULT 'https://www.youtube.com/user/isaqueljoao',
  youtube_title VARCHAR(150) DEFAULT 'Preparatório Universitário Oficial',
  youtube_description TEXT DEFAULT 'Aulas gratuitas, correções de provas e análises de bancas.',
  location_title VARCHAR(100) DEFAULT 'Unidade Física',
  location_address VARCHAR(255) DEFAULT 'Limoeiro / Recife - PE',
  location_description TEXT DEFAULT 'Cursos e simulados presenciais no estado de Pernambuco.',
  location_link VARCHAR(255) DEFAULT '/CoursesPage',
  location_button_text VARCHAR(100) DEFAULT 'Ver Cursos Presenciais',
  facebook_url VARCHAR(255) DEFAULT 'https://www.facebook.com',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela recuperar_senha
CREATE TABLE recuperar_senha (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  numeroouemail VARCHAR(255) NOT NULL,
  sugerir_nova_senha VARCHAR(255) NOT NULL
);

-- Tabela support_materials (legado)
CREATE TABLE support_materials (
  id SERIAL PRIMARY KEY,
  courseId INT NOT NULL,
  discipline VARCHAR(100) NOT NULL,
  materialUrl TEXT NOT NULL,
  ownerId INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela used_questions
CREATE TABLE used_questions (
  id SERIAL PRIMARY KEY,
  disciplina VARCHAR(100) NOT NULL,
  question_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela use_questions
CREATE TABLE use_questions (
  id SERIAL PRIMARY KEY,
  questao VARCHAR(500) NOT NULL,
  respostaCorreta VARCHAR(500) NOT NULL,
  respostaErrada1 VARCHAR(500) NOT NULL,
  respostaErrada2 VARCHAR(500) NOT NULL,
  respostaErrada3 VARCHAR(500) NOT NULL,
  respostaErrada4 VARCHAR(500) NOT NULL,
  tema_p VARCHAR(100) NOT NULL,
  disciplina_p VARCHAR(100) NOT NULL
);

-- Tabela usuarios
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) DEFAULT NULL
);

-- Tabela video_lessons
CREATE TABLE video_lessons (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  tema VARCHAR(255) NOT NULL,
  disciplina VARCHAR(100) NOT NULL,
  url VARCHAR(500) NOT NULL,
  url_drive VARCHAR(255) DEFAULT NULL,
  courseId INT NOT NULL,
  ownerID INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course ON course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module ON course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_compras_user_id ON compras(user_id);
CREATE INDEX IF NOT EXISTS idx_compras_curso_id ON compras(curso_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_exam_classes_courseId ON exam_classes(courseId);
CREATE INDEX IF NOT EXISTS idx_exam_questions_roomId ON exam_questions(roomId);

-- 5. Dados Iniciais
INSERT INTO admin (id, username, password, created_at) VALUES
(1, 'admin1', '$2a$10$9WfX3ncxzfqmwdPdf3ij5uWd.uegVYHJVbyW7NUVKjQpwD.I0bP0m', '2026-08-30 10:17:51'),
(2, 'admin2', '$2a$10$9WfX3ncxzfqmwdPdf3ij5uWd.uegVYHJVbyW7NUVKjQpwD.I0bP0m', '2026-08-30 10:20:20')
ON CONFLICT (id) DO UPDATE SET password = EXCLUDED.password;

INSERT INTO bna (id, express, iban) VALUES
(1, '941908927', '0040.0000.3762.4337.1015.4')
ON CONFLICT (id) DO NOTHING;

INSERT INTO platform_settings (id, platform_name, contact_email, support_phone, support_whatsapp, payment_whatsapp, bna_iban, bna_express, currency_symbol, allow_registration, certificate_min_score)
VALUES (1, 'prepUni - Plataforma LMS', 'contato@prepuni.com', '+244 941 908 927', '941908927', '941908927', '0040.0000.3762.4337.1015.4', '941908927', 'Kz', TRUE, 70)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (name, slug, description, icon) VALUES
  ('Ciências da Saúde', 'ciencias-da-saude', 'Cursos e preparatórios para medicina, enfermagem e saúde', 'fa-heartbeat'),
  ('Ciências Sociais e Humanas', 'ciencias-sociais-humanas', 'Direito, administração, pedagogia e humanidades', 'fa-balance-scale'),
  ('Ciências das Engenharias', 'ciencias-das-engenharias', 'Engenharias, informática, tecnologias e exatas', 'fa-cogs'),
  ('Carreiras Policiais', 'carreiras-policiais', 'Preparação para concursos militares, polícia e bombeiros', 'fa-shield-alt'),
  ('Geral e Outros', 'geral', 'Cursos gerais e complementares', 'fa-graduation-cap')
ON CONFLICT (name) DO NOTHING;

-- 6. Ajuste das sequences
SELECT setval('admin_id_seq', (SELECT COALESCE(MAX(id), 1) FROM admin));
SELECT setval('bna_id_seq', (SELECT COALESCE(MAX(id), 1) FROM bna));
SELECT setval('courses_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM courses) + 1, 1));
SELECT setval('exam_classes_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM exam_classes) + 1, 1));
SELECT setval('users_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM users) + 1, 1));
