// src/components/AdminGateway.js
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { Spinner, Container } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";

/**
 * Gateway inteligente para a rota `/admin`.
 * Garante que:
 * - Se não autenticado -> redireciona para login (com redirect para o painel admin).
 * - Se admin -> redireciona para `/AdminDashboard`.
 * - Se aluno / não-admin -> bloqueia acesso administrativo e redireciona para o portal LMS do aluno.
 */
export default function AdminGateway() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <Container className="d-flex flex-column justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
        <span className="mt-3 text-muted">A verificar permissões de acesso...</span>
      </Container>
    );
  }

  // Se não autenticado, encaminha para login
  if (!user) {
    return <Navigate to="/login?redirect=/AdminDashboard" replace />;
  }

  const role = (user.role || user.accountType || "").toLowerCase();

  // Se administrador ou instrutor, encaminha para o painel administrativo/dashboard
  if (["admin", "instrutor", "instructor", "professor"].includes(role)) {
    return <Navigate to="/AdminDashboard" replace />;
  }

  if (role === "preparatorio") {
    return <Navigate to="/config" replace />;
  }

  // Se for aluno ou outro utilizador, manda para o LMS do aluno
  return <Navigate to="/PortalPage" replace />;
}

