import React, { useState, useEffect, useContext } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppNavbar from "../components/AppNavbar";
import AppFooter from "../components/AppFooter";
import { AuthContext } from "../context/AuthContext";
import { getRedirectPathForRole } from "../utils/roleRedirect";
import "./LoginPage.css";

export default function LoginPage() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const { user, login } = useContext(AuthContext);

  // Redirecionamento automático caso o utilizador já esteja autenticado
  useEffect(() => {
    if (user) {
      const destination = redirectParam || getRedirectPathForRole(user.role);
      navigate(destination, { replace: true });
    }
  }, [user, redirectParam, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const loggedUser = await login(emailOrPhone, password);
      const role = (loggedUser.role || "").toLowerCase();

      setMessage("Autenticação realizada com sucesso! A preparar ambiente...");

      let destination = "";
      const isStaff = ["admin", "instrutor", "instructor", "professor"].includes(role);
      if (isStaff) {
        destination = redirectParam && !redirectParam.includes("Portal") ? redirectParam : "/AdminDashboard";
      } else if (role === "preparatorio") {
        destination = "/config";
      } else {
        destination = redirectParam && !redirectParam.toLowerCase().includes("admin") ? redirectParam : "/PortalPage";
      }

      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 700);
    } catch (err) {
      console.error("Erro ao efetuar login:", err);
      setError(err.message || "Credenciais inválidas. Verifique os dados introduzidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ep-auth-page">
      <AppNavbar />

      {/* Breadcrumb Estou Preparado */}
      <div id="breadcrumb">
        <Container>
          <span className="titulo">Acesso à Plataforma</span>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/">Home</a></li>
              <li className="breadcrumb-item active" aria-current="page">Login</li>
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
            <h2 className="ep-auth-title">Acesse sua conta</h2>
            <p className="ep-auth-subtitle">
              Entre com suas credenciais de aluno ou administrador.
            </p>
          </div>

          {message && <Alert variant="success">{message}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted">E-mail, CPF ou Usuário</Form.Label>
              <Form.Control
                type="text"
                className="ep-form-control"
                placeholder="Digite seu e-mail, CPF ou usuário admin"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
                autoFocus
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <Form.Label className="fw-semibold small text-muted">Senha</Form.Label>
                <a href="/RecuperarSenha" className="small fw-semibold text-primary">
                  Esqueceu?
                </a>
              </div>
              <Form.Control
                type="password"
                className="ep-form-control"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button
              type="submit"
              className="ep-btn-submit"
              disabled={loading}
            >
              {loading ? "A entrar..." : "Entrar na Plataforma"}
            </Button>
          </Form>

          <div className="text-center mt-4 pt-3 border-top">
            <span className="text-muted small">Não possui cadastro? </span>
            <a href="/RegisterPage" className="fw-bold text-primary small">
              Criar Nova Conta
            </a>
          </div>
        </div>
      </Container>

      <AppFooter />
    </div>
  );
}
