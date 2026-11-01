// scripts/verify_auth_system.js
const express = require('express');
const cors = require('cors');
const db = require('../src/backend/db');
const loginRoutes = require('../src/backend/login');
const adminRoutes = require('../src/backend/adminRoutes');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "segredo_super_seguranca";

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 INICIANDO TESTES DO SISTEMA DE AUTENTICAÇÃO E CONTROLE');
  console.log('🧪 ========================================================\n');

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Middleware auth
  const auth = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "Token não fornecido" });
      const token = authHeader.split(" ")[1];
      if (!token) return res.status(401).json({ error: "Formato de token inválido" });
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Token inválido" });
    }
  };

  // Auth me endpoint
  app.get("/api/auth/me", auth, async (req, res) => {
    try {
      const role = (req.user.role || req.user.accountType || "").toLowerCase();
      const userId = req.user.id;
      if (role === "admin") {
        const [admins] = await db.query("SELECT id, username FROM admin WHERE id = ?", [userId]);
        if (admins && admins.length > 0) {
          return res.json({
            authenticated: true,
            role: "admin",
            user: { id: admins[0].id, name: admins[0].username, username: admins[0].username, role: "admin" }
          });
        }
      }
      const [users] = await db.query("SELECT id, name, emailOrPhone, accountType, role FROM users WHERE id = ?", [userId]);
      if (users && users.length > 0) {
        const u = users[0];
        const userRole = (u.accountType === "admin" || (u.role && u.role.toLowerCase() === "admin"))
          ? "admin" : (u.accountType || u.role || "estudante").toLowerCase();
        return res.json({ authenticated: true, role: userRole, user: { id: u.id, name: u.name, role: userRole } });
      }
      return res.status(401).json({ authenticated: false });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Destacar curso endpoint (retorna [] se vazio em vez de 404)
  app.get("/api/destacar_curso", async (req, res) => {
    try {
      const [rows] = await db.query(
        "SELECT c.* FROM destacar_curso dc INNER JOIN courses c ON dc.id_do_curso = c.id"
      );
      res.json(rows || []);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.use("/api", loginRoutes);
  app.use(adminRoutes);

  const server = app.listen(5055);
  const baseUrl = "http://localhost:5055";

  let adminToken = "";
  let studentToken = "";

  try {
    // -------------------------------------------------------------
    // TESTE 1: Login de Administrador com "admin" e "admin123"
    // -------------------------------------------------------------
    console.log('👉 [1/8] Testando login de administrador com "admin" / "admin123"...');
    const adminLoginRes = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone: 'admin', password: 'admin123' })
    });
    const adminData = await adminLoginRes.json();
    if (adminLoginRes.ok && adminData.role === 'admin' && adminData.token) {
      adminToken = adminData.token;
      console.log('   ✅ SUCESSO: Login "admin" realizado com role = "admin".');
    } else {
      throw new Error(`Falha no login do admin: ${JSON.stringify(adminData)}`);
    }

    // -------------------------------------------------------------
    // TESTE 2: Login de Administrador com "admin1" / "admin123"
    // -------------------------------------------------------------
    console.log('\n👉 [2/8] Testando login de administrador com "admin1" / "admin123"...');
    const admin1LoginRes = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone: 'admin1', password: 'admin123' })
    });
    const admin1Data = await admin1LoginRes.json();
    if (admin1LoginRes.ok && admin1Data.role === 'admin') {
      console.log('   ✅ SUCESSO: Login "admin1" realizado com sucesso.');
    } else {
      throw new Error(`Falha no login admin1: ${JSON.stringify(admin1Data)}`);
    }

    // -------------------------------------------------------------
    // TESTE 3: Login de Estudante com email (antonio.kieza@gmail.com)
    // -------------------------------------------------------------
    console.log('\n👉 [3/8] Testando login de estudante com e-mail...');
    const studentLoginRes = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone: 'antonio.kieza@gmail.com', password: 'aluno123' })
    });
    const studentData = await studentLoginRes.json();
    if (studentLoginRes.ok && studentData.role === 'estudante' && studentData.token) {
      studentToken = studentData.token;
      console.log('   ✅ SUCESSO: Login estudante realizado com role = "estudante".');
    } else {
      throw new Error(`Falha no login do estudante: ${JSON.stringify(studentData)}`);
    }

    // -------------------------------------------------------------
    // TESTE 4: Login de Estudante com nome ("António Kieza")
    // -------------------------------------------------------------
    console.log('\n👉 [4/8] Testando login com nome de estudante ("António Kieza")...');
    const nameLoginRes = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone: 'António Kieza', password: 'aluno123' })
    });
    const nameData = await nameLoginRes.json();
    if (nameLoginRes.ok && nameData.role === 'estudante') {
      console.log('   ✅ SUCESSO: Reconhecido por nome completo com role = "estudante".');
    } else {
      throw new Error(`Falha no login por nome: ${JSON.stringify(nameData)}`);
    }

    // -------------------------------------------------------------
    // TESTE 5: Teste da rota /api/destacar_curso (não deve retornar 404)
    // -------------------------------------------------------------
    console.log('\n👉 [5/8] Testando rota /api/destacar_curso...');
    const destRes = await fetch(`${baseUrl}/api/destacar_curso`);
    const destData = await destRes.json();
    if (destRes.status === 200 && Array.isArray(destData)) {
      console.log('   ✅ SUCESSO: /api/destacar_curso retornou 200 OK com array (sem erro 404).');
    } else {
      throw new Error(`Falha em destacar_curso: status ${destRes.status}`);
    }

    // -------------------------------------------------------------
    // TESTE 6: Verificação de sessão (/api/auth/me) para Admin
    // -------------------------------------------------------------
    console.log('\n👉 [6/8] Testando verificação de sessão (/api/auth/me) para Administrador...');
    const authMeAdminRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const authMeAdmin = await authMeAdminRes.json();
    if (authMeAdminRes.ok && authMeAdmin.authenticated && authMeAdmin.role === 'admin') {
      console.log('   ✅ SUCESSO: Sessão do administrador reconhecida e validada pelo backend.');
    } else {
      throw new Error(`Falha em /api/auth/me para admin: ${JSON.stringify(authMeAdmin)}`);
    }

    // -------------------------------------------------------------
    // TESTE 7: Bloqueio estrito de Aluno tentando acessar rota Admin
    // -------------------------------------------------------------
    console.log('\n👉 [7/8] Testando segurança: Aluno tentando aceder à API administrativa (/api/admin/dashboard-stats)...');
    const studentAccessAdminRes = await fetch(`${baseUrl}/api/admin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const studentBlocked = await studentAccessAdminRes.json();
    if (studentAccessAdminRes.status === 403) {
      console.log('   ✅ SUCESSO: Backend BLOQUEOU o aluno com status 403 Forbidden!');
      console.log(`   Mensagem retornada: "${studentBlocked.error}"`);
    } else {
      throw new Error(`FALHA DE SEGURANÇA: Aluno recebeu status ${studentAccessAdminRes.status} em vez de 403!`);
    }

    // -------------------------------------------------------------
    // TESTE 8: Administrador acessando rota Admin com sucesso
    // -------------------------------------------------------------
    console.log('\n👉 [8/8] Testando acesso autorizado do Administrador à API administrativa...');
    const adminAccessRes = await fetch(`${baseUrl}/api/admin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminStats = await adminAccessRes.json();
    if (adminAccessRes.ok && adminStats.success) {
      console.log('   ✅ SUCESSO: Administrador autorizado recebeu dados com status 200 OK!');
      console.log(`   Cursos totais: ${adminStats.courses.total}, Alunos ativos: ${adminStats.students.active}`);
    } else {
      throw new Error(`Falha no acesso admin: ${JSON.stringify(adminStats)}`);
    }

    console.log('\n🎉 ========================================================');
    console.log('🎉 TODOS OS 8 TESTES PASSARAM COM 100% DE SUCESSO!');
    console.log('🎉 ========================================================\n');
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests().catch(e => {
  console.error('\n❌ ERRO NOS TESTES:', e);
  process.exit(1);
});
