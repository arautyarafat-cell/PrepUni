const axios = require('axios');

const API = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 INICIANDO TESTES END-TO-END DO LMS COMPLETO');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.response?.data || err.message);
      failed++;
    }
  }

  let createdCourseId = null;
  let createdModuleId = null;
  let createdLessonId = null;
  let createdExamId = null;
  let createdQuestionId = null;
  let createdStudentId = null;
  let createdEnrollmentId = null;
  let createdCertCode = null;
  let createdCategoryId = null;

  // 1. Dashboard Stats
  await test('Dashboard Estatísticas em Tempo Real', async () => {
    const res = await axios.get(`${API}/admin/dashboard-stats`);
    if (!res.data.success || !res.data.stats) throw new Error('Falha nos stats');
    if (typeof res.data.stats.courses.total !== 'number') throw new Error('Formato inválido');
  });

  // 2. Criar e Publicar Curso
  await test('Criar Curso com Dados Didáticos e Preço', async () => {
    const res = await axios.post(`${API}/admin/courses`, {
      title: 'Curso de Teste Automatizado LMS',
      description: 'Descrição completa do curso para teste E2E.',
      price: 25000,
      duration: '6 meses',
      workload_hours: '60h',
      category: 'Ciências das Engenharias',
      status: 'publicado'
    });
    if (!res.data.id) throw new Error('Não retornou id');
    createdCourseId = res.data.id;
  });

  // 3. Alterar Status do Curso
  await test('Alterar Status do Curso (Publicar / Despublicar)', async () => {
    const res1 = await axios.patch(`${API}/admin/courses/${createdCourseId}/status`, { status: 'rascunho' });
    if (!res1.data.success) throw new Error('Falha ao despublicar');
    const res2 = await axios.patch(`${API}/admin/courses/${createdCourseId}/status`, { status: 'publicado' });
    if (!res2.data.success) throw new Error('Falha ao republicar');
  });

  // 4. Módulos do Curso
  await test('Criar Módulo no Curso', async () => {
    const res = await axios.post(`${API}/admin/modules`, {
      course_id: createdCourseId,
      title: 'Módulo de Teste 1',
      description: 'Introdução ao teste',
      order_index: 1
    });
    if (!res.data.id) throw new Error('Não retornou id do módulo');
    createdModuleId = res.data.id;
  });

  // 5. Aulas e Recursos
  await test('Adicionar Videoaula e Material ao Módulo', async () => {
    const res = await axios.post(`${API}/admin/lessons`, {
      module_id: createdModuleId,
      course_id: createdCourseId,
      title: 'Aula de Teste 1 - Videoaula',
      description: 'Conteúdo programático da aula de teste',
      content_type: 'video',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration_minutes: 40,
      is_free_preview: true
    });
    if (!res.data.id) throw new Error('Não retornou id da aula');
    createdLessonId = res.data.id;
  });

  // 6. Avaliação / Exame
  await test('Criar Sala de Avaliação / Simulado com Tempo Limite', async () => {
    const res = await axios.post(`${API}/admin/exams`, {
      courseId: createdCourseId,
      roomName: 'Exame de Avaliação Automatizada',
      description: 'Avaliação cronometrada com nota de corte.',
      time_limit_minutes: 45,
      passing_score: 60,
      status: 'ativo'
    });
    if (!res.data.id) throw new Error('Não retornou id do exame');
    createdExamId = res.data.id;
  });

  // 7. Questão com Alternativas e Gabarito
  await test('Cadastrar Questão no Banco com Gabarito e Explicação', async () => {
    const res = await axios.post(`${API}/admin/questions`, {
      roomId: createdExamId,
      question: 'Qual é o resultado de 2 + 2 no sistema decimal?',
      correctAnswer: '4',
      wrongAnswer1: '3',
      wrongAnswer2: '5',
      wrongAnswer3: '22',
      wrongAnswer4: '0',
      disciplina: 'Matemática',
      tema: 'Aritmética Básica',
      points: 10,
      explanation: 'Pela definição elementar de adição, dois mais dois é igual a quatro.'
    });
    if (!res.data.id) throw new Error('Não retornou id da questão');
    createdQuestionId = res.data.id;
  });

  // 8. Aluno: Cadastro e Bloqueio
  await test('Cadastrar e Gerenciar Aluno (Ativar / Bloquear)', async () => {
    const randomEmail = `aluno.teste.${Date.now()}@prepuni.test`;
    const res = await axios.post(`${API}/admin/students`, {
      name: 'Aluno Teste Automatizado',
      emailOrPhone: randomEmail,
      password: 'senhaSegura123',
      phone: '+244 999 888 777',
      status: 'ativo'
    });
    if (!res.data.id) throw new Error('Não retornou id do aluno');
    createdStudentId = res.data.id;

    // Bloquear
    await axios.patch(`${API}/admin/students/${createdStudentId}/status`, { status: 'bloqueado' });
    // Desbloquear
    await axios.patch(`${API}/admin/students/${createdStudentId}/status`, { status: 'ativo' });
  });

  // 9. Matrícula Manual
  await test('Matricular Aluno Manualmente no Curso', async () => {
    const res = await axios.post(`${API}/admin/enrollments`, {
      user_id: createdStudentId,
      curso_id: createdCourseId,
      status: 'ativa'
    });
    if (!res.data.success) throw new Error('Falha na matrícula');
    createdEnrollmentId = res.data.id;
  });

  // 10. Progresso do Aluno
  await test('Consultar Acompanhamento de Progresso', async () => {
    const res = await axios.get(`${API}/admin/progress?courseId=${createdCourseId}`);
    if (!Array.isArray(res.data)) throw new Error('Resposta não é array');
  });

  // 11. Emissão de Certificado
  await test('Emitir Certificado com Código Único', async () => {
    const res = await axios.post(`${API}/admin/certificates`, {
      user_id: createdStudentId,
      course_id: createdCourseId,
      grade: 95,
      workload_hours: '60h'
    });
    if (!res.data.code) throw new Error('Código do certificado não retornado');
    createdCertCode = res.data.code;
  });

  // 12. Validação Pública de Certificado
  await test('Validação Pública do Certificado pelo Código', async () => {
    const res = await axios.get(`${API}/certificates/validate/${createdCertCode}`);
    if (!res.data.valid) throw new Error('Certificado não validado');
  });

  // 13. Categorias
  await test('Criar e Listar Categorias de Cursos', async () => {
    const catName = `Categoria Teste ${Date.now()}`;
    const res = await axios.post(`${API}/admin/categories`, {
      name: catName,
      description: 'Categoria de teste E2E',
      icon: 'fa-graduation-cap'
    });
    if (!res.data.id) throw new Error('ID categoria não retornado');
    createdCategoryId = res.data.id;
  });

  // 14. Instrutores
  await test('Cadastrar Instrutor e Perfil Docente', async () => {
    const res = await axios.post(`${API}/admin/instructors`, {
      name: 'Prof. Teste E2E',
      emailOrPhone: `prof.teste.${Date.now()}@prepuni.test`,
      password: 'profSenha123',
      phone: '+244 911 222 333',
      bio: 'Doutor em Educação e Tecnologias.'
    });
    if (!res.data.id) throw new Error('Falha ao criar instrutor');
  });

  // 15. Configurações da Plataforma
  await test('Atualizar e Consultar Configurações da Plataforma', async () => {
    const resPut = await axios.put(`${API}/admin/settings`, {
      platform_name: 'prepUni - Plataforma LMS Profissional',
      contact_email: 'suporte@prepuni.com',
      support_whatsapp: '941908927',
      payment_whatsapp: '941908927',
      currency_symbol: 'Kz',
      certificate_min_score: 75
    });
    if (!resPut.data.success) throw new Error('Falha no update de settings');

    const resGet = await axios.get(`${API}/admin/settings`);
    if (resGet.data.certificate_min_score !== 75) throw new Error('Configuração não persistida');
  });

  // LIMPEZA DOS REGISTROS DE TESTE
  console.log('\n--- Limpando registros temporários de teste ---');
  if (createdCourseId) {
    await axios.delete(`${API}/admin/courses/${createdCourseId}`).catch(() => {});
  }
  if (createdStudentId) {
    await axios.delete(`${API}/admin/students/${createdStudentId}`).catch(() => {});
  }
  if (createdCategoryId) {
    await axios.delete(`${API}/admin/categories/${createdCategoryId}`).catch(() => {});
  }

  console.log('\n====================================================');
  console.log(`TOTAL DE TESTES: ${passed + failed}`);
  console.log(`PASSOU: ${passed}`);
  console.log(`FALHOU: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Erro crítico na suíte de testes:', err);
  process.exit(1);
});

