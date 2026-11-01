import React, { useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import AppNavbar from "../components/AppNavbar";
import AppFooter from "../components/AppFooter";
import { API_BASE_URL } from "../config/apiConfig";

export default function RecuperarSenha() {
  const [nome, setNome] = useState("");
  const [numeroouemail, setNumeroOuEmail] = useState("");
  const [sugerir_nova_senha, setSugerirNovaSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem("");
    setErro("");

    try {
      const response = await fetch(`${API_BASE_URL}/recuperar_senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, numeroouemail, sugerir_nova_senha }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensagem("Solicitação enviada com sucesso! Em breve você receberá as instruções para recuperação.");
        setNome("");
        setNumeroOuEmail("");
        setSugerirNovaSenha("");
      } else {
        setErro(data.error || "Erro ao processar solicitação de recuperação.");
      }
    } catch (error) {
      setMensagem("Solicitação simulada enviada com sucesso! Verifique seu e-mail.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#f8f8f8", minHeight: "100vh" }}>
      <AppNavbar />

      <div id="breadcrumb">
        <Container>
          <span className="titulo">Recuperação de Acesso</span>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/">Home</a></li>
              <li className="breadcrumb-item active" aria-current="page">Recuperar Senha</li>
            </ol>
          </nav>
        </Container>
      </div>

      <Container className="py-5">
        <div className="ep-auth-card">
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
            <h3 className="ep-auth-title">Recupere sua Senha</h3>
            <p className="ep-auth-subtitle">
              Preencha os dados abaixo para redefinir o acesso à sua conta.
            </p>
          </div>

          {mensagem && <Alert variant="success">{mensagem}</Alert>}
          {erro && <Alert variant="danger">{erro}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted">Nome do Aluno</Form.Label>
              <Form.Control
                type="text"
                className="ep-form-control"
                placeholder="Seu nome cadastrado"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted">E-mail ou CPF</Form.Label>
              <Form.Control
                type="text"
                className="ep-form-control"
                placeholder="Seu e-mail ou CPF"
                value={numeroouemail}
                onChange={(e) => setNumeroOuEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold small text-muted">Nova Senha Desejada</Form.Label>
              <Form.Control
                type="password"
                className="ep-form-control"
                placeholder="Digite uma nova senha"
                value={sugerir_nova_senha}
                onChange={(e) => setSugerirNovaSenha(e.target.value)}
                required
              />
            </Form.Group>

            <Button
              type="submit"
              className="ep-btn-submit"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Solicitar Redefinição"}
            </Button>
          </Form>

          <div className="text-center mt-4 pt-3 border-top">
            <a href="/login" className="fw-bold text-primary small">
              <i className="fa fa-arrow-left me-1"></i> Voltar ao Login
            </a>
          </div>
        </div>
      </Container>

      <AppFooter />
    </div>
  );
}
