const bcrypt = require('bcryptjs');
const db = require('../src/backend/db');

async function seedData() {
  console.log('--- Verificando e Populando Dados Iniciais do LMS ---');

  // 1. Alunos de exemplo se users estiver vazio
  const [usersCount] = await db.query('SELECT count(*) FROM users');
  if (parseInt(usersCount[0].count, 10) === 0) {
    const defaultPassword = await bcrypt.hash('aluno123', 10);
    const instrutorPassword = await bcrypt.hash('prof123', 10);

    // Inserir instrutor
    const [instResult] = await db.query(
      `INSERT INTO users (name, emailOrPhone, password, role, accountType, status, phone, bio)
       VALUES (?, ?, ?, 'Instrutor', 'instrutor', 'ativo', '+244 923 111 222', 'Professor especialista em Carreiras Universitárias e Militares.') RETURNING id`,
      ['Prof. Manuel Domingos', 'professor.manuel@prepuni.com', instrutorPassword]
    );
    const instructorId = instResult.insertId;

    // Inserir alunos
    const [aluno1] = await db.query(
      `INSERT INTO users (name, emailOrPhone, password, role, accountType, status, phone, bio)
       VALUES (?, ?, ?, 'Estudante', 'estudante', 'ativo', '+244 934 555 777', 'Estudante focado em exames de admissão.') RETURNING id`,
      ['António Kieza', 'antonio.kieza@gmail.com', defaultPassword]
    );

    const [aluno2] = await db.query(
      `INSERT INTO users (name, emailOrPhone, password, role, accountType, status, phone, bio)
       VALUES (?, ?, ?, 'Estudante', 'estudante', 'ativo', '+244 912 333 444', 'Candidato a Medicina e Saúde.') RETURNING id`,
      ['Beatriz Silva', 'beatriz.silva@gmail.com', defaultPassword]
    );

    const [aluno3] = await db.query(
      `INSERT INTO users (name, emailOrPhone, password, role, accountType, status, phone, bio)
       VALUES (?, ?, ?, 'Estudante', 'estudante', 'ativo', '+244 945 888 999', 'Candidato ao concurso Bombeiro e Polícia.') RETURNING id`,
      ['Carlos Eduardo', 'carlos.edu@gmail.com', defaultPassword]
    );

    console.log('✅ Usuários e instrutores criados!');

    // 2. Inserir Cursos Iniciais
    const [c1] = await db.query(
      `INSERT INTO courses 
        (title, description, price, duration, workload_hours, level, category, subcategory, country, status, instructor_id, account, iban, express_number, details, course)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [
        'Preparatório Intensivo de Acesso à Faculdade de Medicina 2027',
        'Preparação completa em Biologia Celular, Química Orgânica, Anatomia Básica e Redação Científica.',
        45000,
        '12 meses',
        '360h',
        'Intermediário',
        'Ciências da Saúde',
        'Medicina e Saúde',
        'Angola',
        'publicado',
        instructorId,
        '0040.0000.3762.4337.1015.4',
        'AO06.0040.0000.3762.4337.1015.4',
        '941908927',
        'Curso com mais de 80 videoaulas, listas de exercícios semanais, simulados comentados e acompanhamento direto via WhatsApp.',
        'Medicina 2027'
      ]
    );

    const [c2] = await db.query(
      `INSERT INTO courses 
        (title, description, price, duration, workload_hours, level, category, subcategory, country, status, instructor_id, account, iban, express_number, details, course)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [
        'Engenharias e Tecnologias: Cálculo, Física e Geometria',
        'Domine Matemática Avançada, Física Geral, Geometria Analítica e Raciocínio Lógico para engenharias.',
        38000,
        '6 meses',
        '280h',
        'Avançado',
        'Ciências das Engenharias',
        'Engenharia Informática e Civil',
        'Angola',
        'publicado',
        instructorId,
        '0040.0000.3762.4337.1015.4',
        'AO06.0040.0000.3762.4337.1015.4',
        '941908927',
        'Conteúdo aprofundado com foco em resolução passo a passo de exames dos anos anteriores.',
        'Engenharias 2027'
      ]
    );

    const [c3] = await db.query(
      `INSERT INTO courses 
        (title, description, price, duration, workload_hours, level, category, subcategory, country, status, instructor_id, account, iban, express_number, details, course)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [
        'Carreiras Policiais e Militares: Preparação de Elite',
        'Preparação teórica e resolução de provas para Polícia Nacional, Forças Armadas e Bombeiros.',
        30000,
        'Válido até a prova',
        '220h',
        'Todos os níveis',
        'Carreiras Policiais',
        'Polícia e Forças de Defesa',
        'Angola',
        'publicado',
        instructorId,
        '0040.0000.3762.4337.1015.4',
        'AO06.0040.0000.3762.4337.1015.4',
        '941908927',
        'Simulados nos moldes das bancas examinadoras oficiais com gabaritos comentados.',
        'Carreiras Policiais 2027'
      ]
    );

    console.log('✅ Cursos iniciais cadastrados!');

    // 3. Módulos e Aulas para o Curso 1
    const [mod1] = await db.query(
      `INSERT INTO course_modules (course_id, title, description, order_index)
       VALUES (?, ?, ?, 1) RETURNING id`,
      [c1.insertId, 'Módulo 1: Fundamentos de Biologia Celular', 'Bases da citologia, organelas e divisão celular.']
    );

    const [mod2] = await db.query(
      `INSERT INTO course_modules (course_id, title, description, order_index)
       VALUES (?, ?, ?, 2) RETURNING id`,
      [c1.insertId, 'Módulo 2: Genética e Fisiologia Humana', 'Genética mendeliana e sistemas do corpo humano.']
    );

    await db.query(
      `INSERT INTO course_lessons 
        (module_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free_preview)
       VALUES (?, ?, ?, ?, 'video', ?, 45, 1, TRUE)`,
      [
        mod1.insertId,
        c1.insertId,
        'Aula 1: Introdução à Estrutura e Membrana Celular',
        'Visão geral das membranas biológicas, permeabilidade e transporte.',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      ]
    );

    await db.query(
      `INSERT INTO course_lessons 
        (module_id, course_id, title, description, content_type, video_url, duration_minutes, order_index, is_free_preview)
       VALUES (?, ?, ?, ?, 'video', ?, 50, 2, FALSE)`,
      [
        mod1.insertId,
        c1.insertId,
        'Aula 2: Mitocôndrias, Respiração Celular e Bioenergética',
        'Ciclo de Krebs, fosforilação oxidativa e cadeia respiratória.',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      ]
    );

    await db.query(
      `INSERT INTO course_lessons 
        (module_id, course_id, title, description, content_type, text_content, duration_minutes, order_index, is_free_preview)
       VALUES (?, ?, ?, ?, 'pdf', ?, 15, 3, FALSE)`,
      [
        mod1.insertId,
        c1.insertId,
        'Apostila PDF: Resumo e Esquemas de Citologia',
        'Material complementar em formato digital com mapas mentais.',
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      ]
    );

    console.log('✅ Módulos e aulas cadastrados!');

    // 4. Matrículas de Exemplo
    await db.query(
      `INSERT INTO compras (user_id, curso_id, data_expiracao, status, progress)
       VALUES (?, ?, CURRENT_DATE + INTERVAL '1 year', 'ativa', 65)`,
      [aluno1.insertId, c1.insertId]
    );

    await db.query(
      `INSERT INTO compras (user_id, curso_id, data_expiracao, status, progress)
       VALUES (?, ?, CURRENT_DATE + INTERVAL '6 months', 'ativa', 30)`,
      [aluno2.insertId, c1.insertId]
    );

    await db.query(
      `INSERT INTO compras (user_id, curso_id, data_expiracao, status, progress)
       VALUES (?, ?, CURRENT_DATE + INTERVAL '1 year', 'ativa', 10)`,
      [aluno3.insertId, c3.insertId]
    );

    console.log('✅ Matrículas cadastradas!');

    // 5. Exame e Perguntas
    const [exam1] = await db.query(
      `INSERT INTO exam_classes (courseId, roomName, ownerId, description, time_limit_minutes, passing_score, status)
       VALUES (?, ?, ?, ?, 60, 50.0, 'ativo') RETURNING id`,
      [
        c1.insertId,
        'Simulado Oficial 1: Biologia Geral e Citologia',
        instructorId,
        'Simulado cronometrado com 60 minutos e correção automática com gabarito comentado.'
      ]
    );

    await db.query(
      `INSERT INTO exam_questions 
        (roomId, question, correctAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3, wrongAnswer4, tema, disciplina, points, explanation, ownerId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 10.0, ?, ?)`,
      [
        exam1.insertId,
        'Qual das seguintes organelas citoplasmáticas é a principal responsável pela síntese de ATP celular através da respiração aeróbica?',
        'Mitocôndria',
        'Complexo de Golgi',
        'Retículo Endoplasmático Liso',
        'Lisossomo',
        'Ribossomo',
        'Citologia',
        'Biologia',
        'A mitocôndria realiza a fosforilação oxidativa e o ciclo do ácido cítrico, gerando a maior parte do ATP das células eucarióticas.',
        instructorId
      ]
    );

    await db.query(
      `INSERT INTO exam_questions 
        (roomId, question, correctAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3, wrongAnswer4, tema, disciplina, points, explanation, ownerId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 10.0, ?, ?)`,
      [
        exam1.insertId,
        'Qual o mecanismo de transporte através da membrana celular que ocorre contra o gradiente de concentração e consome energia (ATP)?',
        'Transporte Ativo',
        'Difusão Simples',
        'Difusão Facilitada',
        'Osmose',
        'Diálise',
        'Membrana Celular',
        'Biologia',
        'O transporte ativo (como a bomba de sódio-potássio) desloca solutos contra o gradiente eletroquímico com hidrólise de ATP.',
        instructorId
      ]
    );

    console.log('✅ Exames e perguntas criados!');

    // 6. Certificado emitido para aluno 1
    await db.query(
      `INSERT INTO certificates (code, user_id, course_id, grade, workload_hours, status)
       VALUES ('PREP-MED-2026-A1B2', ?, ?, 95.50, '360h', 'valido')`,
      [aluno1.insertId, c1.insertId]
    );

    console.log('✅ Certificado inicial emitido!');
  }

  console.log('✅ População de dados concluída!');
  process.exit(0);
}

seedData().catch(err => {
  console.error('Erro ao popular dados:', err);
  process.exit(1);
});

