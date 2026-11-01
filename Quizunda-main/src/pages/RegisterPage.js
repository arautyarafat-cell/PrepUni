import React, { useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import AppNavbar from "../components/AppNavbar";
import AppFooter from "../components/AppFooter";
import { API_BASE_URL } from "../config/apiConfig";
import "./RegisterPage.css";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState("estudante");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("As senhas informadas não coincidem.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, emailOrPhone, password, accountType }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Cadastro realizado com sucesso! Redirecionando para login...");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setError(data.message || "Não foi possível concluir o cadastro.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Cadastro demonstrativo criado! Redirecionando para o login...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ep-auth-page">
      <AppNavbar />

      <div id="breadcrumb">
        <Container>
          <span className="titulo">Cadastro de Aluno</span>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/">Home</a></li>
              <li className="breadcrumb-item active" aria-current="page">Cadastre-se</li>
            </ol>
          </nav>
        </Container>
      </div>

      <Container className="py-5">
        <div className="ep-auth-card" style={{ maxWidth: "520px" }}>
          <div className="text-center mb-4">
            <img
              src="/logo-preparatorio.svg"
              alt="Preparatório Universitário"
              className="ep-logo-img mb-3"
              style={{ maxHeight: "55px" }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/logo.svg";
              }}
            />
            <h2 className="ep-auth-title">Crie sua conta</h2>
            <p className="ep-auth-subtitle">
              Inicie agora seus estudos com a metodologia líder em aprovações.
            </p>
          </div>

          {message && <Alert variant="success">{message}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted">Nome Completo</Form.Label>
              <Form.Control
                type="text"
                className="ep-form-control"
                placeholder="Ex: João da Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted">E-mail ou CPF</Form.Label>
              <Form.Control
                type="text"
                className="ep-form-control"
                placeholder="Digite seu e-mail ou CPF"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted">Tipo de Conta</Form.Label>
              <Form.Select
                className="ep-form-control"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
              >
                <option value="estudante">Estudante / Concurseiro</option>
                <option value="preparatório">Professor / Preparatório</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted">Senha</Form.Label>
              <Form.Control
                type="password"
                className="ep-form-control"
                placeholder="Crie uma senha forte (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold small text-muted">Confirme a Senha</Form.Label>
              <Form.Control
                type="password"
                className="ep-form-control"
                placeholder="Repita sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button
              type="submit"
              className="ep-btn-submit"
              disabled={loading}
            >
              {loading ? "Cadastrando..." : "Concluir Cadastro"}
            </Button>
          </Form>

          <div className="text-center mt-4 pt-3 border-top">
            <span className="text-muted small">Já possui cadastro? </span>
            <a href="/login" className="fw-bold text-primary small">
              Fazer Login
            </a>
          </div>
        </div>
      </Container>

      <AppFooter />
    </div>
  );
}
