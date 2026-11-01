const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db.js");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "segredo_super_seguranca";

router.post("/login", async (req, res) => {
  try {
    const rawIdentifier = req.body.emailOrPhone || req.body.username || req.body.email;
    const password = req.body.password;

    if (!rawIdentifier || !password) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios." });
    }

    const identifier = String(rawIdentifier).trim();
    const cleanDigits = identifier.replace(/[^0-9]/g, "");

    // 1. Verificar primeiro na tabela admin (ex: admin, admin1, admin2, administrador)
    let [adminRows] = await pool.query(
      "SELECT * FROM admin WHERE LOWER(username) = LOWER(?)",
      [identifier]
    );

    // Fallback flexível para admin se for digitado "admin" ou "administrador"
    if ((!adminRows || adminRows.length === 0) && (identifier.toLowerCase() === "admin" || identifier.toLowerCase() === "administrador")) {
      const [fallbackAdmins] = await pool.query(
        "SELECT * FROM admin WHERE LOWER(username) IN ('admin', 'admin1') LIMIT 1"
      );
      if (fallbackAdmins && fallbackAdmins.length > 0) {
        adminRows = fallbackAdmins;
      }
    }

    if (adminRows && adminRows.length > 0) {
      const admin = adminRows[0];
      const isMatch = await bcrypt.compare(password, admin.password);

      if (isMatch) {
        const token = jwt.sign(
          {
            id: admin.id,
            username: admin.username,
            name: admin.username,
            role: "admin",
            accountType: "admin"
          },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        return res.json({
          message: "Login de administrador realizado com sucesso!",
          token,
          role: "admin",
          accountType: "admin",
          user: {
            id: admin.id,
            name: admin.username,
            username: admin.username,
            emailOrPhone: admin.username,
            role: "admin",
            accountType: "admin"
          }
        });
      } else {
        return res.status(400).json({ message: "Senha incorreta de administrador." });
      }
    }

    // 2. Verificar na tabela users (estudantes, instrutores, preparatórios)
    // Busca abrangente por e-mail, telefone, dígitos de telefone ou nome completo
    let queryUsers = `
      SELECT * FROM users 
      WHERE LOWER(emailOrPhone) = LOWER(?)
         OR LOWER(phone) = LOWER(?)
         OR LOWER(name) = LOWER(?)
    `;
    let queryParams = [identifier, identifier, identifier];

    if (cleanDigits.length >= 6) {
      queryUsers += ` OR REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') LIKE ?`;
      queryParams.push(`%${cleanDigits}%`);
    }

    const [userRows] = await pool.query(queryUsers, queryParams);

    if (!userRows || userRows.length === 0) {
      return res.status(400).json({ message: "Usuário não encontrado." });
    }

    const user = userRows[0];

    // Comparar senha com hash seguro bcrypt
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Senha incorreta." });
    }

    // Determinar papel (role) normalizado
    const userRole = (user.accountType === "admin" || (user.role && user.role.toLowerCase() === "admin"))
      ? "admin"
      : (user.accountType || user.role || "estudante").toLowerCase();

    // Gerar token JWT com id e role
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: userRole,
        accountType: user.accountType
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login realizado com sucesso!",
      token,
      id: user.id,
      role: userRole,
      accountType: user.accountType,
      user: {
        id: user.id,
        name: user.name,
        emailOrPhone: user.emailOrPhone,
        role: userRole,
        accountType: user.accountType,
        phone: user.phone || "",
        bio: user.bio || "",
        avatar: user.avatar || null
      }
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro no servidor." });
  }
});

module.exports = router;
