const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("./db.js");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, emailOrPhone, password, accountType } = req.body;

    if (!name || !emailOrPhone || !password || !accountType) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios." });
    }

    // validar tipo de conta
    const validRoles = ["estudante", "preparatorio", "instrutor"]; // aceita valores válidos
    if (!validRoles.includes(accountType)) {
      return res.status(400).json({ message: "Tipo de conta inválido. Use 'estudante', 'instrutor' ou 'preparatorio'." });
    }


    // verificar se já existe usuário com o mesmo email/telefone
    const [rows] = await pool.query("SELECT * FROM users WHERE emailOrPhone = ?", [emailOrPhone]);
    if (rows.length > 0) {
      return res.status(400).json({ message: "Este email ou telemóvel já está registrado." });
    }

    // hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // inserir novo usuário
    await pool.query(
      "INSERT INTO users (name, emailOrPhone, password, accountType) VALUES (?, ?, ?, ?)",
      [name, emailOrPhone, hashedPassword, accountType]
    );

    res.status(201).json({
      message: "Conta criada com sucesso!",
      role: accountType, // já retorna o role para o frontend
      user: { name, emailOrPhone, accountType }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro no servidor." });
  }
});

module.exports = router;
