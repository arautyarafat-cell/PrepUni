import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import AppNavbar from "../components/AppNavbar";
import AppFooter from "../components/AppFooter";
import { API_BASE_URL, getUploadUrl } from "../config/apiConfig";
import "./Sobre.css";

export default function Sobre() {
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/professores`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setProfessores(data);
        } else {
          setProfessores([]);
        }
      })
      .catch(() => {
        setProfessores([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ backgroundColor: "#f8f8f8", minHeight: "100vh" }}>
      <AppNavbar />

      {/* 🔹 Breadcrumb */}
      <div id="breadcrumb">
        <Container>
          <span className="titulo">Sobre</span>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/">Home</a></li>
              <li className="breadcrumb-item active" aria-current="page">Sobre</li>
            </ol>
          </nav>
        </Container>
      </div>

      <div id="sobre" className="py-5">
        <Container className="pt-2 pb-5">
          <div className="titulo-novo-1">Conheça</div>
          <div className="titulo-novo-2">Nossa História</div>

          <div className="bg-white p-4 p-md-5 rounded shadow-sm border mb-5">
            <p className="lead" style={{ lineHeight: "1.8", color: "#333", textIndent: "0" }}>
              A <strong>PLATAFORMA PREPARATÓRIO UNIVERSITÁRIO</strong> surgiu com o objetivo de oferecer uma
              preparação de excelência para as provas de Exames de Admissão, Vestibulares e
              Seleções Acadêmicas.
            </p>
            <p style={{ lineHeight: "1.8", color: "#555", textIndent: "0" }}>
              O <strong>PREPARATÓRIO UNIVERSITÁRIO</strong> possui uma qualificada equipe de docentes que tem o
              propósito de capacitar nossos estudantes para enfrentar os desafios dos diversos processos
              de seleção universitária. Os cursos oferecidos pela plataforma são calcados na excelência na qualidade de
              ensino, simulados estruturados e acompanhamento contínuo. A finalidade maior de nossa
              equipe é <strong>REALIZAR OS SEUS SONHOS</strong>.
            </p>

            <Row className="mt-5 g-4">
              <Col md={6}>
                <div className="p-4 rounded h-100" style={{ backgroundColor: "#f0f4ff", borderLeft: "4px solid #0044fc" }}>
                  <h4 className="fw-bold" style={{ color: "#0044fc" }}>Missão</h4>
                  <p className="text-secondary mb-4" style={{ textIndent: "0" }}>
                    Oferecer cursos com excelência e qualidade, disseminando saberes que visam à
                    preparação integral de estudantes e profissionais para a conquista da admissão
                    e sucesso no ensino superior.
                  </p>

                  <h4 className="fw-bold" style={{ color: "#0044fc" }}>Visão</h4>
                  <p className="text-secondary mb-0" style={{ textIndent: "0" }}>
                    Tornar-se a maior referência em preparação acadêmica e exames de admissão,
                    unindo tecnologia avançada e compromisso pedagógico.
                  </p>
                </div>
              </Col>

              <Col md={6}>
                <div className="p-4 rounded h-100" style={{ backgroundColor: "#fff7f0", borderLeft: "4px solid #f86f03" }}>
                  <h4 className="fw-bold" style={{ color: "#f86f03" }}>Nossos Valores</h4>
                  <ul className="list-unstyled text-secondary" style={{ lineHeight: "2" }}>
                    <li><i className="fa fa-check-circle text-primary me-2"></i> Ética, transparência e compromisso com o estudante</li>
                    <li><i className="fa fa-check-circle text-primary me-2"></i> Equipe docente com elevado grau de especialização</li>
                    <li><i className="fa fa-check-circle text-primary me-2"></i> Inovação didática e constante atualização com os programas</li>
                    <li><i className="fa fa-check-circle text-primary me-2"></i> Responsabilidade social e inclusão pelo ensino</li>
                  </ul>
                </div>
              </Col>
            </Row>

            <div className="mt-5 pt-4 border-top">
              <h5 className="fw-bold text-dark mb-3">Dados Institucionais</h5>
              <Row className="text-muted small">
                <Col md={6} className="mb-2">
                  <strong>Instituição:</strong> PrepUni - Preparatório Universitário
                </Col>
                <Col md={6} className="mb-2">
                  <strong>Plataforma:</strong> Sistema de Aprendizagem e Preparação Universitária
                </Col>
              </Row>
            </div>
          </div>

          {/* 🔹 Corpo Docente / Equipe */}
          <div className="titulo-novo-1 mt-5">CONHEÇA</div>
          <div className="titulo-novo-2">Nossa Equipe de Professores</div>

          {loading ? (
            <div className="text-center py-4 text-muted">
              <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
              A carregar corpo docente...
            </div>
          ) : professores.length > 0 ? (
            <Row className="g-4">
              {professores.map((prof, i) => (
                <Col key={prof.id || i} xs={12} sm={6} md={4}>
                  <Card className="h-100 border shadow-sm text-center p-3">
                    <div className="my-3 d-flex justify-content-center">
                      {prof.avatar ? (
                        <img
                          src={getUploadUrl(prof.avatar)}
                          alt={prof.name}
                          style={{
                            width: "100px",
                            height: "100px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "3px solid #0044fc"
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(prof.name)}&background=0044fc&color=fff&size=160&bold=true`;
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100px",
                            height: "100px",
                            borderRadius: "50%",
                            backgroundColor: "#eef2ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "3px solid #0044fc"
                          }}
                        >
                          <i className="fa fa-chalkboard-teacher fa-2x text-primary"></i>
                        </div>
                      )}
                    </div>
                    <Card.Body>
                      <Card.Title className="fw-bold fs-5">{prof.name}</Card.Title>
                      <div className="text-primary fw-semibold small mb-2">{prof.role || "Instrutor"}</div>
                      <Card.Text className="text-muted small" style={{ lineHeight: "1.6" }}>
                        {prof.bio || "Docente dedicado à preparação acadêmica dos estudantes."}
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center py-4 text-muted">
              <i className="fa fa-user-tie fa-2x mb-2 d-block text-secondary"></i>
              Nenhum professor registrado no momento.
            </div>
          )}
        </Container>
      </div>

      <AppFooter />
    </div>
  );
}
