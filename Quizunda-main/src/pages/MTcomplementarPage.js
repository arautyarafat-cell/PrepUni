import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Modal } from "react-bootstrap";
import AppNavbar from "../components/AppNavbar";
import AppFooter from "../components/AppFooter";
import { API_BASE_URL } from "../config/apiConfig";
import "./MaterialCard.css";

export default function MTcomplementarPage() {
  const [materials, setMaterials] = useState([]);
  const [show, setShow] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/materials`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
          setMaterials(data);
        } else {
          setMaterials([
            { id: 1, title: "Resumo Esquemático: Direito Constitucional", description: "Esquemas práticos e mapas mentais sobre direitos fundamentais e organização do estado.", fileUrl: "#" },
            { id: 2, title: "Guia de Redação para Concursos Policiais", description: "Estruturas prontas, temas cotados e critérios de correção das principais bancas.", fileUrl: "#" },
            { id: 3, title: "Manual de Raciocínio Lógico e Quantitativo", description: "Fórmulas, atalhos de cálculo e 200 questões resolvidas passo a passo.", fileUrl: "#" }
          ]);
        }
      } catch (error) {
        setMaterials([
          { id: 1, title: "Resumo Esquemático: Direito Constitucional", description: "Esquemas práticos e mapas mentais sobre direitos fundamentais e organização do estado.", fileUrl: "#" },
          { id: 2, title: "Guia de Redação para Concursos Policiais", description: "Estruturas prontas, temas cotados e critérios de correção das principais bancas.", fileUrl: "#" },
          { id: 3, title: "Manual de Raciocínio Lógico e Quantitativo", description: "Fórmulas, atalhos de cálculo e 200 questões resolvidas passo a passo.", fileUrl: "#" }
        ]);
      }
    };
    fetchMaterials();
  }, []);

  const handleShow = (material) => {
    setSelectedMaterial(material);
    setShow(true);
  };

  return (
    <div style={{ backgroundColor: "#f8f8f8", minHeight: "100vh" }}>
      <AppNavbar />

      <div id="breadcrumb">
        <Container>
          <span className="titulo">Materiais Complementares</span>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/">Home</a></li>
              <li className="breadcrumb-item"><a href="/PortalPage">Portal</a></li>
              <li className="breadcrumb-item active" aria-current="page">Material Complementar</li>
            </ol>
          </nav>
        </Container>
      </div>

      <Container className="py-4 py-md-5">
        <div className="titulo-novo-1">ARQUIVOS E PDFs</div>
        <div className="titulo-novo-2">Material de Apoio e Mapas Mentais</div>

        <Row className="g-4">
          {materials.map((m) => (
            <Col xs={12} sm={6} md={4} key={m.id}>
              <Card className="h-100 shadow-sm border p-3 ep-quick-card">
                <Card.Body className="d-flex flex-column text-start">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="badge bg-primary">PDF</span>
                    <i className="far fa-file-pdf text-danger fs-4"></i>
                  </div>
                  <Card.Title className="fw-bold fs-6 text-dark mb-2">
                    {m.title}
                  </Card.Title>
                  <Card.Text className="text-muted small mb-4 flex-grow-1">
                    {m.description}
                  </Card.Text>
                  <Button
                    className="ep-btn-entrar w-100 justify-content-center"
                    onClick={() => handleShow(m)}
                  >
                    <i className="fa fa-download me-2"></i> Acessar Arquivo
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Modal de Detalhes do Material */}
      <Modal show={show} onHide={() => setShow(false)} centered>
        {selectedMaterial && (
          <>
            <Modal.Header closeButton>
              <Modal.Title className="fw-bold" style={{ color: "#0044fc" }}>
                {selectedMaterial.title}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <p className="text-muted">{selectedMaterial.description}</p>
              <Button
                className="ep-btn-entrar w-100 py-3"
                onClick={() => {
                  alert("Download iniciado!");
                  setShow(false);
                }}
              >
                <i className="fa fa-file-download me-2"></i> Baixar Arquivo Agora
              </Button>
            </Modal.Body>
          </>
        )}
      </Modal>

      <AppFooter />
    </div>
  );
}
