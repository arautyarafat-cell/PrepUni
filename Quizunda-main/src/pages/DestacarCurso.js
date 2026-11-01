import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Spinner } from "react-bootstrap";

export default function DestacarCurso() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/AdminDashboard?tab=courses", { replace: true });
  }, [navigate]);

  return (
    <Container className="text-center py-5">
      <Spinner animation="border" variant="primary" />
      <p className="mt-3 text-muted">A carregar gestão de cursos e destaques...</p>
    </Container>
  );
}
