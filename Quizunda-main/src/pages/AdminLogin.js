// src/pages/AdminLogin.js
import React, { useState, useEffect, useContext } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { AdminAuthContext } from "../context/AuthContext1";
import AppNavbar from "../components/AppNavbar";
import AppFooter from "../components/AppFooter";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);
  const { admin, login } = useContext(AdminAuthContext);

  // Redirecionamento automático caso já esteja autenticado
  useEffect(() => {
    const active = user || admin;
    if (active) {
      const role = (active.role || active.accountType || "").toLowerCase();
      if (["admin", "instrutor", "instructor", "professor"].includes(role)) {
        navigate("/AdminDashboard", { replace: true });
      } else {
        navigate("/PortalPage", { replace: true });
      }
    }
  }, [user, admin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      navigate("/AdminDashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Usuário ou senha de administrador incorretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#f8f8f8", minHeight: "100vh" }}>
      <AppNavbar />

      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="ep-auth-card" style={{ maxWidth: "420px" }}>
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
            <h3 className="ep-auth-title">Painel Administrativo</h3>
            <p className="ep-auth-subtitle">
              Acesso restrito para gestão de cursos e usuários.
            </p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted">Usuário Administrador</Form.Label>
              <Form.Control
                type="text"
                className="ep-form-control"
                placeholder="Ex: admin1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold small text-muted">Senha de Acesso</Form.Label>
              <Form.Control
                type="password"
                className="ep-form-control"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button type="submit" className="ep-btn-submit" disabled={loading}>
              {loading ? "A autenticar..." : "Entrar no Painel Admin"}
            </Button>
          </Form>

          <div className="text-center mt-4 pt-3 border-top">
            <a href="/" className="fw-bold text-primary small">
              <i className="fa fa-arrow-left me-1"></i> Voltar à Home
            </a>
          </div>
        </div>
      </div>

      <AppFooter />
    </div>
  );
}
