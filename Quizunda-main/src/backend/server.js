const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const db = require('./db');
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require('fs');
const bcrypt = require("bcryptjs");
const router = express.Router();
const axios = require("axios");

const registerRoutes = require("./register.js");
const loginRoutes = require("./login.js");
const adminRoutes = require("./adminRoutes.js");

const app = express();

// 🛡️ Segurança HTTP Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// 🌐 CORS com suporte dinâmico a múltiplos domínios e Vercel previews
const rawCorsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "*";
const allowedOrigins = rawCorsOrigin.split(",").map(o => o.trim().replace(/\/$/, "")).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origem (Postman, mobile, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Se permitir todos (*)
    if (allowedOrigins.includes("*")) return callback(null, true);
    // Se estiver na lista explícita
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Permitir subdomínios Vercel e desenvolvimento local
    if (origin.endsWith(".vercel.app") || origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return callback(null, true);
    }
    return callback(null, true); // Fallback permissivo para evitar bloqueios inesperados de deploy
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Responder imediatamente preflight OPTIONS
app.options("*", cors());

// 🩺 Health check para Render e monitoramento
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "PrepUni API rodando com sucesso 🚀", timestamp: new Date().toISOString() });
});
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ⏳ Rate limiters para proteção contra força bruta
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // limite de 30 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas de autenticação. Tente novamente mais tarde." }
});
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);
app.use("/api/admin/login", authLimiter);



// 🔹 Diretório de uploads centralizado
const uploadsDir = path.resolve(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 🔹 Configuração do multer
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
  limits: { fileSize: 50 * 1024 * 1024 }
});

const JWT_SECRET = process.env.JWT_SECRET || "segredo_super_seguranca";

// 🔹 Middleware de autenticação
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Token não fornecido" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Formato de token inválido" });

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      try {
        decoded = jwt.verify(token, "segredo_jwt");
      } catch (err) {
        return res.status(401).json({ error: "Token inválido ou expirado" });
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("Erro no middleware auth:", err);
    res.status(401).json({ error: "Token inválido" });
  }
};

// 🔹 Middleware para garantir acesso de administrador ou instrutor
const adminOnly = (req, res, next) => {
  const role = (req.user?.role || req.user?.accountType || "").toLowerCase();
  const isAuthorized = ["admin", "instrutor", "instructor", "professor", "preparatorio"].includes(role);
  if (!isAuthorized) {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores e instrutores têm permissão." });
  }
  next();
};

// 🔹 Rota de validação de sessão e perfil do usuário ativo
app.get("/api/auth/me", auth, async (req, res) => {
  try {
    const role = (req.user.role || req.user.accountType || "").toLowerCase();
    const userId = req.user.id;

    if (role === "admin") {
      // 1. Tenta buscar na tabela admin
      const [admins] = await db.query(
        "SELECT id, username, created_at FROM admin WHERE id = ?",
        [userId]
      );
      if (admins && admins.length > 0) {
        return res.json({
          authenticated: true,
          role: "admin",
          accountType: "admin",
          user: {
            id: admins[0].id,
            name: admins[0].username,
            username: admins[0].username,
            emailOrPhone: admins[0].username,
            role: "admin",
            accountType: "admin"
          }
        });
      }
    }

    // 2. Busca na tabela users
    const [users] = await db.query(
      "SELECT id, name, emailOrPhone, accountType, role, status, phone, bio, avatar FROM users WHERE id = ?",
      [userId]
    );

    if (users && users.length > 0) {
      const u = users[0];
      const userRole = (u.accountType === "admin" || (u.role && u.role.toLowerCase() === "admin"))
        ? "admin"
        : (u.accountType || u.role || "estudante").toLowerCase();

      return res.json({
        authenticated: true,
        role: userRole,
        accountType: u.accountType,
        user: {
          id: u.id,
          name: u.name,
          emailOrPhone: u.emailOrPhone,
          role: userRole,
          accountType: u.accountType,
          status: u.status,
          phone: u.phone || "",
          bio: u.bio || "",
          avatar: u.avatar || null
        }
      });
    }

    // Se for admin reconhecido pelo token mas com id customizado
    if (role === "admin") {
      return res.json({
        authenticated: true,
        role: "admin",
        accountType: "admin",
        user: {
          id: req.user.id,
          name: req.user.username || req.user.name || "Administrador",
          username: req.user.username || "admin",
          emailOrPhone: req.user.username || "admin",
          role: "admin",
          accountType: "admin"
        }
      });
    }

    return res.status(401).json({ authenticated: false, error: "Usuário não encontrado." });
  } catch (err) {
    console.error("Erro em /api/auth/me:", err);
    res.status(500).json({ authenticated: false, error: "Erro ao validar sessão." });
  }
});



// 🔹 Rotas de autenticação e administração LMS
app.use("/api", registerRoutes);
app.use("/api", loginRoutes);
app.use(adminRoutes);

// Servir diretório de uploads garantindo cabeçalhos CORS/CORP para o frontend Vercel
const staticUploadsConfig = {
  setHeaders: (res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  }
};
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir, staticUploadsConfig));
const rootUploads = path.resolve(process.cwd(), "uploads");
if (fs.existsSync(rootUploads)) app.use("/uploads", express.static(rootUploads, staticUploadsConfig));


// 🔹 CRUD de cursos
app.get("/api/courses", auth, async (req, res) => {
  try {
    const userRole = (req.user.role || "").toLowerCase();
    const userAccount = (req.user.accountType || "").toLowerCase();
    const isPrivileged = ['admin', 'instrutor', 'instructor', 'professor', 'preparatorio'].includes(userRole) ||
      ['admin', 'instrutor', 'instructor', 'professor', 'preparatorio'].includes(userAccount);
    const query = isPrivileged
      ? "SELECT * FROM courses ORDER BY id DESC"
      : "SELECT * FROM courses WHERE ownerId = ? OR ownerId IS NULL ORDER BY id DESC";
    const params = isPrivileged ? [] : [req.user.id];
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar cursos:", err);
    res.status(500).json({ error: "Erro ao buscar cursos" });
  }
});

// ---------------- CRIAR CURSO ----------------
app.post("/api/courses", auth, upload.single("thumbnail"), async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      duration,
      country,
      account,
      iban,
      express_number,
      details
    } = req.body;

    const thumbnail = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title) return res.status(400).json({ error: "Título é obrigatório" });

    const [result] = await db.query(
      `INSERT INTO courses 
        (title, description, price, duration, country, thumbnail, account, iban, express_number, details, ownerId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || "",
        parseFloat(price) || 0,
        duration,
        country || "",
        thumbnail,
        account || "",
        iban || "",
        express_number || "",
        details || "",
        req.user.id
      ]
    );

    const [course] = await db.query("SELECT * FROM courses WHERE id = ?", [result.insertId]);
    res.json(course[0]);
  } catch (err) {
    console.error("Erro ao criar curso:", err);
    res.status(500).json({ error: "Erro ao criar curso" });
  }
});


// ---------------- EDITAR CURSO ----------------
app.put("/api/courses/:id", auth, upload.single("thumbnail"), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      price,
      duration,
      country,
      account,
      iban,
      express_number,
      details
    } = req.body;

    const thumbnail = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await db.query(
      `UPDATE courses 
       SET title=?, description=?, price=?, duration=?, country=?, thumbnail=?, 
           account=?, iban=?, express_number=?, details=? 
       WHERE id=? AND ownerId=?`,
      [
        title,
        description || "",
        parseFloat(price) || 0,
        duration,
        country || "",
        thumbnail,
        account || "",
        iban || "",
        express_number || "",
        details || "",
        id,
        req.user.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    const [course] = await db.query("SELECT * FROM courses WHERE id = ?", [id]);
    res.json(course[0]);
  } catch (err) {
    console.error("Erro ao atualizar curso:", err);
    res.status(500).json({ error: "Erro ao atualizar curso" });
  }
});



// eliminar cursos
app.delete("/api/courses/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Eliminar perguntas associadas às classes do curso
    await db.query(`
      DELETE FROM exam_questions
      WHERE roomId IN (
        SELECT id
        FROM exam_classes
        WHERE courseId = ?
      )
    `, [id]);

    // Eliminar classes do curso
    await db.query(
      "DELETE FROM exam_classes WHERE courseId = ?",
      [id]
    );

    // Eliminar materiais associados
    await db.query(
      "DELETE FROM support_materials WHERE courseId = ?",
      [id]
    );

    await db.query(
      "DELETE FROM complementary_materials WHERE courseId = ?",
      [id]
    );

    await db.query(
      "DELETE FROM video_lessons WHERE courseId = ?",
      [id]
    );

    await db.query(
      "DELETE FROM compras WHERE curso_id = ?",
      [id]
    );

    // Eliminar curso destacado (se existir essa tabela)
    await db.query(
      "DELETE FROM featured_courses WHERE courseId = ?",
      [id]
    ).catch(() => { });

    // Eliminar o curso
    const userRole = (req.user.role || "").toLowerCase();
    const userAccount = (req.user.accountType || "").toLowerCase();
    const isPrivileged = ['admin', 'instrutor', 'instructor', 'professor', 'preparatorio'].includes(userRole) ||
      ['admin', 'instrutor', 'instructor', 'professor', 'preparatorio'].includes(userAccount);
    const deleteQuery = isPrivileged
      ? "DELETE FROM courses WHERE id = ?"
      : "DELETE FROM courses WHERE id = ? AND (ownerId = ? OR ownerId IS NULL)";
    const deleteParams = isPrivileged ? [id] : [id, req.user.id];

    const [result] = await db.query(deleteQuery, deleteParams);

    if (result.affectedRows === 0 && result.rowCount === 0) {
      return res.status(404).json({
        error: "Curso não encontrado ou não pertence ao utilizador"
      });
    }

    res.json({
      message: "Curso e todos os dados relacionados foram excluídos com sucesso!"
    });

  } catch (err) {
    console.error("Erro ao deletar curso:", err);

    res.status(500).json({
      error: err.message
    });
  }
});


// Upload Material de Apoio

app.post("/api/support-materials", auth, async (req, res) => {
  try {
    const { courseId, discipline, materialUrl } = req.body;

    // Validação simples
    if (!courseId || !discipline || !materialUrl) {
      return res.status(400).json({ error: "Campos obrigatórios: courseId, discipline, materialUrl" });
    }

    // Inserção na tabela support_materials
    const [result] = await db.query(
      `INSERT INTO support_materials 
        (courseId, discipline, materialUrl, ownerId) 
       VALUES (?, ?, ?, ?)`,
      [courseId, discipline, materialUrl, req.user.id]
    );

    // Buscar o registro salvo para retornar ao frontend
    const [saved] = await db.query("SELECT * FROM support_materials WHERE id = ?", [result.insertId]);

    res.status(201).json(saved[0]);
  } catch (err) {
    console.error("Erro ao criar material de apoio:", err);
    res.status(500).json({ error: "Erro ao criar material de apoio" });
  }
});

// Adicionar Matéria Complementar (sem upload de arquivos)
app.post("/api/complements", auth, async (req, res) => {
  try {
    const { courseId, disciplina, tema, materials } = req.body;

    if (!courseId || !disciplina || !tema) {
      return res.status(400).json({ error: "Campos obrigatórios: courseId, disciplina, tema" });
    }

    const [result] = await db.query(
      `INSERT INTO complementary_materials 
        (courseId, disciplina, tema, materials, ownerId) 
       VALUES (?, ?, ?, ?, ?)`,
      [courseId, disciplina, tema, materials || "", req.user.id]
    );

    res.json({
      id: result.insertId,
      courseId,
      disciplina,
      tema,
      materials
    });
  } catch (err) {
    console.error("Erro ao adicionar matéria complementar:", err);
    res.status(500).json({ error: "Erro ao adicionar matéria complementar" });
  }
});

function formatExamQuestion(q) {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const correct = q.correctAnswer || q.correctanswer || '';
  const wrongOptions = [
    q.wrongAnswer1 || q.wronganswer1,
    q.wrongAnswer2 || q.wronganswer2,
    q.wrongAnswer3 || q.wronganswer3,
    q.wrongAnswer4 || q.wronganswer4
  ].filter(Boolean);

  const all = [
    { text: String(correct).trim(), isCorrect: true },
    ...wrongOptions.map(w => ({ text: String(w).trim(), isCorrect: false }))
  ].filter(opt => opt.text.length > 0);

  if (all.length === 0) {
    all.push({ text: "Opção correta", isCorrect: true });
    all.push({ text: "Opção incorreta", isCorrect: false });
  }

  // Embaralhar as opções
  all.sort(() => Math.random() - 0.5);

  const correctIndex = all.findIndex(item => item.isCorrect);
  const correctLetter = correctIndex !== -1 ? letters[correctIndex] : 'A';

  return {
    id: q.id,
    question: q.question || q.questao || '',
    options: all.map(item => item.text),
    correctAnswer: correctLetter,
    tema_0: q.tema || q.disciplina || 'Geral',
    disciplina_0: q.disciplina || 'Geral',
    points: q.points || 10,
    explanation: q.explanation || ''
  };
}

app.get('/api/perguntas', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const [results] = await db.query(
      'SELECT * FROM exam_questions ORDER BY id DESC LIMIT ?',
      [limit]
    );

    const formatted = results.map(formatExamQuestion);
    res.status(200).json(formatted);
  } catch (err) {
    console.error('Erro ao buscar perguntas:', err);

    res.status(500).json({
      message: 'Erro ao buscar perguntas'
    });
  }
});



// Criar sala de exame
app.post("/api/exam-classes", auth, async (req, res) => {
  try {
    const { courseId, roomName } = req.body;

    if (!courseId || !roomName) {
      return res.status(400).json({ error: "Campos obrigatórios: courseId, roomName" });
    }

    const [result] = await db.query(
      "INSERT INTO exam_classes (courseId, roomName, ownerId) VALUES (?, ?, ?)",
      [courseId, roomName, req.user.id]
    );

    const [room] = await db.query("SELECT * FROM exam_classes WHERE id = ?", [result.insertId]);
    res.status(201).json(room[0]);
  } catch (err) {
    console.error("Erro ao criar sala de exame:", err);
    res.status(500).json({ error: "Erro ao criar sala de exame" });
  }
});

// Listar salas de exame
app.get("/api/exam-classes", auth, async (req, res) => {
  try {
    const [rooms] = await db.query(
      "SELECT * FROM exam_classes WHERE ownerId = ?",
      [req.user.id]
    );
    res.json(rooms);
  } catch (err) {
    console.error("Erro ao listar salas de exame:", err);
    res.status(500).json({ error: "Erro ao listar salas de exame" });
  }
});

// Criar questão vinculada a uma sala de exame
app.post("/api/exam-questions", auth, async (req, res) => {
  console.log("REQ BODY:", req.body);

  try {
    const {
      roomId,
      question,
      correctAnswer,
      wrongAnswer1,
      wrongAnswer2,
      wrongAnswer3,
      wrongAnswer4,
      tema,        // novo campo
      disciplina   // novo campo
    } = req.body;

    // 🔹 Validação mínima
    if (!roomId || !question || !correctAnswer) {
      return res.status(400).json({
        error: "Campos obrigatórios: roomId, question, correctAnswer"
      });
    }

    // 🔹 Inserção segura com placeholders
    const [result] = await db.query(
      `INSERT INTO exam_questions 
        (roomId, question, correctAnswer, wrongAnswer1, wrongAnswer2, wrongAnswer3, wrongAnswer4, tema, disciplina, ownerId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        roomId,
        question,
        correctAnswer,
        wrongAnswer1 || "",
        wrongAnswer2 || "",
        wrongAnswer3 || "",
        wrongAnswer4 || "",
        tema || "",
        disciplina || "",
        req.user.id          // 🔹 pega o usuário autenticado
      ]
    );

    // 🔹 Buscar a questão recém-criada
    const [saved] = await db.query(
      "SELECT * FROM exam_questions WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(saved[0]);
  } catch (err) {
    console.error("Erro ao criar questão:", err);
    res.status(500).json({ error: "Erro ao criar questão" });
  }
});


app.post("/api/video-lessons", auth, async (req, res) => {
  try {
    const { title, tema, disciplina, url, url_drive, courseId } = req.body;

    // 🔹 Validação simples
    if (!title || !tema || !disciplina || !url || !url_drive || !courseId) {
      return res.status(400).json({
        error: "Campos obrigatórios: title, tema, disciplina, url, url_drive, courseId"
      });
    }

    // 🔹 Inserção na tabela com a nova coluna
    const [result] = await db.query(
      `INSERT INTO video_lessons 
        (title, tema, disciplina, url, url_drive, courseId, ownerID) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, tema, disciplina, url, url_drive, courseId, req.user.id] // ownerID vem do usuário autenticado
    );

    // 🔹 Retorno da resposta
    res.json({
      id: result.insertId,
      title,
      tema,
      disciplina,
      url,
      url_drive,
      courseId,
      ownerID: req.user.id
    });
  } catch (err) {
    console.error("Erro ao adicionar vídeo aula:", err);
    res.status(500).json({ error: "Erro ao adicionar vídeo aula" });
  }
});


// 🔹 Contagem de usuários (opcional)
app.get("/api/user-count", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT COUNT(*) AS total FROM users");
    res.json({ count: rows[0].total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar número de usuários" });
  }
});

app.get("/api/pais", async (req, res) => {
  try {
    // Seleciona apenas países distintos da tabela cursos
    const [rows] = await db.query("SELECT DISTINCT country FROM courses ORDER BY country ASC");

    // Retorna como array de objetos [{ country: "Angola" }, { country: "Brasil" }, ...]
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar países:", err);
    res.status(500).json({ error: "Erro ao buscar países" });
  }
});

// Rota para listar materiais complementares
app.get("/api/materials", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(`
      SELECT DISTINCT
        cm.id,
        cm.tema,
        cm.disciplina,
        cm.materials
      FROM complementary_materials cm
      INNER JOIN compras cp
        ON cp.curso_id = cm.courseId
      WHERE cp.user_id = ?
      AND (
        cp.data_expiracao IS NULL
        OR cp.data_expiracao >= CURDATE()
      )
      ORDER BY cm.id DESC
    `, [userId]);

    res.json(rows);

  } catch (err) {
    console.error("Erro ao buscar materiais:", err);
    res.status(500).json({
      error: "Erro ao buscar materiais"
    });
  }
});

//Rota para listar as salas de exame!

app.get("/api/salas", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(`
      SELECT DISTINCT
        e.id,
        e.id AS examRoomId,
        e.roomName,
        e.roomName AS nome,
        c.title AS courseName
      FROM exam_classes e
      INNER JOIN courses c
        ON e.courseId = c.id
      INNER JOIN compras cp
        ON cp.curso_id = c.id
      WHERE cp.user_id = ?
      AND (
        cp.data_expiracao IS NULL
        OR cp.data_expiracao >= CURDATE()
      )
    `, [userId]);

    res.json(rows);

  } catch (err) {
    console.error("Erro ao buscar salas:", err);
    res.status(500).json({
      error: "Erro ao buscar salas"
    });
  }
});

// cursos públicos para vitrine e loja
app.get("/api/cursos", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.title,
        c.id,
        c.description,
        c.price,
        c.duration,
        c.workload_hours,
        c.level,
        c.category,
        c.country,
        c.thumbnail,
        c.details,
        cc.payment_whatsapp
      FROM courses c
      LEFT JOIN course_contacts cc
        ON cc.course_id = c.id
      WHERE c.status = 'publicado'
      ORDER BY c.id DESC
    `);

    const formatted = rows.map(course => ({
      title: course.title,
      id: course.id,
      descrição: course.description,
      area: course.category || course.description,
      category: course.category || "Geral",
      price: course.price,
      duration: course.duration,
      workload_hours: course.workload_hours,
      level: course.level,
      country: course.country,
      thumbnail: course.thumbnail,
      details: course.details || course.description,
      instructor_id: course.instructor_id,
      payment_whatsapp: course.payment_whatsapp
    }));

    res.json(formatted);

  } catch (err) {
    console.error("Erro ao buscar cursos:", err);
    res.status(500).json({ error: "Erro ao buscar cursos" });
  }
});

// 🔹 Endpoint público para listar professores/instrutores registrados na plataforma
app.get("/api/professores", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.id, 
        u.name, 
        u.role, 
        u.accountType, 
        u.bio, 
        u.phone,
        u.emailOrPhone,
        u.status,
        COALESCE(u.avatar, '') as avatar,
        COUNT(c.id)::int as total_cursos
      FROM users u
      LEFT JOIN courses c ON (c.instructor_id = u.id OR c.ownerId = u.id)
      WHERE (
        LOWER(u.role) IN ('instrutor', 'professor', 'preparatório', 'preparatorio')
        OR LOWER(u.accountType) IN ('instrutor', 'professor', 'preparatório', 'preparatorio')
      )
      AND (u.status IS NULL OR u.status = 'ativo')
      GROUP BY u.id, u.name, u.role, u.accountType, u.bio, u.phone, u.emailOrPhone, u.status, u.avatar
      ORDER BY total_cursos DESC, u.id ASC
    `);

    const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");
    const formatted = rows.map((p) => {
      const rawAvatar = p.avatar ? String(p.avatar).trim() : "";
      const avatarUrl = rawAvatar !== ""
        ? (rawAvatar.startsWith("http") ? rawAvatar : `${baseUrl}${rawAvatar.startsWith("/") ? "" : "/"}${rawAvatar}`)
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=0044fc&color=fff&size=160&bold=true`;

      return {
        id: p.id,
        name: p.name,
        role: p.role,
        accountType: p.accountType,
        bio: p.bio || "Professor da Plataforma Preparatório Universitário",
        avatar: avatarUrl,
        totalCursos: p.total_cursos || 0,
        phone: p.phone,
        emailOrPhone: p.emailOrPhone
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("Erro ao buscar professores:", err);
    res.status(500).json({ error: "Erro ao buscar professores", details: err.message });
  }
});

app.get("/api/instructors", async (req, res) => {
  res.redirect(307, "/api/professores");
});
// rota para os cursos comprados
//esta é a rota dos cursos comprados que eu vou usar com API
app.post("/api/comprar", auth, async (req, res) => {
  try {
    const courseId = req.body.courseId;

    // 🔹 Verifica se o usuário é estudante
    if (req.user.role !== "estudante") {
      return res.status(403).json({ error: "Apenas estudantes podem comprar cursos." });
    }

    // 🔹 Insere compra com data de expiração de 1 ano
    await db.query(
      `INSERT INTO compras (curso_id, user_id, data_compra, data_expiracao) 
       VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
      [courseId, req.user.id]
    );

    res.json({ message: "Compra registrada com sucesso! Curso disponível por 1 ano." });
  } catch (err) {
    console.error("Erro interno:", err);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});




// rota para pegar as perguntas

app.get("/api/exams/:examRoomId/questions", async (req, res) => {
  try {
    const roomId = parseInt(req.params.examRoomId, 10);
    if (!roomId) {
      return res.status(400).json({ error: "ID da sala inválido" });
    }

    const [rows] = await db.query(
      `SELECT q.id, q.question, q.wrongAnswer1, q.wrongAnswer2, q.wrongAnswer3, q.wrongAnswer4, q.correctAnswer, q.tema, q.disciplina, q.points, q.explanation
       FROM exam_questions q
       WHERE q.roomId = ?
       ORDER BY q.id ASC`,
      [roomId]
    );

    // Sincroniza tabela temporária use_questions se necessário
    try {
      await db.query('TRUNCATE TABLE use_questions');
      for (const row of rows) {
        await db.query(
          `INSERT INTO use_questions
           (questao, respostaCorreta, respostaErrada1, respostaErrada2, respostaErrada3, respostaErrada4, tema_p, disciplina_p)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [row.question, row.correctAnswer, row.wrongAnswer1, row.wrongAnswer2, row.wrongAnswer3, row.wrongAnswer4, row.tema || "", row.disciplina || ""]
        );
      }
    } catch (e) {
      console.warn("Aviso na sincronização de use_questions:", e.message);
    }

    const formatted = rows.map(formatExamQuestion);
    res.json(formatted);
  } catch (err) {
    console.error("Erro ao carregar perguntas da sala:", err);
    res.status(500).json({ error: "Erro ao buscar perguntas" });
  }
});

app.get("/api/compras", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT c.id, c.title, c.description, c.thumbnail, c.duration, c.category, c.price,
              cp.id as enrollment_id, cp.data_expiracao, cp.progress, cp.status
       FROM compras cp
       INNER JOIN courses c ON cp.curso_id = c.id
       WHERE cp.user_id = ? 
         AND (LOWER(cp.status) IN ('ativa', 'ativo', 'aprovada', 'pago', 'concluida') OR cp.status IS NULL)
         AND (cp.data_expiracao IS NULL OR cp.data_expiracao >= CURRENT_DATE)
       ORDER BY cp.id DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar cursos comprados:", err);
    res.status(500).json({ message: "Erro ao buscar cursos comprados" });
  }
});

app.get("/api/detalhes_c/:id", auth, async (req, res) => {
  const cursoId = req.params.id;

  try {
    const [video_lessons_legacy] = await db.query(
      "SELECT * FROM video_lessons WHERE courseId = ?",
      [cursoId]
    );

    const [lessons] = await db.query(
      `SELECT l.*, m.title as module_title 
       FROM course_lessons l
       LEFT JOIN course_modules m ON m.id = l.module_id
       WHERE l.course_id = ? 
       ORDER BY COALESCE(m.order_index, 0) ASC, l.order_index ASC`,
      [cursoId]
    );

    // Unifica video_lessons do LMS moderno e legado
    const unifiedVideos = [
      ...lessons.filter(l => l.content_type === 'video' || l.video_url).map(l => ({
        id: l.id,
        moduleId: l.module_id,
        moduleTitle: l.module_title || "Módulo Geral",
        title: l.title,
        tema: l.description || l.title,
        disciplina: l.module_title || "Módulo Geral",
        url: l.video_url,
        url_drive: l.video_drive_url,
        duration: l.duration_minutes || 30,
        attachmentUrl: l.attachment_url,
        attachmentName: l.attachment_name
      })),
      ...video_lessons_legacy.map(v => ({
        ...v,
        moduleTitle: v.disciplina || "Geral"
      }))
    ];

    const [support_materials_legacy] = await db.query(
      "SELECT * FROM support_materials WHERE courseId = ?",
      [cursoId]
    );

    const unifiedMaterials = [
      ...lessons.filter(l => l.attachment_url || l.content_type === 'pdf').map(l => ({
        id: l.id,
        discipline: l.title,
        materialUrl: l.attachment_url || l.text_content,
        attachmentName: l.attachment_name || l.title
      })),
      ...support_materials_legacy
    ];

    const [contact] = await db.query(
      `SELECT support_whatsapp FROM course_contacts WHERE course_id = ? LIMIT 1`,
      [cursoId]
    );

    const [courseRows] = await db.query(
      `SELECT id, title, description, thumbnail, duration, category, price FROM courses WHERE id = ?`,
      [cursoId]
    );

    res.json({
      course: courseRows.length > 0 ? courseRows[0] : null,
      video_lessons: unifiedVideos,
      support_materials: unifiedMaterials,
      support_whatsapp: contact.length > 0 ? contact[0].support_whatsapp : null
    });
  } catch (err) {
    console.error("Erro ao carregar detalhes do curso:", err);
    res.status(500).json({ error: "Erro ao buscar detalhes do curso" });
  }
});

// 🔹 Acompanhamento de progresso do aluno por curso
app.get("/api/progress/:courseId", auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const [completedRows] = await db.query(
      `SELECT lesson_id FROM lesson_progress WHERE user_id = ? AND course_id = ? AND completed = TRUE`,
      [userId, courseId]
    );

    const completedLessonIds = completedRows.map(r => r.lesson_id);

    const [totalRows] = await db.query(
      `SELECT COUNT(*)::int as total FROM course_lessons WHERE course_id = ?`,
      [courseId]
    );

    const total = totalRows[0]?.total || 0;
    const percent = total > 0 ? Math.round((completedLessonIds.length / total) * 100) : 0;

    res.json({
      completedLessonIds,
      totalLessons: total,
      completedCount: completedLessonIds.length,
      progressPercent: percent
    });
  } catch (err) {
    console.error("Erro ao buscar progresso:", err);
    res.status(500).json({ error: "Erro ao buscar progresso" });
  }
});

// 🔹 Alternar conclusão de aula pelo aluno
app.post("/api/progress/:courseId/lesson/:lessonId", auth, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user.id;

    // Verificar se já existe registro
    const [existing] = await db.query(
      `SELECT id, completed FROM lesson_progress WHERE user_id = ? AND course_id = ? AND lesson_id = ?`,
      [userId, courseId, lessonId]
    );

    let isCompleted = true;
    if (existing.length > 0) {
      isCompleted = !existing[0].completed;
      await db.query(
        `UPDATE lesson_progress SET completed = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [isCompleted, existing[0].id]
      );
    } else {
      await db.query(
        `INSERT INTO lesson_progress (user_id, course_id, lesson_id, completed, completed_at) VALUES (?, ?, ?, TRUE, CURRENT_TIMESTAMP)`,
        [userId, courseId, lessonId]
      );
      isCompleted = true;
    }

    // Recalcular percentual global e atualizar tabela compras
    const [completedRows] = await db.query(
      `SELECT COUNT(*)::int as count FROM lesson_progress WHERE user_id = ? AND course_id = ? AND completed = TRUE`,
      [userId, courseId]
    );
    const [totalRows] = await db.query(
      `SELECT COUNT(*)::int as total FROM course_lessons WHERE course_id = ?`,
      [courseId]
    );

    const total = totalRows[0]?.total || 1;
    const percent = Math.min(100, Math.round(((completedRows[0]?.count || 0) / total) * 100));

    await db.query(
      `UPDATE compras SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND curso_id = ?`,
      [percent, userId, courseId]
    );

    res.json({ success: true, completed: isCompleted, progressPercent: percent });
  } catch (err) {
    console.error("Erro ao atualizar progresso de aula:", err);
    res.status(500).json({ error: "Erro ao atualizar progresso de aula" });
  }
});

app.get("/api/recuperar-senha", async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT
        id,
        nome,
        numeroouemail,
        sugerir_nova_senha
      FROM recuperar_senha
      ORDER BY id DESC
    `);

    res.json(rows);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Erro ao buscar registros"
    });
  }
});


// 2. FUNÇÃO PARA EMBARALHAR OPÇÕES
function embaralharOpcoes(pergunta) {
  const letras = ['A', 'B', 'C', 'D', 'E'];

  const opcoes = [
    { texto: pergunta.correctAnswer, correta: true },
    { texto: pergunta.optionA, correta: false },
    { texto: pergunta.optionB, correta: false },
    { texto: pergunta.optionC, correta: false },
    { texto: pergunta.optionD, correta: false },
  ];

  // Embaralha as 5 opções
  opcoes.sort(() => Math.random() - 0.5);

  // Descobre qual letra ficou a correta
  const indiceCorreta = opcoes.findIndex(op => op.correta);
  const respostaCorreta = letras[indiceCorreta];

  return {
    id: pergunta.id,
    question: pergunta.question,
    options: opcoes.map(op => op.texto), // array só com os textos
    correctAnswer: respostaCorreta, // A, B, C, D ou E
    disciplina_0: pergunta.disciplina_0, // 🔹 mantém a disciplina
    tema_0: pergunta.tema_0
  };
}


// 1. ROTA: Buscar perguntas aleatórias
// Ex: /api/perguntas?limit=20&disciplina=Matematica
app.get('/api/perguntas', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    const total = parseInt(req.query.limit) || 50;

    const distribuicao = total === 50
      ? { 'Biologia': 25, 'Química': 10, 'Física': 5, 'Língua Portuguesa': 5, 'Matemática': 5 }
      : { 'Biologia': 50, 'Química': 25, 'Matemática': 10, 'Física': 10, 'Língua Portuguesa': 5 };

    let todasPerguntas = [];

    for (const disciplina in distribuicao) {
      const qtd = distribuicao[disciplina];

      // 🔹 IDs já usados dessa disciplina
      const [usados] = await db.query(
        "SELECT question_id FROM used_questions WHERE disciplina = ?",
        [disciplina]
      );
      const idsUsados = usados.map(u => u.question_id);

      // 🔹 Verifica quantas questões existem no banco para essa disciplina
      const [totalDisponiveis] = await db.query(
        "SELECT COUNT(*) AS total FROM use_questions WHERE disciplina_p = ?",
        [disciplina]
      );

      // 🔹 Se já usamos todas, resetamos a tabela auxiliar
      if (idsUsados.length >= totalDisponiveis[0].total) {
        await db.query("DELETE FROM used_questions WHERE disciplina = ?", [disciplina]);
        idsUsados.length = 0; // limpa array local também
      }

      const sql = `
        SELECT
          id,
          questao AS question,
          respostaCorreta AS correctAnswer,
          respostaErrada1 AS optionA,
          respostaErrada2 AS optionB,
          respostaErrada3 AS optionC,
          respostaErrada4 AS optionD,
          disciplina_p As disciplina_0,
          tema_p AS tema_0
        FROM use_questions
        WHERE disciplina_p = ?
        ORDER BY RAND()
        LIMIT ${qtd}
      `;

      const [rows] = await db.query(sql, [disciplina]);
      console.log(`Achou ${rows.length} de ${disciplina}`);

      for (const r of rows) {
        await db.query(
          "INSERT INTO used_questions (disciplina, question_id) VALUES (?, ?)",
          [disciplina, r.id]
        );
      }


      const perguntasEmbaralhadas = rows.map(p => embaralharOpcoes(p));
      todasPerguntas = todasPerguntas.concat(perguntasEmbaralhadas);
    }

    res.json(todasPerguntas);

  } catch (err) {
    console.error("ERRO COMPLETO:", err);
    res.status(500).json({ error: err.message });
  }
});


app.post("/api/estatisticas", auth, async (req, res) => {
  try {
    const { estatisticas, userId } = req.body;
    const targetUserId = userId || req.user.id;

    if (!targetUserId) {
      return res.status(400).json({ error: "userId é obrigatório" });
    }

    // Apagar estatísticas antigas apenas deste usuário específico
    await db.query('DELETE FROM estatisticas WHERE user_id = ?', [targetUserId]);

    // estatisticas é um objeto com várias disciplinas
    for (const disciplina in estatisticas) {
      const { acertos, erros } = estatisticas[disciplina];
      const total = acertos + erros;
      const percentual = total > 0 ? (acertos / total) * 100 : 0;

      await db.query(
        `INSERT INTO estatisticas 
          (user_id, disciplina, acertos, errados, total, percentual, data_registro) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [targetUserId, disciplina, acertos, erros, total, percentual]
      );
    }

    res.json({ message: "Estatísticas salvas com sucesso" });
  } catch (err) {
    console.error("Erro ao salvar estatísticas:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// rota estatisticas.js
app.get("/api/estatisticas", auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const sql = `
      SELECT 
        disciplina,
        acertos,
        errados,
        total,
        percentual,
        data_registro
      FROM estatisticas
      WHERE user_id = ?
      ORDER BY data_registro DESC
    `;

    const [rows] = await db.query(sql, [user.id]);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar estatísticas:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// 🔹 Histórico real de simulados realizados pelo aluno
app.get("/api/exam-attempts", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(`
      SELECT 
        a.id,
        a.user_id,
        a.exam_id,
        a.course_id,
        COALESCE(e.roomName, a.title, 'Simulado') AS titulo,
        a.score,
        a.correct_answers AS acertos,
        a.wrong_answers AS erros,
        a.total_questions AS total,
        a.passed,
        a.disciplines_summary AS disciplinas,
        a.completed_at,
        TO_CHAR(a.completed_at, 'YYYY-MM-DD') AS data
      FROM exam_attempts a
      LEFT JOIN exam_classes e ON e.id = a.exam_id
      WHERE a.user_id = ?
      ORDER BY a.completed_at DESC
      LIMIT 30
    `, [userId]);

    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar histórico de simulados:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// 🔹 Registrar tentativa de simulado e consolidar estatísticas por disciplina
app.post("/api/exam-attempts", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      examId,
      courseId,
      title,
      score,
      correctAnswers,
      wrongAnswers,
      totalQuestions,
      passed,
      disciplinas
    } = req.body;

    const [result] = await db.query(`
      INSERT INTO exam_attempts 
        (user_id, exam_id, course_id, title, score, correct_answers, wrong_answers, total_questions, passed, disciplines_summary, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, NOW())
      RETURNING id
    `, [
      userId,
      examId || null,
      courseId || null,
      title || "Simulado Geral",
      score || 0,
      correctAnswers || 0,
      wrongAnswers || 0,
      totalQuestions || 0,
      Boolean(passed),
      JSON.stringify(disciplinas || [])
    ]);

    // Consolidar estatísticas por disciplina na tabela estatisticas
    if (Array.isArray(disciplinas) && disciplinas.length > 0) {
      for (const d of disciplinas) {
        const nomeDisc = d.nome || d.disciplina || "Geral";
        const dAcertos = Number(d.acertos ?? d.respondidas ?? 0);
        const dErros = Number(d.erros ?? d.naoRespondidas ?? 0);
        const dTotal = dAcertos + dErros;
        const dPct = dTotal > 0 ? (dAcertos / dTotal) * 100 : 0;

        const [existing] = await db.query(
          "SELECT id, acertos, errados, total FROM estatisticas WHERE user_id = ? AND disciplina = ?",
          [userId, nomeDisc]
        );

        if (existing && existing.length > 0) {
          const newAcertos = Number(existing[0].acertos) + dAcertos;
          const newErros = Number(existing[0].errados) + dErros;
          const newTotal = newAcertos + newErros;
          const newPct = newTotal > 0 ? (newAcertos / newTotal) * 100 : 0;

          await db.query(`
            UPDATE estatisticas 
            SET acertos = ?, errados = ?, total = ?, percentual = ?, data_registro = NOW()
            WHERE id = ?
          `, [newAcertos, newErros, newTotal, newPct, existing[0].id]);
        } else {
          await db.query(`
            INSERT INTO estatisticas (user_id, disciplina, acertos, errados, total, percentual, data_registro)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
          `, [userId, nomeDisc, dAcertos, dErros, dTotal, dPct]);
        }
      }
    }

    res.status(201).json({
      success: true,
      id: result?.[0]?.id || null,
      message: "Tentativa de simulado registrada com sucesso!"
    });
  } catch (err) {
    console.error("Erro ao registrar tentativa de simulado:", err);
    res.status(500).json({ error: "Erro ao registrar tentativa de simulado" });
  }
});

app.get("/api/videos/:id/download", auth, async (req, res) => {
  try {
    const videoId = req.params.id;

    // 1. Buscar o vídeo no banco de dados
    const [rows] = await db.query(
      `SELECT url, url_drive, disciplina, courseId
       FROM video_lessons
       WHERE id = ?`,
      [videoId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Vídeo não encontrado."
      });
    }

    const video = rows[0];

    if (!video.url_drive) {
      return res.status(404).json({
        message: "Este vídeo não tem um link do Google Drive."
      });
    }

    // 2. Validar a compra do curso
    const [compras] = await db.query(
      `SELECT data_expiracao
       FROM compras
       WHERE curso_id = ? AND user_id = ?`,
      [video.courseId, req.user.id]
    );

    if (compras.length === 0) {
      return res.status(403).json({
        message: "Curso não comprado."
      });
    }

    if (
      compras[0].data_expiracao &&
      new Date(compras[0].data_expiracao) < new Date()
    ) {
      return res.status(403).json({
        message: "Acesso expirado. Renove o curso."
      });
    }

    // 3. Extrair o ID do ficheiro do Google Drive
    const match = video.url_drive.match(
      /\/file\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/
    );

    const driveId = match && (match[1] || match[2]);

    if (!driveId) {
      return res.status(400).json({
        message: "O link do Google Drive não é válido."
      });
    }

    // 4. Pedir o ficheiro real ao Google Drive
    const driveUrl =
      `https://drive.google.com/uc?export=download&id=${driveId}`;

    const driveResponse = await axios.get(driveUrl, {
      responseType: "stream",
      maxRedirects: 5,
      timeout: 120000,
      validateStatus: (status) => status >= 200 && status < 300
    });

    const contentType =
      driveResponse.headers["content-type"] || "";

    // Evitar enviar uma página HTML como se fosse um vídeo
    if (
      contentType.includes("text/html") ||
      contentType.includes("application/json")
    ) {
      driveResponse.data.destroy();

      return res.status(502).json({
        message:
          "O Google Drive não devolveu o vídeo. Verifica as permissões do ficheiro."
      });
    }

    // 5. Enviar o ficheiro ao navegador
    const safeName = `video-${videoId}.mp4`;

    res.setHeader(
      "Content-Type",
      contentType || "application/octet-stream"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeName}"`
    );

    if (driveResponse.headers["content-length"]) {
      res.setHeader(
        "Content-Length",
        driveResponse.headers["content-length"]
      );
    }

    driveResponse.data.on("error", (err) => {
      console.error("Erro na transmissão do vídeo:", err);

      if (!res.headersSent) {
        res.status(502).end("Erro ao transmitir o vídeo.");
      } else {
        res.destroy(err);
      }
    });

    driveResponse.data.pipe(res);

  } catch (err) {
    console.error("Erro ao descarregar vídeo:", err.message);

    if (!res.headersSent) {
      res.status(500).json({
        message: "Erro ao obter o ficheiro de vídeo."
      });
    } else {
      res.destroy(err);
    }
  }
});

// Rota para buscar apenas "details" de um curso
app.get("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Consulta apenas a coluna "details"
    const [rows] = await db.query("SELECT details FROM courses WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    // Retorna apenas o campo details
    res.json({ details: rows[0].details });
  } catch (err) {
    console.error("Erro ao buscar detalhes do curso:", err);
    res.status(500).json({ error: "Erro ao buscar detalhes do curso" });
  }
});





app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const userIdentifier = username || req.body.email || req.body.emailOrPhone;

    // Busca admin no banco
    const [rows] = await db.query("SELECT * FROM admin WHERE username = ?", [userIdentifier]);

    if (rows.length === 0) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    const admin = rows[0];

    // Verifica senha com bcrypt
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    // Gera token JWT somente se senha for válida
    const token = jwt.sign(
      { id: admin.id, role: "admin", accountType: "admin", username: admin.username, name: admin.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login realizado com sucesso!",
      token,
      role: "admin",
      accountType: "admin",
      user: {
        id: admin.id,
        username: admin.username,
        name: admin.username,
        emailOrPhone: admin.username,
        role: "admin",
        accountType: "admin"
      }
    });
  } catch (err) {
    console.error("Erro interno:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.get("/api/courses_1", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM courses");
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar cursos:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});


// DELETE curso por ID (protegido para administradores)
app.delete("/api/courses_1/:id", auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // 🔹 Primeiro eliminamos os dados relacionados ao curso
    await db.query(
      "DELETE FROM exam_questions WHERE roomId IN (SELECT id FROM exam_rooms WHERE courseId = ?)",
      [id]
    );
    await db.query("DELETE FROM exam_classes WHERE courseId = ?", [id]);
    await db.query("DELETE FROM support_materials WHERE courseId = ?", [id]);
    await db.query("DELETE FROM complementary_materials WHERE courseId = ?", [id]);
    await db.query("DELETE FROM video_lessons WHERE courseId = ?", [id]);
    await db.query("DELETE FROM compras WHERE curso_id = ?", [id]);

    // 🔹 Agora eliminamos o curso
    const [result] = await db.query("DELETE FROM courses WHERE id = ?", [id]);

    if (result.affectedRows === 0 && result.rowCount === 0) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    res.json({ message: "Curso e todos os dados relacionados foram excluídos com sucesso!" });
  } catch (err) {
    console.error("Erro ao deletar curso:", err);
    res.status(500).json({ error: "Erro ao excluir curso e dados relacionados" });
  }
});


app.get("/api/users", auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, emailOrPhone, accountType, role, status, created_at FROM users ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar usuários:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});



app.post("/api/users", auth, adminOnly, async (req, res) => {
  try {
    const { name, password, accountType, emailOrPhone } = req.body;

    // 🔑 Criptografa a senha antes de salvar
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 role definido automaticamente com base no accountType
    const role = accountType === "estudante" ? "Estudante" : "Preparatório";

    const [result] = await db.query(
      "INSERT INTO users (name, password, accountType, role, emailOrPhone) VALUES (?, ?, ?, ?, ?)",
      [name, hashedPassword, accountType, role, emailOrPhone]
    );

    res.json({
      id: result.insertId,
      name,
      accountType,
      role,
      emailOrPhone,
      message: "Usuário cadastrado com sucesso!"
    });
  } catch (err) {
    console.error("Erro ao cadastrar usuário:", err);
    res.status(500).json({ error: "Erro interno ao cadastrar usuário" });
  }
});

// 🔹 Rota de upload de foto de perfil (avatar)
app.post("/api/users/upload-avatar", auth, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhuma imagem foi enviada." });
    }
    const avatarUrl = `/uploads/${req.file.filename}`;
    // Atualizar no banco de dados para o usuário autenticado
    await db.query("UPDATE users SET avatar = ? WHERE id = ?", [avatarUrl, req.user.id]);
    res.json({
      success: true,
      message: "Foto de perfil enviada com sucesso!",
      avatar: avatarUrl
    });
  } catch (err) {
    console.error("Erro no upload de avatar:", err);
    res.status(500).json({ error: "Erro ao fazer upload da imagem" });
  }
});

// 🔹 Rota direta de edição do próprio perfil (aluno, instrutor, preparatório ou admin)
app.put("/api/users/profile", auth, upload.single("avatar"), async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, bio, emailOrPhone, password } = req.body;
    const avatar = req.file ? `/uploads/${req.file.filename}` : req.body.avatar;

    const [existing] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    const current = existing[0];

    const updatedName = (name !== undefined && name !== null && String(name).trim() !== "")
      ? String(name).trim()
      : current.name;
    const updatedPhone = phone !== undefined ? String(phone).trim() : (current.phone || "");
    const updatedBio = bio !== undefined ? String(bio).trim() : (current.bio || "");
    const updatedEmail = (emailOrPhone && String(emailOrPhone).trim() !== "")
      ? String(emailOrPhone).trim()
      : current.emailorphone;
    const updatedAvatar = avatar !== undefined ? (avatar ? String(avatar).trim() : null) : current.avatar;

    let updateSql = "UPDATE users SET name = ?, phone = ?, bio = ?, emailOrPhone = ?, avatar = ?";
    let updateParams = [updatedName, updatedPhone, updatedBio, updatedEmail, updatedAvatar];

    if (password && String(password).trim().length > 0) {
      const hashedPassword = await bcrypt.hash(String(password).trim(), 10);
      updateSql += ", password = ?";
      updateParams.push(hashedPassword);
    }

    updateSql += " WHERE id = ?";
    updateParams.push(userId);

    await db.query(updateSql, updateParams);

    const userRole = (current.accounttype === "admin" || (current.role && current.role.toLowerCase() === "admin"))
      ? "admin"
      : (current.accounttype || current.role || "estudante").toLowerCase();

    res.json({
      success: true,
      message: "Perfil atualizado com sucesso!",
      user: {
        id: current.id,
        name: updatedName,
        emailOrPhone: updatedEmail,
        phone: updatedPhone,
        bio: updatedBio,
        avatar: updatedAvatar,
        role: userRole,
        accountType: current.accounttype || userRole
      }
    });
  } catch (err) {
    console.error("Erro ao atualizar perfil do usuário:", err);
    res.status(500).json({ error: "Erro interno ao atualizar perfil." });
  }
});

app.put("/api/users/:id", auth, upload.single("avatar"), async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;
    const currentUserRole = (req.user.role || req.user.accountType || "").toLowerCase();

    // Permite atualização se for o próprio usuário autenticado ou administrador
    if (currentUserRole !== "admin" && String(currentUserId) !== String(id)) {
      return res.status(403).json({ error: "Acesso negado para modificar este usuário." });
    }

    const { name, password, accountType, emailOrPhone, phone, bio } = req.body;
    const avatar = req.file ? `/uploads/${req.file.filename}` : req.body.avatar;

    const [existing] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    const current = existing[0];

    const newName = name !== undefined && String(name).trim() !== "" ? String(name).trim() : current.name;
    const newEmail = emailOrPhone !== undefined && String(emailOrPhone).trim() !== "" ? String(emailOrPhone).trim() : current.emailorphone;
    const newPhone = phone !== undefined ? String(phone).trim() : (current.phone || "");
    const newBio = bio !== undefined ? String(bio).trim() : (current.bio || "");
    const newAvatar = avatar !== undefined ? (avatar ? String(avatar).trim() : null) : current.avatar;

    let updateSql = "UPDATE users SET name = ?, emailOrPhone = ?, phone = ?, bio = ?, avatar = ?";
    let updateParams = [newName, newEmail, newPhone, newBio, newAvatar];

    if (password && String(password).trim().length > 0) {
      const hashedPassword = await bcrypt.hash(String(password).trim(), 10);
      updateSql += ", password = ?";
      updateParams.push(hashedPassword);
    }

    // Apenas admin pode alterar tipo de conta e papel
    if (currentUserRole === "admin" && accountType) {
      const role = accountType === "estudante" ? "Estudante" : accountType === "instrutor" ? "Instrutor" : "Preparatório";
      updateSql += ", accountType = ?, role = ?";
      updateParams.push(accountType, role);
    }

    updateSql += " WHERE id = ?";
    updateParams.push(id);

    const [result] = await db.query(updateSql, updateParams);

    if (result.affectedRows === 0 && result.rowCount === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json({
      id,
      name: newName,
      accountType: accountType || current.accounttype,
      emailOrPhone: newEmail,
      phone: newPhone,
      bio: newBio,
      avatar: newAvatar,
      message: "Usuário atualizado com sucesso!"
    });
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    res.status(500).json({ error: "Erro interno ao atualizar usuário" });
  }
});

app.delete("/api/users/:id", auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query("DELETE FROM users WHERE id = ?", [id]);

    if (result.affectedRows === 0 && result.rowCount === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json({ message: "Usuário eliminado com sucesso!" });
  } catch (err) {
    console.error("Erro ao eliminar usuário:", err);
    res.status(500).json({ error: "Erro interno ao eliminar usuário" });
  }
});

// Adicionar curso em destaque
app.post("/api/destacar_curso", auth, adminOnly, async (req, res) => {
  try {
    const { id_do_curso } = req.body;

    const [result] = await db.query(
      "INSERT INTO destacar_curso (id_do_curso) VALUES (?)",
      [id_do_curso]
    );

    res.json({ message: "Curso destacado com sucesso!", id: result.insertId });
  } catch (err) {
    console.error("Erro ao destacar curso:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// Remover curso dos destaques
app.delete("/api/destacar_curso/:id_do_curso", auth, adminOnly, async (req, res) => {
  try {
    const { id_do_curso } = req.params;

    const [result] = await db.query(
      "DELETE FROM destacar_curso WHERE id_do_curso = ?",
      [id_do_curso]
    );

    if (result.affectedRows === 0 && result.rowCount === 0) {
      return res.status(404).json({ error: "Curso não encontrado nos destaques" });
    }

    res.json({ message: "Curso removido dos destaques!" });
  } catch (err) {
    console.error("Erro ao remover curso dos destaques:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.get("/api/courses_0", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, title FROM courses");
    res.json(rows); // 🔹 rows é um array
  } catch (err) {
    console.error("Erro ao buscar cursos:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// Listar compras por usuário
app.get("/api/compras/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await db.query(
      "SELECT id, id_do_curso, user_id FROM compras WHERE user_id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Nenhuma compra encontrada para este usuário" });
    }

    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar compras por usuário:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// Listar todas as compras
app.get("/api/compras_1", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, user_id, curso_id FROM compras"
    );
    res.json(rows); // 🔹 retorna array de objetos
  } catch (err) {
    console.error("Erro ao buscar compras:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// Adicionar compra
// Adicionar compra
app.post("/api/compras_3", async (req, res) => {
  try {
    const { user_id, curso_id } = req.body;

    if (!user_id || !curso_id) {
      return res.status(400).json({ error: "user_id e curso_id são obrigatórios" });
    }

    const [result] = await db.query(
      `INSERT INTO compras (user_id, curso_id, data_compra, data_expiracao) 
       VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
      [user_id, curso_id]
    );

    res.json({ message: "Compra adicionada com sucesso!", id: result.insertId });
  } catch (err) {
    console.error("Erro ao adicionar compra:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// Atualizar compra
app.put("/api/compras_2/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, curso_id } = req.body;

    if (!user_id || !curso_id) {
      return res.status(400).json({ error: "user_id e curso_id são obrigatórios" });
    }

    const [result] = await db.query(
      `UPDATE compras 
       SET user_id = ?, curso_id = ?, data_compra = NOW(), data_expiracao = DATE_ADD(NOW(), INTERVAL 1 YEAR) 
       WHERE id = ?`,
      [user_id, curso_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Compra não encontrada" });
    }

    res.json({ message: "Compra atualizada com sucesso!" });
  } catch (err) {
    console.error("Erro ao atualizar compra:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// Remover compra
app.delete("/api/compras_0/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query("DELETE FROM compras WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Compra não encontrada" });
    }

    res.json({ message: "Compra removida com sucesso!" });
  } catch (err) {
    console.error("Erro ao remover compra:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// Listar cursos em destaque com todos os dados da tabela courses
app.get("/api/destacar_curso", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.* 
       FROM destacar_curso dc
       INNER JOIN courses c ON dc.id_do_curso = c.id`
    );

    // Retorna lista de cursos em destaque (vazio caso ainda não haja destaques)
    res.json(rows || []);
  } catch (err) {
    console.error("Erro ao buscar cursos em destaque:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// Buscar apenas "details" de um curso destacado
app.get("/api/destacar_curso/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT c.details
       FROM destacar_curso dc
       INNER JOIN courses c ON dc.id_do_curso = c.id
       WHERE c.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Curso destacado não encontrado" });
    }

    res.json(rows[0]); // 🔹 retorna apenas { details: "..." }
  } catch (err) {
    console.error("Erro ao buscar curso destacado:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// Rota para buscar dados da tabela bna
app.get("/api/bna", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT express, iban FROM bna");

    if (rows.length === 0) {
      return res.status(404).json({ error: "Nenhum dado encontrado na tabela bna" });
    }

    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar dados da tabela bna:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// Rota para cadastrar na tabela recuperar_senha
app.post("/api/recuperar_senha", async (req, res) => {
  try {
    const { nome, numeroouemail, sugerir_nova_senha } = req.body;

    const [result] = await db.query(
      "INSERT INTO recuperar_senha (nome, numeroouemail, sugerir_nova_senha) VALUES (?, ?, ?)",
      [nome, numeroouemail, sugerir_nova_senha]
    );

    res.json({ id: result.insertId, nome, numeroouemail, sugerir_nova_senha });
  } catch (err) {
    console.error("Erro ao cadastrar:", err);
    res.status(500).json({ error: "Erro interno ao cadastrar" });
  }
});

app.get("/api/course-contacts", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM course_contacts ORDER BY id DESC"
    );

    res.json(rows);
  } catch (err) {
    console.error("Erro ao listar contactos:", err);
    res.status(500).json({
      error: "Erro interno ao listar contactos"
    });
  }
});

app.get("/api/course-contacts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        error: "ID inválido"
      });
    }

    const [rows] = await db.query(
      "SELECT * FROM course_contacts WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Contacto não encontrado"
      });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Erro ao consultar contacto:", err);
    res.status(500).json({
      error: "Erro interno ao consultar contacto"
    });
  }
});

app.put("/api/course-contacts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      course_id,
      support_whatsapp,
      payment_whatsapp
    } = req.body;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        error: "ID inválido"
      });
    }

    if (
      course_id === undefined ||
      !Number.isInteger(Number(course_id)) ||
      Number(course_id) <= 0 ||
      typeof support_whatsapp !== "string" ||
      typeof payment_whatsapp !== "string" ||
      !support_whatsapp.trim() ||
      !payment_whatsapp.trim() ||
      support_whatsapp.trim().length > 20 ||
      payment_whatsapp.trim().length > 20
    ) {
      return res.status(400).json({
        error: "Preenche corretamente todos os campos obrigatórios"
      });
    }

    const [existing] = await db.query(
      "SELECT id FROM course_contacts WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        error: "Contacto não encontrado"
      });
    }

    const [result] = await db.query(
      `UPDATE course_contacts
       SET course_id = ?,
           support_whatsapp = ?,
           payment_whatsapp = ?
       WHERE id = ?`,
      [
        Number(course_id),
        support_whatsapp.trim(),
        payment_whatsapp.trim(),
        id
      ]
    );

    const [rows] = await db.query(
      "SELECT * FROM course_contacts WHERE id = ?",
      [id]
    );

    res.json({
      message: "Contacto atualizado com sucesso",
      contact: rows[0]
    });
  } catch (err) {
    console.error("Erro ao atualizar contacto:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Este curso já está associado a outro contacto"
      });
    }

    res.status(500).json({
      error: "Erro interno ao atualizar contacto"
    });
  }
});


// Rota para listar todos os registros
// Rota para listar todos os registros de recuperar_senha
app.get("/api/recuperar_senha", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM recuperar_senha");
    res.json(rows); // inclui sugerir_nova_senha
  } catch (err) {
    console.error("Erro ao buscar registros:", err);
    res.status(500).json({ error: "Erro interno ao buscar registros" });
  }
});


// Rota para excluir registro pelo ID
app.delete("/api/recuperar_senha/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM recuperar_senha WHERE id = ?", [id]);
    res.json({ message: "Registro eliminado com sucesso!" });
  } catch (err) {
    console.error("Erro ao eliminar registro:", err);
    res.status(500).json({ error: "Erro interno ao eliminar registro" });
  }
});


app.post('/api/course-contacts', async (req, res) => {
  try {
    const {
      courseId,
      supportWhatsapp,
      paymentWhatsapp
    } = req.body;

    if (!courseId || !supportWhatsapp || !paymentWhatsapp) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios.'
      });
    }

    const sql = `
      INSERT INTO course_contacts (
        course_id,
        support_whatsapp,
        payment_whatsapp
      )
      VALUES (?, ?, ?)
    `;

    db.query(
      sql,
      [
        courseId,
        supportWhatsapp,
        paymentWhatsapp
      ],
      (err, result) => {

        if (err) {
          console.error(err);

          return res.status(500).json({
            success: false,
            message: 'Erro ao salvar configuração.'
          });
        }

        res.status(201).json({
          success: true,
          message: 'Configuração salva com sucesso!',
          id: result.insertId
        });

      }
    );

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor.'
    });
  }
});


/* ADICIONAR PERGUNTA */
app.post('/api/perguntas', async (req, res) => {
  try {
    const {
      roomId,
      question,
      correctAnswer,
      wrongAnswer1,
      wrongAnswer2,
      wrongAnswer3,
      wrongAnswer4,
      ownerId,
      tema,
      disciplina
    } = req.body;

    if (
      !roomId ||
      !question?.trim() ||
      !correctAnswer?.trim() ||
      !ownerId ||
      !tema?.trim() ||
      !disciplina?.trim()
    ) {
      return res.status(400).json({
        message: 'Preenche todos os campos obrigatórios.'
      });
    }

    const sql = `
      INSERT INTO exam_questions
      (
        roomId, question, correctAnswer,
        wrongAnswer1, wrongAnswer2,
        wrongAnswer3, wrongAnswer4,
        ownerId, tema, disciplina
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      roomId,
      question.trim(),
      correctAnswer.trim(),
      wrongAnswer1 || null,
      wrongAnswer2 || null,
      wrongAnswer3 || null,
      wrongAnswer4 || null,
      ownerId,
      tema.trim(),
      disciplina.trim()
    ];

    const [result] = await db.query(sql, values);

    res.status(201).json({
      message: 'Pergunta adicionada com sucesso!',
      id: result.insertId
    });
  } catch (err) {
    console.error('Erro ao adicionar pergunta:', err);
    res.status(500).json({
      message: 'Erro ao adicionar pergunta.'
    });
  }
});


/* ELIMINAR PERGUNTA PELO ID (protegido) */
app.delete('/api/perguntas/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id) || Number(id) < 1) {
      return res.status(400).json({
        message: 'ID da pergunta inválido.'
      });
    }

    const [result] = await db.query(
      'DELETE FROM exam_questions WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0 && result.rowCount === 0) {
      return res.status(404).json({
        message: 'Pergunta não encontrada.'
      });
    }

    res.json({
      message: 'Pergunta eliminada com sucesso!'
    });
  } catch (err) {
    console.error('Erro ao eliminar pergunta:', err);
    res.status(500).json({
      message: 'Erro ao eliminar pergunta.'
    });
  }
});


app.get('/api/salas_e', async (req, res) => {
  try {
    const [results] = await db.query(
      'SELECT * FROM exam_classes ORDER BY id DESC'
    );

    res.status(200).json(results);
  } catch (err) {
    console.error('Erro ao buscar salas:', err);

    res.status(500).json({
      message: 'Erro ao buscar salas.'
    });
  }
});





// 🔹 Rodar servidor dinamicamente com suporte a PORT de produção (Render / Railway / VPS)
const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Servidor rodando em http://${HOST}:${PORT} 🚀`);
});
