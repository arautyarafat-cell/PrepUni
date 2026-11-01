import React from 'react';
import { Container, Button } from 'react-bootstrap';
import AppNavbar from '../components/AppNavbar';
import AppFooter from '../components/AppFooter';
import { useSettings } from '../context/SettingsContext';

export default function Mentoria() {
  const { getWhatsAppLink } = useSettings();
  return (
    <div style={{ backgroundColor: "#f8f8f8", minHeight: "100vh" }}>
      <AppNavbar />
      
      <div id="breadcrumb">
        <Container>
          <span className="titulo">Programa de Mentoria</span>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/">Home</a></li>
              <li className="breadcrumb-item active" aria-current="page">Mentoria</li>
            </ol>
          </nav>
        </Container>
      </div>

      <Container className="py-5 text-center">
        <div className="bg-white p-5 rounded shadow-sm border" style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              backgroundColor: "rgba(0, 68, 252, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px"
            }}
          >
            <i className="fa fa-user-tie fa-2x text-primary"></i>
          </div>
          <h2 className="ep-auth-title mb-3" style={{ color: "#0044fc" }}>
            Mentoria Especializada
          </h2>
          <p className="text-muted lead mb-4">
            Acompanhamento individualizado com professores especialistas para organizar seu cronograma de estudos, tirar dúvidas e acelerar sua aprovação.
          </p>
          <Button
            className="ep-btn-entrar px-4 py-2"
            href={getWhatsAppLink("Olá! Gostaria de saber mais sobre o programa de mentoria.")}
            target="_blank"
            rel="noreferrer"
          >
            <i className="fab fa-whatsapp me-2"></i> Falar com o Coordenador Pedagógico
          </Button>
        </div>
      </Container>

      <AppFooter />
    </div>
  );
}
