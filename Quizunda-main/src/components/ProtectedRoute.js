// src/components/ProtectedRoute.js
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { Spinner, Container } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";
import { AdminAuthContext } from "../context/AuthContext1";

/**
 * Guarda de rota para estudantes e perfis da plataforma de aprendizagem (LMS).
 * Garante que:
 * - Não autenticados vão para /login.
 * - Administradores não sejam enviados desnecessariamente para a interface de alunos -> redireciona para /AdminDashboard.
 * - Estudantes e papéis permitidos acedem livremente.
 */
const ProtectedRoute = ({ allowedRoles = ["estudante"], children }) => {
  const { user, loading: userLoading } = useContext(AuthContext);
  const { admin, loading: adminLoading } = useContext(AdminAuthContext);

  const loading = userLoading || adminLoading;

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  const currentUser = user || admin;

  // 1. Se não houver sessão ativa -> vai para login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const role = (currentUser.role || currentUser.accountType || "").toLowerCase();

  // 2. Se for administrador ou instrutor -> redireciona diretamente para o painel de gestão
  // evitando que caiam inadvertidamente na interface exclusiva de aluno
  const isStaff = ["admin", "instrutor", "instructor", "professor"].includes(role);
  if (isStaff && !allowedRoles.includes("instrutor") && !allowedRoles.includes("admin")) {
    return <Navigate to="/AdminDashboard" replace />;
  }

  // 3. Validação das roles permitidas (ex: estudante, aluno, preparatorio, instrutor)
  const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());
  const normalizedRole = (role === "aluno" || role === "estudante") ? "estudante" : role;
  const isAllowed = normalizedAllowed.includes(role) || 
                    (normalizedRole === "estudante" && (normalizedAllowed.includes("estudante") || normalizedAllowed.includes("aluno")));

  if (!isAllowed) {
    if (isStaff) {
      return <Navigate to="/AdminDashboard" replace />;
    }
    if (role === "preparatorio") {
      return <Navigate to="/config" replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
