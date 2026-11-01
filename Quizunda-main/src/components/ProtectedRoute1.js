// src/components/ProtectedRoute1.js
import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner, Container } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";
import { AdminAuthContext } from "../context/AuthContext1";

/**
 * Guarda de rota estrita para a área administrativa.
 * Garante que apenas administradores autenticados e autorizados acedam à plataforma admin.
 * Qualquer aluno ou utilizador comum que tente aceder é automaticamente impedido e redirecionado para a plataforma de estudos (LMS).
 */
export default function ProtectedRoute1({ children, allowedUsers }) {
  const { user, loading: userLoading } = useContext(AuthContext);
  const { admin, loading: adminLoading } = useContext(AdminAuthContext);
  const location = useLocation();

  const loading = userLoading || adminLoading;

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  const currentUser = user || admin;

  // 1. Se não houver utilizador autenticado, redireciona para login
  if (!currentUser) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${returnUrl}`} replace />;
  }

  const role = (currentUser.role || currentUser.accountType || "").toLowerCase();
  const isAuthorized = ["admin", "instrutor", "instructor", "professor", "preparatorio"].includes(role);

  // 2. Se não for administrador ou instrutor, impede expressamente o acesso e manda para o LMS do aluno
  if (!isAuthorized) {
    return <Navigate to="/PortalPage" replace />;
  }

  // 3. Validação adicional por username se configurado
  if (allowedUsers && allowedUsers.length > 0) {
    const username = currentUser.username || currentUser.name || "";
    if (!allowedUsers.includes(username) && !isAuthorized) {
      return <Navigate to="/PortalPage" replace />;
    }
  }

  // 4. Utilizador autenticado e autorizado
  return children;
}
