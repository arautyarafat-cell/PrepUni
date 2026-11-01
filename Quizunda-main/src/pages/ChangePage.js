import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Container, Row, Col, Button, Spinner } from "react-bootstrap";
import { FaClipboardList } from "react-icons/fa";
import AppNavbar from "../components/AppNavbar";
import AppFooter from "../components/AppFooter";
import { API_BASE_URL } from "../config/apiConfig";

export default function SalasDeExame({ cursoId }) {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function carregarSalas() {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/salas`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        setSalas(Array.isArray(data) ? data : []);
      } catch (error) {
        // Mock default exams if offline
        setSalas([
          { id: 1, nome: "Simulado 01 - CBMPE (Português e Raciocínio Lógico)" },
          { id: 2, nome: "Simulado 02 - PMPE (Direito Constitucional e Penal)" },
          { id: 3, nome: "Simulado Geral - Guarda Civil Municipal" }
        ]);
      } finally {
        setLoading(false);
      }
    }
    carregarSalas();
  }, [cursoId]);

  return (
    <div style={{ backgroundColor: "#f8f8f8", minHeight: "100vh" }}>
      <AppNavbar />

      <div id="breadcrumb">
        <Container>
          <span className="titulo">Salas de Exame e Simulados</span>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/">Home</a></li>
              <li className="breadcrumb-item"><a href="/PortalPage">Portal</a></li>
              <li className="breadcrumb-item active" aria-current="page">Salas de Exame</li>
            </ol>
          </nav>
        </Container>
      </div>

      <Container className="py-4 py-md-5">
        <div className="titulo-novo-1">SIMULADÕES</div>
        <div className="titulo-novo-2">Salas de Exame Ativas</div>

        <p className="text-center text-muted mb-4">
          Treine com questões inéditas no formato das bancas examinadoras e avalie seu desempenho.
        </p>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-2">Carregando salas...</p>
          </div>
        ) : (
          <Row className="g-4">
            {salas.length > 0 ? (
              salas.map((sala) => (
                <Col xs={12} sm={6} md={4} key={sala.id}>
                  <Card className="h-100 shadow-sm border p-3 ep-quick-card">
                    <Card.Body className="d-flex flex-column text-center">
                      <div className="mb-3">
                        <div
                          style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(0, 68, 252, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto"
                          }}
                        >
                          <FaClipboardList className="text-primary fs-3" />
                        </div>
                      </div>
                      <Card.Title className="fw-bold fs-5 text-dark mb-3">
                        {sala.nome}
                      </Card.Title>
                      <Button
                        className="ep-btn-entrar w-100 mt-auto justify-content-center"
                        onClick={() => navigate(`/ExamPage/${sala.id}`)}
                      >
                        Iniciar Simulado
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Col xs={12} className="text-center py-4">
                <p className="text-muted">Nenhuma sala disponível no momento.</p>
              </Col>
            )}
          </Row>
        )}
      </Container>

      <AppFooter />
    </div>
  );
}
