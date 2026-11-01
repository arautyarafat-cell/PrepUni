const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const db = require("./db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "segredo_super_seguranca";

// Configuração segura do Multer para uploads
const uploadsDir = path.resolve(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `${Date.now()}_${cleanName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Middleware seguro de autenticação e autorização para rotas administrativas
const adminAuth = (req, res, next) => {
  // Ignora se for a rota de login de admin
  if (req.path === "/login" || req.path === "/api/admin/login") {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Acesso não autorizado. Token não fornecido." });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Formato de token inválido." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      try {
        decoded = jwt.verify(token, "segredo_jwt");
      } catch (err) {
        return res.status(401).json({ error: "Token inválido ou expirado." });
      }
    }

    const role = (decoded.role || decoded.accountType || "").toLowerCase();
    const isAuthorized = ["admin", "instrutor", "instructor", "professor", "preparatorio"].includes(role);
    if (!isAuthorized) {
      return res.status(403).json({ error: "Acesso negado. Apenas administradores e instrutores têm permissão." });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Falha na autenticação do administrador." });
  }
};

// 🔒 Aplica proteção a todas as rotas administrativas
router.use("/api/admin", adminAuth);

// =========================================================================
// 1. DASHBOARD ADMINISTRATIVO - ESTATÍSTICAS REAIS EM TEMPO REAL
// =========================================================================
router.get("/api/admin/dashboard-stats", async (req, res) => {
  try {
    // Estatísticas de cursos
    const [coursesRows] = await db.query(`
      SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN status = 'publicado' THEN 1 END)::int as publicados,
        COUNT(CASE WHEN status = 'rascunho' THEN 1 END)::int as rascunhos,
        COUNT(CASE WHEN status = 'arquivado' THEN 1 END)::int as arquivados
      FROM courses
    `);

    // Estatísticas de usuários
    const [usersRows] = await db.query(`
      SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN role = 'Estudante' OR accountType = 'estudante' THEN 1 END)::int as estudantes,
        COUNT(CASE WHEN role = 'Instrutor' OR accountType = 'instrutor' OR accountType = 'preparatorio' THEN 1 END)::int as instrutores,
        COUNT(CASE WHEN status = 'bloqueado' THEN 1 END)::int as bloqueados
      FROM users
    `);

    // Estatísticas de matrículas
    const [enrollmentsRows] = await db.query(`
      SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN status = 'ativa' THEN 1 END)::int as ativas,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END)::int as pendentes,
        COUNT(CASE WHEN status = 'cancelada' OR status = 'expirada' THEN 1 END)::int as inativas
      FROM compras
    `);

    // Estatísticas de aulas e materiais
    const [lessonsRows] = await db.query(`SELECT COUNT(*)::int as total FROM course_lessons`);
    const [videoLessonsRows] = await db.query(`SELECT COUNT(*)::int as total FROM video_lessons`);
    const totalAulas = (lessonsRows[0]?.total || 0) + (videoLessonsRows[0]?.total || 0);

    // Estatísticas de avaliações e perguntas
    const [questionsRows] = await db.query(`SELECT COUNT(*)::int as total FROM exam_questions`);
    const [examsRows] = await db.query(`SELECT COUNT(*)::int as total FROM exam_classes`);
    const [attemptsRows] = await db.query(`SELECT COUNT(*)::int as total FROM exam_attempts`);

    // Estatísticas de certificados
    const [certRows] = await db.query(`SELECT COUNT(*)::int as total FROM certificates`);

    // Receita estimada (soma dos preços dos cursos matriculados ativos)
    const [revenueRows] = await db.query(`
      SELECT COALESCE(SUM(c.price), 0)::float as total_receita
      FROM compras m
      JOIN courses c ON c.id = m.curso_id
      WHERE m.status = 'ativa'
    `);

    // 5 Alunos mais recentes
    const [recentStudents] = await db.query(`
      SELECT id, name, emailOrPhone, role, status, created_at
      FROM users
      ORDER BY id DESC
      LIMIT 5
    `);

    // 5 Matrículas mais recentes
    const [recentEnrollments] = await db.query(`
      SELECT m.id, m.status, m.data_compra, m.data_expiracao,
             u.name as student_name, u.emailOrPhone as student_email,
             c.title as course_title, c.price as course_price
      FROM compras m
      LEFT JOIN users u ON u.id = m.user_id
      LEFT JOIN courses c ON c.id = m.curso_id
      ORDER BY m.id DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        courses: coursesRows[0] || { total: 0, publicados: 0, rascunhos: 0, arquivados: 0 },
        users: usersRows[0] || { total: 0, estudantes: 0, instrutores: 0, bloqueados: 0 },
        enrollments: enrollmentsRows[0] || { total: 0, ativas: 0, pendentes: 0, inativas: 0 },
        lessons: { total: totalAulas },
        questions: { total: questionsRows[0]?.total || 0 },
        exams: { total: examsRows[0]?.total || 0, attempts: attemptsRows[0]?.total || 0 },
        certificates: { total: certRows[0]?.total || 0 },
        revenue: revenueRows[0]?.total_receita || 0
      },
      recentStudents,
      recentEnrollments
    });
  } catch (err) {
    console.error("Erro ao carregar estatísticas do dashboard:", err);
    res.status(500).json({ error: "Erro ao carregar estatísticas do dashboard", details: err.message });
  }
});

// =========================================================================
// 2. GESTÃO DE CURSOS (CRUD COMPLETO COM STATUS, DETALHES E MATRÍCULAS)
// =========================================================================
router.get("/api/admin/courses", async (req, res) => {
  try {
    const { q, status, category } = req.query;
    let query = `
      SELECT 
        c.*,
        u.name as instructor_name,
        (SELECT COUNT(*)::int FROM course_modules m WHERE m.course_id = c.id) as total_modules,
        (SELECT COUNT(*)::int FROM course_lessons l WHERE l.course_id = c.id) as total_lessons,
        (SELECT COUNT(*)::int FROM compras cmp WHERE cmp.curso_id = c.id AND cmp.status = 'ativa') as total_students,
        cc.support_whatsapp,
        cc.payment_whatsapp
      FROM courses c
      LEFT JOIN users u ON u.id = c.instructor_id
      LEFT JOIN course_contacts cc ON cc.course_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      query += ` AND (c.title ILIKE $${params.length} OR c.description ILIKE $${params.length} OR c.category ILIKE $${params.length})`;
    }
    if (status && status !== "todos") {
      params.push(status);
      query += ` AND c.status = $${params.length}`;
    }
    if (category && category !== "todas") {
      params.push(category);
      query += ` AND c.category = $${params.length}`;
    }

    query += ` ORDER BY c.id DESC`;

    const result = await db.rawPool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao listar cursos admin:", err);
    res.status(500).json({ error: "Erro ao listar cursos", details: err.message });
  }
});

router.get("/api/admin/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT c.*, u.name as instructor_name, cc.support_whatsapp, cc.payment_whatsapp
       FROM courses c
       LEFT JOIN users u ON u.id = c.instructor_id
       LEFT JOIN course_contacts cc ON cc.course_id = c.id
       WHERE c.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    // Carregar módulos e aulas
    const [modules] = await db.query(
      `SELECT * FROM course_modules WHERE course_id = ? ORDER BY order_index ASC, id ASC`,
      [id]
    );

    const [lessons] = await db.query(
      `SELECT * FROM course_lessons WHERE course_id = ? ORDER BY order_index ASC, id ASC`,
      [id]
    );

    // Agrupar aulas nos módulos correspondentes
    const modulesWithLessons = modules.map(m => ({
      ...m,
      lessons: lessons.filter(l => l.module_id === m.id)
    }));

    const orphanLessons = lessons.filter(l => !l.module_id);

    res.json({
      ...rows[0],
      modules: modulesWithLessons,
      orphanLessons
    });
  } catch (err) {
    console.error("Erro ao obter curso:", err);
    res.status(500).json({ error: "Erro ao obter curso", details: err.message });
  }
});

router.post("/api/admin/courses", upload.single("thumbnail"), async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      duration,
      workload_hours,
      level,
      category,
      subcategory,
      country,
      account,
      iban,
      express_number,
      details,
      status,
      instructor_id,
      support_whatsapp,
      payment_whatsapp,
      thumbnail_url
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "O título do curso é obrigatório." });
    }

    let thumbnail = thumbnail_url || null;
    if (req.file) {
      thumbnail = `/uploads/${req.file.filename}`;
    }

    const [result] = await db.query(
      `INSERT INTO courses 
        (title, description, price, duration, workload_hours, level, category, subcategory, country, thumbnail, account, iban, express_number, details, status, instructor_id, course)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [
        title.trim(),
        description || "",
        parseFloat(price) || 0,
        duration || "Acesso vitalício",
        workload_hours || "40h",
        level || "Todos os níveis",
        category || "Geral",
        subcategory || "",
        country || "Angola",
        thumbnail,
        account || "",
        iban || "",
        express_number || "",
        details || "",
        status || "publicado",
        instructor_id ? parseInt(instructor_id, 10) : null,
        title.trim()
      ]
    );

    const courseId = result.insertId;

    // Se foram enviados contatos de whatsapp, vincular
    if (support_whatsapp || payment_whatsapp) {
      await db.query(
        `INSERT INTO course_contacts (course_id, support_whatsapp, payment_whatsapp)
         VALUES (?, ?, ?)
         ON CONFLICT (course_id) DO UPDATE 
         SET support_whatsapp = EXCLUDED.support_whatsapp,
             payment_whatsapp = EXCLUDED.payment_whatsapp,
             updated_at = CURRENT_TIMESTAMP`,
        [courseId, support_whatsapp || "", payment_whatsapp || ""]
      );
    }

    // Criar módulo padrão 1 para conveniência imediata
    await db.query(
      `INSERT INTO course_modules (course_id, title, description, order_index)
       VALUES (?, ?, ?, 1)`,
      [courseId, "Módulo 1: Introdução e Fundamentos", "Aulas iniciais do curso"]
    );

    res.status(201).json({
      success: true,
      message: "Curso criado com sucesso!",
      id: courseId
    });
  } catch (err) {
    console.error("Erro ao criar curso:", err);
    res.status(500).json({ error: "Erro ao criar curso", details: err.message });
  }
});

router.put("/api/admin/courses/:id", upload.single("thumbnail"), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      price,
      duration,
      workload_hours,
      level,
      category,
      subcategory,
      country,
      account,
      iban,
      express_number,
      details,
      status,
      instructor_id,
      support_whatsapp,
      payment_whatsapp,
      thumbnail_url
    } = req.body;

    let thumbnail = thumbnail_url;
    if (req.file) {
      thumbnail = `/uploads/${req.file.filename}`;
    }

    let updateQuery = `
      UPDATE courses SET 
        title = ?, 
        description = ?, 
        price = ?, 
        duration = ?, 
        workload_hours = ?, 
        level = ?, 
        category = ?, 
        subcategory = ?, 
        country = ?, 
        account = ?, 
        iban = ?, 
        express_number = ?, 
        details = ?, 
        status = ?, 
        instructor_id = ?
    `;
    const params = [
      title,
      description || "",
      parseFloat(price) || 0,
      duration || "Acesso vitalício",
      workload_hours || "40h",
      level || "Todos os níveis",
      category || "Geral",
      subcategory || "",
      country || "Angola",
      account || "",
      iban || "",
      express_number || "",
      details || "",
      status || "publicado",
      instructor_id ? parseInt(instructor_id, 10) : null
    ];

    if (thumbnail !== undefined && thumbnail !== null) {
      updateQuery += `, thumbnail = ?`;
      params.push(thumbnail);
    }

    updateQuery += ` WHERE id = ?`;
    params.push(id);

    await db.query(updateQuery, params);

    // Atualizar contatos se fornecidos
    if (support_whatsapp !== undefined || payment_whatsapp !== undefined) {
      await db.query(
        `INSERT INTO course_contacts (course_id, support_whatsapp, payment_whatsapp)
         VALUES (?, ?, ?)
         ON CONFLICT (course_id) DO UPDATE 
         SET support_whatsapp = EXCLUDED.support_whatsapp,
             payment_whatsapp = EXCLUDED.payment_whatsapp,
             updated_at = CURRENT_TIMESTAMP`,
        [id, support_whatsapp || "", payment_whatsapp || ""]
      );
    }

    res.json({ success: true, message: "Curso atualizado com sucesso!" });
  } catch (err) {
    console.error("Erro ao atualizar curso:", err);
    res.status(500).json({ error: "Erro ao atualizar curso", details: err.message });
  }
});

router.patch("/api/admin/courses/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["publicado", "rascunho", "arquivado"].includes(status)) {
      return res.status(400).json({ error: "Status inválido. Use 'publicado', 'rascunho' ou 'arquivado'." });
    }

    await db.query("UPDATE courses SET status = ? WHERE id = ?", [status, id]);
    res.json({ success: true, message: `Status do curso alterado para '${status}'` });
  } catch (err) {
    console.error("Erro ao alterar status do curso:", err);
    res.status(500).json({ error: "Erro ao alterar status do curso", details: err.message });
  }
});

router.delete("/api/admin/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Limpar tabelas associadas para garantir exclusão limpa e sem falhas de integridade
    await db.query(`
      DELETE FROM exam_questions
      WHERE roomId IN (SELECT id FROM exam_classes WHERE courseId = ?)
    `, [id]).catch(() => { });

    await db.query("DELETE FROM exam_attempts WHERE course_id = ?", [id]).catch(() => { });
    await db.query("DELETE FROM exam_classes WHERE courseId = ?", [id]).catch(() => { });
    await db.query("DELETE FROM support_materials WHERE courseId = ?", [id]).catch(() => { });
    await db.query("DELETE FROM video_lessons WHERE courseId = ?", [id]).catch(() => { });
    await db.query("DELETE FROM destacar_curso WHERE id_do_curso = ?", [id]).catch(() => { });

    // Eliminar da tabela de cursos (tabelas com FK CASCADE limparão automaticamente)
    const [result] = await db.query("DELETE FROM courses WHERE id = ?", [id]);

    if (result.affectedRows === 0 && result.rowCount === 0) {
      return res.status(404).json({ error: "Curso não encontrado para eliminação." });
    }

    res.json({ success: true, message: "Curso e conteúdos associados eliminados com sucesso!" });
  } catch (err) {
    console.error("Erro ao eliminar curso:", err);
    res.status(500).json({ error: "Erro ao eliminar curso", details: err.message });
  }
});

// =========================================================================
// 3. GESTÃO DE MÓDULOS E AULAS (ESTRUTURA DIDÁTICA DO CURSO)
// =========================================================================
router.get("/api/admin/courses/:courseId/modules", async (req, res) => {
  try {
    const { courseId } = req.params;
    const [modules] = await db.query(
      `SELECT * FROM course_modules WHERE course_id = ? ORDER BY order_index ASC, id ASC`,
      [courseId]
    );

    const [lessons] = await db.query(
      `SELECT * FROM course_lessons WHERE course_id = ? ORDER BY order_index ASC, id ASC`,
      [courseId]
    );

    const result = modules.map(m => ({
      ...m,
      lessons: lessons.filter(l => l.module_id === m.id)
    }));

    res.json(result);
  } catch (err) {
    console.error("Erro ao buscar módulos:", err);
    res.status(500).json({ error: "Erro ao buscar módulos", details: err.message });
  }
});

router.post("/api/admin/modules", async (req, res) => {
  try {
    const { course_id, title, description, order_index } = req.body;
    if (!course_id || !title) {
      return res.status(400).json({ error: "ID do curso e título do módulo são obrigatórios." });
    }

    const [result] = await db.query(
      `INSERT INTO course_modules (course_id, title, description, order_index)
       VALUES (?, ?, ?, ?) RETURNING id`,
      [course_id, title.trim(), description || "", parseInt(order_index, 10) || 1]
    );

    res.status(201).json({ success: true, id: result.insertId, message: "Módulo criado com sucesso!" });
  } catch (err) {
    console.error("Erro ao criar módulo:", err);
    res.status(500).json({ error: "Erro ao criar módulo", details: err.message });
  }
});

router.put("/api/admin/modules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, order_index } = req.body;

    await db.query(
      `UPDATE course_modules SET title = ?, description = ?, order_index = ? WHERE id = ?`,
      [title, description || "", parseInt(order_index, 10) || 1, id]
    );

    res.json({ success: true, message: "Módulo atualizado com sucesso!" });
  } catch (err) {
    console.error("Erro ao atualizar módulo:", err);
    res.status(500).json({ error: "Erro ao atualizar módulo", details: err.message });
  }
});

router.delete("/api/admin/modules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM course_modules WHERE id = ?", [id]);
    res.json({ success: true, message: "Módulo e suas aulas excluídos com sucesso!" });
  } catch (err) {
    console.error("Erro ao excluir módulo:", err);
    res.status(500).json({ error: "Erro ao excluir módulo", details: err.message });
  }
});

// AULAS E RECURSOS DIDÁTICOS
router.post("/api/admin/lessons", upload.single("attachment"), async (req, res) => {
  try {
    const {
      module_id,
      course_id,
      title,
      description,
      content_type,
      video_url,
      video_drive_url,
      text_content,
      duration_minutes,
      order_index,
      is_free_preview,
      attachment_url
    } = req.body;

    if (!course_id || !title) {
      return res.status(400).json({ error: "ID do curso e título da aula são obrigatórios." });
    }

    let fileUrl = attachment_url || "";
    let fileName = "";
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
    }

    const [result] = await db.query(
      `INSERT INTO course_lessons 
        (module_id, course_id, title, description, content_type, video_url, video_drive_url, attachment_url, attachment_name, text_content, duration_minutes, order_index, is_free_preview)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [
        module_id ? parseInt(module_id, 10) : null,
        parseInt(course_id, 10),
        title.trim(),
        description || "",
        content_type || "video",
        video_url || "",
        video_drive_url || "",
        fileUrl,
        fileName,
        text_content || "",
        parseInt(duration_minutes, 10) || 0,
        parseInt(order_index, 10) || 1,
        is_free_preview === "true" || is_free_preview === true
      ]
    );

    res.status(201).json({ success: true, id: result.insertId, message: "Aula adicionada com sucesso!" });
  } catch (err) {
    console.error("Erro ao adicionar aula:", err);
    res.status(500).json({ error: "Erro ao adicionar aula", details: err.message });
  }
});

router.put("/api/admin/lessons/:id", upload.single("attachment"), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      module_id,
      title,
      description,
      content_type,
      video_url,
      video_drive_url,
      text_content,
      duration_minutes,
      order_index,
      is_free_preview,
      attachment_url
    } = req.body;

    let fileUrl = attachment_url;
    let fileName = "";
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
    }

    let updateQuery = `
      UPDATE course_lessons SET
        module_id = ?,
        title = ?,
        description = ?,
        content_type = ?,
        video_url = ?,
        video_drive_url = ?,
        text_content = ?,
        duration_minutes = ?,
        order_index = ?,
        is_free_preview = ?
    `;
    const params = [
      module_id ? parseInt(module_id, 10) : null,
      title,
      description || "",
      content_type || "video",
      video_url || "",
      video_drive_url || "",
      text_content || "",
      parseInt(duration_minutes, 10) || 0,
      parseInt(order_index, 10) || 1,
      is_free_preview === "true" || is_free_preview === true
    ];

    if (fileUrl !== undefined && fileUrl !== null) {
      updateQuery += `, attachment_url = ?`;
      params.push(fileUrl);
      if (fileName) {
        updateQuery += `, attachment_name = ?`;
        params.push(fileName);
      }
    }

    updateQuery += ` WHERE id = ?`;
    params.push(id);

    await db.query(updateQuery, params);
    res.json({ success: true, message: "Aula atualizada com sucesso!" });
  } catch (err) {
    console.error("Erro ao atualizar aula:", err);
    res.status(500).json({ error: "Erro ao atualizar aula", details: err.message });
  }
});

router.delete("/api/admin/lessons/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM course_lessons WHERE id = ?", [id]);
    res.json({ success: true, message: "Aula eliminada com sucesso!" });
  } catch (err) {
    console.error("Erro ao excluir aula:", err);
    res.status(500).json({ error: "Erro ao excluir aula", details: err.message });
  }
});

// =========================================================================
// 4. GESTÃO DE AVALIAÇÕES, SALAS DE EXAME E BANCO DE QUESTÕES
// =========================================================================
router.get("/api/admin/exams", async (req, res) => {
  try {
    const [exams] = await db.query(`
      SELECT 
        e.*,
        c.title as course_title,
        (SELECT COUNT(*)::int FROM exam_questions q WHERE q.roomid = e.id) as total_questions,
        (SELECT COUNT(*)::int FROM exam_attempts a WHERE a.exam_id = e.id) as total_attempts
      FROM exam_classes e
      LEFT JOIN courses c ON c.id = e.courseid
      ORDER BY e.id DESC
    `);
    res.json(exams);
  } catch (err) {
    console.error("Erro ao listar exames:", err);
    res.status(500).json({ error: "Erro ao listar exames", details: err.message });
  }
});

router.post("/api/admin/exams", async (req, res) => {
  try {
    const { courseId, roomName, description, time_limit_minutes, passing_score, status, ownerId } = req.body;
    if (!courseId || !roomName) {
      return res.status(400).json({ error: "Curso e nome da avaliação são obrigatórios." });
    }

    const [result] = await db.query(
      `INSERT INTO exam_classes (courseId, roomName, ownerId, description, time_limit_minutes, passing_score, status)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [
        parseInt(courseId, 10),
        roomName.trim(),
        ownerId ? parseInt(ownerId, 10) : null,
        description || "",
        parseInt(time_limit_minutes, 10) || 60,
        parseFloat(passing_score) || 50.0,
        status || "ativo"
      ]
    );

    res.status(201).json({ success: true, id: result.insertId, message: "Avaliação/Simulado criado com sucesso!" });
  } catch (err) {
    console.error("Erro ao criar exame:", err);
    res.status(500).json({ error: "Erro ao criar exame", details: err.message });
  }
});

router.put("/api/admin/exams/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { courseId, roomName, description, time_limit_minutes, passing_score, status } = req.body;

    await db.query(
      `UPDATE exam_classes SET
        courseId = ?,
        roomName = ?,
        description = ?,
        time_limit_minutes = ?,
        passing_score = ?,
        status = ?
       WHERE id = ?`,
      [
        parseInt(courseId, 10),
        roomName,
        description || "",
        parseInt(time_limit_minutes, 10) || 60,
        parseFloat(passing_score) || 50.0,
        status || "ativo",
        id
      ]
    );

    res.json({ success: true, message: "Avaliação atualizada com sucesso!" });
  } catch (err) {
    console.error("Erro ao atualizar exame:", err);
    res.status(500).json({ error: "Erro ao atualizar exame", details: err.message });
  }
});

router.delete("/api/admin/exams/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM exam_classes WHERE id = ?", [id]);
    res.json({ success: true, message: "Avaliação e questões associadas excluídas com sucesso!" });
  } catch (err) {
    console.error("Erro ao excluir exame:", err);
    res.status(500).json({ error: "Erro ao excluir exame", details: err.message });
  }
});

// BANCO DE QUESTÕES
router.get("/api/admin/questions", async (req, res) => {
  try {
    const { roomId, q, disciplina } = req.query;
    let query = `
      SELECT 
        q.*,
        e.roomname,
        c.title as course_title
      FROM exam_questions q
      LEFT JOIN exam_classes e ON e.id = q.roomid
      LEFT JOIN courses c ON c.id = e.courseid
      WHERE 1=1
    `;
    const params = [];

    if (roomId) {
      params.push(parseInt(roomId, 10));
      query += ` AND q.roomid = $${params.length}`;
    }
    if (disciplina) {
      params.push(disciplina);
      query += ` AND q.disciplina = $${params.length}`;
    }
    if (q) {
      params.push(`%${q}%`);
      query += ` AND (q.question ILIKE $${params.length} OR q.tema ILIKE $${params.length} OR q.disciplina ILIKE $${params.length})`;
    }

    query += ` ORDER BY q.id DESC`;

    const result = await db.rawPool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao listar questões:", err);
    res.status(500).json({ error: "Erro ao listar questões", details: err.message });
  }
});

router.post("/api/admin/questions", async (req, res) => {
  try {
    const {
      roomId,
      question,
      correctAnswer,
      wrongAnswer1,
      wrongAnswer2,
      wrongAnswer3,
      wrongAnswer4,
      tema,
      disciplina,
      points,
      explanation,
      ownerId
    } = req.body;

    if (!roomId || !question || !correctAnswer) {
      return res.status(400).json({ error: "Sala/Exame, enunciado da pergunta e resposta correta são obrigatórios." });
    }

    const [result] = await db.query(
      `INSERT INTO exam_questions 
        (roomId, question, correctAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3, wrongAnswer4, tema, disciplina, points, explanation, ownerId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [
        parseInt(roomId, 10),
        question.trim(),
        correctAnswer.trim(),
        wrongAnswer1 ? wrongAnswer1.trim() : "",
        wrongAnswer2 ? wrongAnswer2.trim() : "",
        wrongAnswer3 ? wrongAnswer3.trim() : "",
        wrongAnswer4 ? wrongAnswer4.trim() : "",
        tema || "",
        disciplina || "",
        parseFloat(points) || 1.0,
        explanation || "",
        ownerId ? parseInt(ownerId, 10) : null
      ]
    );

    res.status(201).json({ success: true, id: result.insertId, message: "Pergunta cadastrada com sucesso!" });
  } catch (err) {
    console.error("Erro ao cadastrar pergunta:", err);
    res.status(500).json({ error: "Erro ao cadastrar pergunta", details: err.message });
  }
});

router.put("/api/admin/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      roomId,
      question,
      correctAnswer,
      wrongAnswer1,
      wrongAnswer2,
      wrongAnswer3,
      wrongAnswer4,
      tema,
      disciplina,
      points,
      explanation
    } = req.body;

    await db.query(
      `UPDATE exam_questions SET
        roomId = ?,
        question = ?,
        correctAnswer = ?,
        wrongAnswer1 = ?,
        wrongAnswer2 = ?,
        wrongAnswer3 = ?,
        wrongAnswer4 = ?,
        tema = ?,
        disciplina = ?,
        points = ?,
        explanation = ?
       WHERE id = ?`,
      [
        parseInt(roomId, 10),
        question,
        correctAnswer,
        wrongAnswer1 || "",
        wrongAnswer2 || "",
        wrongAnswer3 || "",
        wrongAnswer4 || "",
        tema || "",
        disciplina || "",
        parseFloat(points) || 1.0,
        explanation || "",
        id
      ]
    );

    res.json({ success: true, message: "Pergunta atualizada com sucesso!" });
  } catch (err) {
    console.error("Erro ao atualizar pergunta:", err);
    res.status(500).json({ error: "Erro ao atualizar pergunta", details: err.message });
  }
});

router.delete("/api/admin/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM exam_questions WHERE id = ?", [id]);
    res.json({ success: true, message: "Pergunta eliminada com sucesso!" });
  } catch (err) {
    console.error("Erro ao eliminar pergunta:", err);
    res.status(500).json({ error: "Erro ao eliminar pergunta", details: err.message });
  }
});

// =========================================================================
// 5. GESTÃO DE ALUNOS E USUÁRIOS (CADASTRO, BLOQUEIO, DETALHES)
// =========================================================================
router.get("/api/admin/students", async (req, res) => {
  try {
    const { q, status, role } = req.query;
    let query = `
      SELECT 
        u.id, u.name, u.emailOrPhone, u.accountType, u.role, u.status, u.phone, u.bio, u.avatar, u.created_at,
        (SELECT COUNT(*)::int FROM compras c WHERE c.user_id = u.id AND c.status = 'ativa') as enrolled_courses,
        (SELECT COUNT(*)::int FROM certificates cert WHERE cert.user_id = u.id) as certificates_count
      FROM users u
      WHERE 1=1
    `;
    const params = [];

    if (role && role !== "todos") {
      params.push(role);
      query += ` AND (u.role ILIKE $${params.length} OR u.accountType ILIKE $${params.length})`;
    } else {
      // Por padrão foca em estudantes se não for especificado
      query += ` AND (u.role = 'Estudante' OR u.accountType = 'estudante')`;
    }

    if (status && status !== "todos") {
      params.push(status);
      query += ` AND u.status = $${params.length}`;
    }

    if (q) {
      params.push(`%${q}%`);
      query += ` AND (u.name ILIKE $${params.length} OR u.emailOrPhone ILIKE $${params.length} OR u.phone ILIKE $${params.length})`;
    }

    query += ` ORDER BY u.id DESC`;

    const result = await db.rawPool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao listar alunos:", err);
    res.status(500).json({ error: "Erro ao listar alunos", details: err.message });
  }
});

router.post("/api/admin/students", upload.single("avatar"), async (req, res) => {
  try {
    const { name, emailOrPhone, password, phone, bio, status, role, accountType } = req.body;
    const avatar = req.file ? `/uploads/${req.file.filename}` : (req.body.avatar || null);

    if (!name || !emailOrPhone || !password) {
      return res.status(400).json({ error: "Nome, e-mail/telefone e senha são obrigatórios." });
    }

    // Verificar se já existe
    const [existing] = await db.query("SELECT id FROM users WHERE emailOrPhone = ?", [emailOrPhone]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Já existe um usuário cadastrado com este e-mail ou telefone." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || "Estudante";
    const userType = accountType || "estudante";

    const [result] = await db.query(
      `INSERT INTO users (name, emailOrPhone, password, role, accountType, status, phone, bio, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [name.trim(), emailOrPhone.trim(), hashedPassword, userRole, userType, status || "ativo", phone || "", bio || "", avatar]
    );

    res.status(201).json({ success: true, id: result.insertId, message: "Aluno cadastrado com sucesso!" });
  } catch (err) {
    console.error("Erro ao cadastrar aluno:", err);
    res.status(500).json({ error: "Erro ao cadastrar aluno", details: err.message });
  }
});

router.put("/api/admin/students/:id", upload.single("avatar"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, emailOrPhone, password, phone, bio, status, role, accountType } = req.body;
    const avatar = req.file ? `/uploads/${req.file.filename}` : req.body.avatar;

    let updateQuery = `
      UPDATE users SET 
        name = ?, 
        emailOrPhone = ?, 
        phone = ?, 
        bio = ?, 
        status = ?, 
        role = ?, 
        accountType = ?
    `;
    const params = [
      name,
      emailOrPhone,
      phone || "",
      bio || "",
      status || "ativo",
      role || "Estudante",
      accountType || "estudante"
    ];

    if (avatar !== undefined) {
      updateQuery += `, avatar = ?`;
      params.push(avatar ? String(avatar).trim() : null);
    }

    if (password && password.trim().length > 0) {
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      updateQuery += `, password = ?`;
      params.push(hashedPassword);
    }

    updateQuery += ` WHERE id = ?`;
    params.push(id);

    await db.query(updateQuery, params);
    res.json({ success: true, message: "Dados do aluno atualizados com sucesso!" });
  } catch (err) {
    console.error("Erro ao atualizar aluno:", err);
    res.status(500).json({ error: "Erro ao atualizar aluno", details: err.message });
  }
});

router.patch("/api/admin/students/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ativo", "bloqueado"].includes(status)) {
      return res.status(400).json({ error: "Status inválido. Escolha 'ativo' ou 'bloqueado'." });
    }

    await db.query("UPDATE users SET status = ? WHERE id = ?", [status, id]);
    res.json({ success: true, message: `Status do aluno alterado para '${status}' com sucesso!` });
  } catch (err) {
    console.error("Erro ao alterar status:", err);
    res.status(500).json({ error: "Erro ao alterar status", details: err.message });
  }
});

router.delete("/api/admin/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ success: true, message: "Aluno eliminado com sucesso!" });
  } catch (err) {
    console.error("Erro ao eliminar aluno:", err);
    res.status(500).json({ error: "Erro ao eliminar aluno", details: err.message });
  }
});

// Detalhes completos do aluno (cursos, progresso, notas)
router.get("/api/admin/students/:id/overview", async (req, res) => {
  try {
    const { id } = req.params;
    const [userRows] = await db.query("SELECT id, name, emailOrPhone, role, accountType, status, phone, bio, created_at FROM users WHERE id = ?", [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: "Aluno não encontrado" });
    }

    // Cursos matriculados
    const [courses] = await db.query(`
      SELECT m.id as enrollment_id, m.status as enrollment_status, m.data_compra, m.data_expiracao, m.progress,
             c.id as course_id, c.title as course_title, c.price as course_price, c.duration, c.thumbnail
      FROM compras m
      JOIN courses c ON c.id = m.curso_id
      WHERE m.user_id = ?
      ORDER BY m.id DESC
    `, [id]);

    // Aulas concluídas
    const [completedLessons] = await db.query(`
      SELECT lp.completed_at, l.title as lesson_title, l.content_type, c.title as course_title
      FROM lesson_progress lp
      JOIN course_lessons l ON l.id = lp.lesson_id
      JOIN courses c ON c.id = lp.course_id
      WHERE lp.user_id = ?
      ORDER BY lp.completed_at DESC
    `, [id]);

    // Resultados de avaliações
    const [examResults] = await db.query(`
      SELECT a.*, e.roomname, c.title as course_title
      FROM exam_attempts a
      JOIN exam_classes e ON e.id = a.exam_id
      LEFT JOIN courses c ON c.id = a.course_id
      WHERE a.user_id = ?
      ORDER BY a.completed_at DESC
    `, [id]);

    // Certificados
    const [certificates] = await db.query(`
      SELECT cert.*, c.title as course_title
      FROM certificates cert
      JOIN courses c ON c.id = cert.course_id
      WHERE cert.user_id = ?
      ORDER BY cert.issued_at DESC
    `, [id]);

    res.json({
      student: userRows[0],
      courses,
      completedLessons,
      examResults,
      certificates
    });
  } catch (err) {
    console.error("Erro ao obter visão geral do aluno:", err);
    res.status(500).json({ error: "Erro ao obter detalhes do aluno", details: err.message });
  }
});

// =========================================================================
// 6. GESTÃO DE MATRÍCULAS (MANUAL, APROVAÇÃO, STATUS)
// =========================================================================
router.get("/api/admin/enrollments", async (req, res) => {
  try {
    const { status, q } = req.query;
    let query = `
      SELECT 
        m.id, m.user_id, m.curso_id, m.data_compra, m.data_expiracao, m.status, m.progress, m.updated_at,
        u.name as student_name, u.emailOrPhone as student_email, u.phone as student_phone,
        c.title as course_title, c.price as course_price, c.duration as course_duration
      FROM compras m
      LEFT JOIN users u ON u.id = m.user_id
      LEFT JOIN courses c ON c.id = m.curso_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== "todos") {
      params.push(status);
      query += ` AND m.status = $${params.length}`;
    }
    if (q) {
      params.push(`%${q}%`);
      query += ` AND (u.name ILIKE $${params.length} OR u.emailOrPhone ILIKE $${params.length} OR c.title ILIKE $${params.length})`;
    }

    query += ` ORDER BY m.id DESC`;

    const result = await db.rawPool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao listar matrículas:", err);
    res.status(500).json({ error: "Erro ao listar matrículas", details: err.message });
  }
});

router.post("/api/admin/enrollments", async (req, res) => {
  try {
    const { user_id, curso_id, data_expiracao, status } = req.body;
    if (!user_id || !curso_id) {
      return res.status(400).json({ error: "Selecione o aluno e o curso para matricular." });
    }

    // Verificar se já está matriculado
    const [existing] = await db.query(
      "SELECT id, status FROM compras WHERE user_id = ? AND curso_id = ?",
      [user_id, curso_id]
    );

    if (existing.length > 0) {
      // Reativa matrícula se estava inativa
      await db.query(
        "UPDATE compras SET status = 'ativa', data_expiracao = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [data_expiracao || null, existing[0].id]
      );
      return res.json({ success: true, message: "Matrícula do aluno reativada com sucesso!" });
    }

    const [result] = await db.query(
      `INSERT INTO compras (user_id, curso_id, data_expiracao, status)
       VALUES (?, ?, ?, ?) RETURNING id`,
      [
        parseInt(user_id, 10),
        parseInt(curso_id, 10),
        data_expiracao || null,
        status || "ativa"
      ]
    );

    res.status(201).json({ success: true, id: result.insertId, message: "Aluno matriculado no curso com sucesso!" });
  } catch (err) {
    console.error("Erro ao matricular aluno:", err);
    res.status(500).json({ error: "Erro ao matricular aluno", details: err.message });
  }
});

router.put("/api/admin/enrollments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, data_expiracao, progress } = req.body;

    await db.query(
      `UPDATE compras SET 
        status = ?, 
        data_expiracao = ?, 
        progress = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status || "ativa", data_expiracao || null, parseInt(progress, 10) || 0, id]
    );

    res.json({ success: true, message: "Matrícula atualizada com sucesso!" });
  } catch (err) {
    console.error("Erro ao atualizar matrícula:", err);
    res.status(500).json({ error: "Erro ao atualizar matrícula", details: err.message });
  }
});

router.patch("/api/admin/enrollments/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ativa", "pendente", "cancelada", "expirada"].includes(status)) {
      return res.status(400).json({ error: "Status inválido." });
    }

    await db.query("UPDATE compras SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [status, id]);
    res.json({ success: true, message: `Status da matrícula alterado para '${status}'!` });
  } catch (err) {
    console.error("Erro ao alterar status da matrícula:", err);
    res.status(500).json({ error: "Erro ao alterar status da matrícula", details: err.message });
  }
});

router.delete("/api/admin/enrollments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM compras WHERE id = ?", [id]);
    res.json({ success: true, message: "Matrícula eliminada com sucesso!" });
  } catch (err) {
    console.error("Erro ao eliminar matrícula:", err);
    res.status(500).json({ error: "Erro ao eliminar matrícula", details: err.message });
  }
});

// =========================================================================
// 7. ACOMPANHAMENTO DE PROGRESSO E RESULTADOS DAS AVALIAÇÕES
// =========================================================================
router.get("/api/admin/progress", async (req, res) => {
  try {
    const { courseId } = req.query;
    let query = `
      SELECT 
        m.user_id,
        m.curso_id,
        m.status as enrollment_status,
        u.name as student_name,
        u.emailOrPhone as student_email,
        c.title as course_title,
        (SELECT COUNT(*)::int FROM course_lessons l WHERE l.course_id = m.curso_id) as total_lessons,
        (SELECT COUNT(*)::int FROM lesson_progress lp WHERE lp.user_id = m.user_id AND lp.course_id = m.curso_id AND lp.completed = TRUE) as completed_lessons,
        (SELECT MAX(completed_at) FROM lesson_progress lp WHERE lp.user_id = m.user_id AND lp.course_id = m.curso_id) as last_activity
      FROM compras m
      JOIN users u ON u.id = m.user_id
      JOIN courses c ON c.id = m.curso_id
      WHERE 1=1
    `;
    const params = [];

    if (courseId) {
      params.push(parseInt(courseId, 10));
      query += ` AND m.curso_id = $${params.length}`;
    }

    query += ` ORDER BY m.id DESC`;

    const result = await db.rawPool.query(query, params);
    const formatted = result.rows.map(row => {
      const total = row.total_lessons || 0;
      const completed = row.completed_lessons || 0;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        ...row,
        progress_percent: percent
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("Erro ao carregar progresso:", err);
    res.status(500).json({ error: "Erro ao carregar progresso", details: err.message });
  }
});

router.get("/api/admin/exam-results", async (req, res) => {
  try {
    const { examId, userId } = req.query;
    let query = `
      SELECT 
        a.*,
        u.name as student_name,
        u.emailOrPhone as student_email,
        e.roomname as exam_title,
        c.title as course_title
      FROM exam_attempts a
      JOIN users u ON u.id = a.user_id
      JOIN exam_classes e ON e.id = a.exam_id
      LEFT JOIN courses c ON c.id = a.course_id
      WHERE 1=1
    `;
    const params = [];

    if (examId) {
      params.push(parseInt(examId, 10));
      query += ` AND a.exam_id = $${params.length}`;
    }
    if (userId) {
      params.push(parseInt(userId, 10));
      query += ` AND a.user_id = $${params.length}`;
    }

    query += ` ORDER BY a.id DESC`;

    const result = await db.rawPool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao listar resultados de exames:", err);
    res.status(500).json({ error: "Erro ao listar resultados", details: err.message });
  }
});

// =========================================================================
// 8. GESTÃO DE CERTIFICADOS DE CONCLUSÃO
// =========================================================================
router.get("/api/admin/certificates", async (req, res) => {
  try {
    const [certificates] = await db.query(`
      SELECT 
        cert.*,
        u.name as student_name,
        u.emailOrPhone as student_email,
        c.title as course_title,
        c.workload_hours as course_workload
      FROM certificates cert
      JOIN users u ON u.id = cert.user_id
      JOIN courses c ON c.id = cert.course_id
      ORDER BY cert.id DESC
    `);
    res.json(certificates);
  } catch (err) {
    console.error("Erro ao listar certificados:", err);
    res.status(500).json({ error: "Erro ao listar certificados", details: err.message });
  }
});

router.post("/api/admin/certificates", async (req, res) => {
  try {
    const { user_id, course_id, grade, workload_hours } = req.body;
    if (!user_id || !course_id) {
      return res.status(400).json({ error: "Aluno e Curso são obrigatórios para emitir o certificado." });
    }

    // Verificar se já existe certificado emitido para este aluno e curso
    const [existing] = await db.query(
      "SELECT id, code FROM certificates WHERE user_id = ? AND course_id = ?",
      [user_id, course_id]
    );

    if (existing.length > 0) {
      return res.json({
        success: true,
        message: "Certificado já havia sido emitido anteriormente para este aluno e curso.",
        certificate: existing[0]
      });
    }

    // Gerar código único de autenticidade (ex: PREP-A1B2-C3D4)
    const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();
    const code = `PREP-${Date.now().toString().slice(-4)}-${randomHex}`;

    const [result] = await db.query(
      `INSERT INTO certificates (code, user_id, course_id, grade, workload_hours, status)
       VALUES (?, ?, ?, ?, ?, 'valido') RETURNING id`,
      [
        code,
        parseInt(user_id, 10),
        parseInt(course_id, 10),
        parseFloat(grade) || 100.0,
        workload_hours || "40h"
      ]
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      code,
      message: "Certificado emitido com sucesso!"
    });
  } catch (err) {
    console.error("Erro ao emitir certificado:", err);
    res.status(500).json({ error: "Erro ao emitir certificado", details: err.message });
  }
});

router.delete("/api/admin/certificates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM certificates WHERE id = ?", [id]);
    res.json({ success: true, message: "Certificado revogado/eliminado com sucesso!" });
  } catch (err) {
    console.error("Erro ao eliminar certificado:", err);
    res.status(500).json({ error: "Erro ao eliminar certificado", details: err.message });
  }
});

// Consulta pública de autenticidade do certificado
router.get("/api/certificates/validate/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const [rows] = await db.query(`
      SELECT 
        cert.*,
        u.name as student_name,
        c.title as course_title,
        c.duration,
        c.workload_hours
      FROM certificates cert
      JOIN users u ON u.id = cert.user_id
      JOIN courses c ON c.id = cert.course_id
      WHERE cert.code = ?
    `, [code.trim().toUpperCase()]);

    if (rows.length === 0) {
      return res.status(404).json({ valid: false, error: "Certificado não encontrado ou código inválido." });
    }

    res.json({ valid: true, certificate: rows[0] });
  } catch (err) {
    console.error("Erro ao validar certificado:", err);
    res.status(500).json({ error: "Erro ao validar certificado", details: err.message });
  }
});

// =========================================================================
// 9. GESTÃO DE CATEGORIAS E SUBCATEGORIAS
// =========================================================================
router.get("/api/admin/categories", async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT 
        cat.*,
        (SELECT COUNT(*)::int FROM courses c WHERE c.category = cat.name) as total_courses
      FROM categories cat
      ORDER BY cat.name ASC
    `);
    res.json(categories);
  } catch (err) {
    console.error("Erro ao listar categorias:", err);
    res.status(500).json({ error: "Erro ao listar categorias", details: err.message });
  }
});

router.post("/api/admin/categories", async (req, res) => {
  try {
    const { name, description, icon, parent_id } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Nome da categoria é obrigatório." });
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const [result] = await db.query(
      `INSERT INTO categories (name, slug, description, icon, parent_id)
       VALUES (?, ?, ?, ?, ?) RETURNING id`,
      [name.trim(), slug, description || "", icon || "fa-folder", parent_id ? parseInt(parent_id, 10) : null]
    );

    res.status(201).json({ success: true, id: result.insertId, message: "Categoria criada com sucesso!" });
  } catch (err) {
    console.error("Erro ao criar categoria:", err);
    res.status(500).json({ error: "Erro ao criar categoria", details: err.message });
  }
});

router.put("/api/admin/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, parent_id } = req.body;

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    await db.query(
      `UPDATE categories SET name = ?, slug = ?, description = ?, icon = ?, parent_id = ? WHERE id = ?`,
      [name.trim(), slug, description || "", icon || "fa-folder", parent_id ? parseInt(parent_id, 10) : null, id]
    );

    res.json({ success: true, message: "Categoria atualizada com sucesso!" });
  } catch (err) {
    console.error("Erro ao atualizar categoria:", err);
    res.status(500).json({ error: "Erro ao atualizar categoria", details: err.message });
  }
});

router.delete("/api/admin/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM categories WHERE id = ?", [id]);
    res.json({ success: true, message: "Categoria eliminada com sucesso!" });
  } catch (err) {
    console.error("Erro ao eliminar categoria:", err);
    res.status(500).json({ error: "Erro ao eliminar categoria", details: err.message });
  }
});

// =========================================================================
// 10. GESTÃO DE INSTRUTORES
// =========================================================================
router.get("/api/admin/instructors", async (req, res) => {
  try {
    const [instructors] = await db.query(`
      SELECT 
        u.id, u.name, u.emailOrPhone, u.role, u.accountType, u.phone, u.bio, u.avatar, u.status, u.created_at,
        (SELECT COUNT(*)::int FROM courses c WHERE c.instructor_id = u.id) as assigned_courses
      FROM users u
      WHERE u.role = 'Instrutor' OR u.accountType = 'instrutor' OR u.accountType = 'preparatorio'
      ORDER BY u.name ASC
    `);
    res.json(instructors);
  } catch (err) {
    console.error("Erro ao listar instrutores:", err);
    res.status(500).json({ error: "Erro ao listar instrutores", details: err.message });
  }
});

router.post("/api/admin/instructors", upload.single("avatar"), async (req, res) => {
  try {
    const { name, emailOrPhone, password, phone, bio } = req.body;
    const avatar = req.file ? `/uploads/${req.file.filename}` : (req.body.avatar || null);

    if (!name || !emailOrPhone || !password) {
      return res.status(400).json({ error: "Nome, e-mail/telefone e senha são obrigatórios." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO users (name, emailOrPhone, password, role, accountType, status, phone, bio, avatar)
       VALUES (?, ?, ?, 'Instrutor', 'instrutor', 'ativo', ?, ?, ?) RETURNING id`,
      [name.trim(), emailOrPhone.trim(), hashedPassword, phone || "", bio || "", avatar]
    );

    res.status(201).json({ success: true, id: result.insertId, message: "Instrutor cadastrado com sucesso!" });
  } catch (err) {
    console.error("Erro ao cadastrar instrutor:", err);
    res.status(500).json({ error: "Erro ao cadastrar instrutor", details: err.message });
  }
});

router.put("/api/admin/instructors/:id", upload.single("avatar"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, emailOrPhone, password, phone, bio, status } = req.body;
    const avatar = req.file ? `/uploads/${req.file.filename}` : req.body.avatar;

    if (!name || !emailOrPhone) {
      return res.status(400).json({ error: "Nome e e-mail/telefone são obrigatórios." });
    }

    let updateQuery = `
      UPDATE users SET 
        name = ?, 
        emailOrPhone = ?, 
        phone = ?, 
        bio = ?, 
        status = ?
    `;
    const params = [
      name.trim(),
      emailOrPhone.trim(),
      phone || "",
      bio || "",
      status || "ativo"
    ];

    if (avatar !== undefined) {
      updateQuery += `, avatar = ?`;
      params.push(avatar ? String(avatar).trim() : null);
    }

    if (password && password.trim().length > 0) {
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      updateQuery += `, password = ?`;
      params.push(hashedPassword);
    }

    updateQuery += ` WHERE id = ?`;
    params.push(id);

    await db.query(updateQuery, params);
    res.json({ success: true, message: "Dados do instrutor atualizados com sucesso!" });
  } catch (err) {
    console.error("Erro ao atualizar instrutor:", err);
    res.status(500).json({ error: "Erro ao atualizar instrutor", details: err.message });
  }
});

router.delete("/api/admin/instructors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ success: true, message: "Instrutor removido com sucesso!" });
  } catch (err) {
    console.error("Erro ao eliminar instrutor:", err);
    res.status(500).json({ error: "Erro ao eliminar instrutor", details: err.message });
  }
});

// =========================================================================
// 11. GESTÃO DE CONTEÚDOS E ARQUIVOS (UPLOAD CENTRALIZADO)
// =========================================================================
router.post("/api/admin/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (err) {
    console.error("Erro no upload:", err);
    res.status(500).json({ error: "Erro ao processar upload", details: err.message });
  }
});

// =========================================================================
// 12. CONFIGURAÇÕES DA PLATAFORMA (DADOS GERAIS, PAGAMENTOS, CONTATOS E REDES)
// =========================================================================

const DEFAULT_SETTINGS = {
  platform_name: "prepUni - Plataforma LMS",
  contact_email: "contato@prepuni.com",
  support_phone: "+244 941 908 927",
  support_whatsapp: "5581997570784",
  payment_whatsapp: "5581997570784",
  bna_iban: "0040.0000.3762.4337.1015.4",
  bna_express: "941908927",
  currency_symbol: "Kz",
  allow_registration: true,
  certificate_min_score: 70,
  whatsapp_display: "(81) 99757-0784",
  whatsapp_message: "Olá, preciso de ajuda!",
  whatsapp_description: "Atendimento rápido e suporte a dúvidas sobre cursos e matrículas.",
  instagram_url: "https://www.instagram.com/estoupreparadoconcursos/",
  instagram_handle: "@estoupreparadoconcursos",
  instagram_description: "Acompanhe dicas diárias, notícias de editais e lives exclusivas.",
  youtube_url: "https://www.youtube.com/user/isaqueljoao",
  youtube_title: "Preparatório Universitário Oficial",
  youtube_description: "Aulas gratuitas, correções de provas e análises de bancas.",
  location_title: "Unidade Física",
  location_address: "Limoeiro / Recife - PE",
  location_description: "Cursos e simulados presenciais no estado de Pernambuco.",
  location_link: "/CoursesPage",
  location_button_text: "Ver Cursos Presenciais",
  facebook_url: "https://www.facebook.com",
  banner_title: "A tua aprovação é a nossa missão!",
  banner_subtitle: "Junta-te à melhor academia de preparação universitária"
};

// Migração segura e automática das colunas de configurações da plataforma
async function ensurePlatformSettingsColumns() {
  try {
    const columns = [
      "ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS whatsapp_display VARCHAR(100) DEFAULT '(81) 99757-0784'",
      "ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS whatsapp_message TEXT DEFAULT 'Olá, preciso de ajuda!'",
      "ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS whatsapp_description TEXT DEFAULT 'Atendimento rápido e suporte a dúvidas sobre cursos e matrículas.'",
      "ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255) DEFAULT 'https://www.instagram.com/estoupreparadoconcursos/'",
      "ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR(100) DEFAULT '@estoupreparadoconcursos'",
      "ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS instagram_description TEXT DEFAULT 'Acompanhe dicas diárias, notícias de editais e lives exclusivas.'",
      "ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(255) DEFAULT 'https://www.youtube.com/user/isaqueljoao'",
      "ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS youtube_title VARCHAR(150) DEFAULT 'Preparatório Universitário Oficial'",
      "ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS youtube_description TEXT DEFAULT 'Aulas gratuitas, correções de provas e análises de bancas.'",
      "ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS location_title VARCHAR(100) DEFAULT 'Unidade Física'",
      "ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS location_address VARCHAR(255) DEFAULT 'Limoeiro / Recife - PE'",
      "ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS location_description TEXT DEFAULT 'Cursos e simulados presenciais no estado de Pernambuco.'",
      "ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS location_link VARCHAR(255) DEFAULT '/CoursesPage'",
      "ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS location_button_text VARCHAR(100) DEFAULT 'Ver Cursos Presenciais'",
      "ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255) DEFAULT 'https://www.facebook.com'",
      "ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS banner_title VARCHAR(255) DEFAULT 'A tua aprovação é a nossa missão!'",
      "ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS banner_subtitle TEXT DEFAULT 'Junta-te à melhor academia de preparação universitária'"
    ];
    for (const sql of columns) {
      await db.rawPool.query(sql);
    }
  } catch (err) {
    console.warn("Aviso ao verificar/migrar colunas de platform_settings:", err.message);
  }
}
ensurePlatformSettingsColumns();

// Rota pública para consultar configurações (usada em Contato, Rodapé, Navbar, etc.)
router.get("/api/settings", async (req, res) => {
  try {
    const [settings] = await db.query("SELECT * FROM platform_settings WHERE id = 1");
    if (!settings || settings.length === 0) {
      return res.json(DEFAULT_SETTINGS);
    }
    res.json({ ...DEFAULT_SETTINGS, ...settings[0] });
  } catch (err) {
    console.error("Erro ao buscar configurações públicas:", err);
    res.json(DEFAULT_SETTINGS);
  }
});

router.get("/api/admin/settings", async (req, res) => {
  try {
    const [settings] = await db.query("SELECT * FROM platform_settings WHERE id = 1");
    if (!settings || settings.length === 0) {
      return res.json(DEFAULT_SETTINGS);
    }
    res.json({ ...DEFAULT_SETTINGS, ...settings[0] });
  } catch (err) {
    console.error("Erro ao buscar configurações:", err);
    res.status(500).json({ error: "Erro ao buscar configurações", details: err.message });
  }
});

router.put("/api/admin/settings", async (req, res) => {
  try {
    const {
      platform_name,
      contact_email,
      support_phone,
      support_whatsapp,
      payment_whatsapp,
      bna_iban,
      bna_express,
      currency_symbol,
      allow_registration,
      certificate_min_score,
      whatsapp_display,
      whatsapp_message,
      whatsapp_description,
      instagram_url,
      instagram_handle,
      instagram_description,
      youtube_url,
      youtube_title,
      youtube_description,
      location_title,
      location_address,
      location_description,
      location_link,
      location_button_text,
      facebook_url,
      banner_title,
      banner_subtitle
    } = req.body;

    await db.query(
      `INSERT INTO platform_settings (
         id, platform_name, contact_email, support_phone, support_whatsapp, payment_whatsapp,
         bna_iban, bna_express, currency_symbol, allow_registration, certificate_min_score,
         whatsapp_display, whatsapp_message, whatsapp_description,
         instagram_url, instagram_handle, instagram_description,
         youtube_url, youtube_title, youtube_description,
         location_title, location_address, location_description, location_link, location_button_text,
         facebook_url, banner_title, banner_subtitle, updated_at
       )
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         platform_name = EXCLUDED.platform_name,
         contact_email = EXCLUDED.contact_email,
         support_phone = EXCLUDED.support_phone,
         support_whatsapp = EXCLUDED.support_whatsapp,
         payment_whatsapp = EXCLUDED.payment_whatsapp,
         bna_iban = EXCLUDED.bna_iban,
         bna_express = EXCLUDED.bna_express,
         currency_symbol = EXCLUDED.currency_symbol,
         allow_registration = EXCLUDED.allow_registration,
         certificate_min_score = EXCLUDED.certificate_min_score,
         whatsapp_display = EXCLUDED.whatsapp_display,
         whatsapp_message = EXCLUDED.whatsapp_message,
         whatsapp_description = EXCLUDED.whatsapp_description,
         instagram_url = EXCLUDED.instagram_url,
         instagram_handle = EXCLUDED.instagram_handle,
         instagram_description = EXCLUDED.instagram_description,
         youtube_url = EXCLUDED.youtube_url,
         youtube_title = EXCLUDED.youtube_title,
         youtube_description = EXCLUDED.youtube_description,
         location_title = EXCLUDED.location_title,
         location_address = EXCLUDED.location_address,
         location_description = EXCLUDED.location_description,
         location_link = EXCLUDED.location_link,
         location_button_text = EXCLUDED.location_button_text,
         facebook_url = EXCLUDED.facebook_url,
         banner_title = EXCLUDED.banner_title,
         banner_subtitle = EXCLUDED.banner_subtitle,
         updated_at = CURRENT_TIMESTAMP`,
      [
        platform_name || "prepUni - Plataforma LMS",
        contact_email || "",
        support_phone || "",
        support_whatsapp || "",
        payment_whatsapp || "",
        bna_iban || "",
        bna_express || "",
        currency_symbol || "Kz",
        allow_registration === undefined ? true : allow_registration,
        parseInt(certificate_min_score, 10) || 70,
        whatsapp_display || "(81) 99757-0784",
        whatsapp_message || "Olá, preciso de ajuda!",
        whatsapp_description || "Atendimento rápido e suporte a dúvidas sobre cursos e matrículas.",
        instagram_url || "https://www.instagram.com/estoupreparadoconcursos/",
        instagram_handle || "@estoupreparadoconcursos",
        instagram_description || "Acompanhe dicas diárias, notícias de editais e lives exclusivas.",
        youtube_url || "https://www.youtube.com/user/isaqueljoao",
        youtube_title || "Preparatório Universitário Oficial",
        youtube_description || "Aulas gratuitas, correções de provas e análises de bancas.",
        location_title || "Unidade Física",
        location_address || "Limoeiro / Recife - PE",
        location_description || "Cursos e simulados presenciais no estado de Pernambuco.",
        location_link || "/CoursesPage",
        location_button_text || "Ver Cursos Presenciais",
        facebook_url || "https://www.facebook.com",
        banner_title || "A tua aprovação é a nossa missão!",
        banner_subtitle || "Junta-te à melhor academia de preparação universitária"
      ]
    );

    // Também atualiza tabela bna legada para manter compatibilidade
    if (bna_express || bna_iban) {
      await db.query(
        `INSERT INTO bna (id, express, iban) VALUES (1, ?, ?)
         ON CONFLICT (id) DO UPDATE SET express = EXCLUDED.express, iban = EXCLUDED.iban`,
        [bna_express || "", bna_iban || ""]
      );
    }

    res.json({ success: true, message: "Configurações da plataforma atualizadas com sucesso!" });
  } catch (err) {
    console.error("Erro ao salvar configurações:", err);
    res.status(500).json({ error: "Erro ao salvar configurações", details: err.message });
  }
});

module.exports = router;
