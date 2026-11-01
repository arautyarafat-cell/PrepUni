import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import AppNavbar from "../components/AppNavbar";
import AppFooter from "../components/AppFooter";
import { useSettings } from "../context/SettingsContext";

export default function Contato() {
  const { settings, getWhatsAppLink, getWhatsAppDisplay } = useSettings();

  const whatsappUrl = getWhatsAppLink();
  const whatsappDisplay = getWhatsAppDisplay();
  return (
    <div style={{ backgroundColor: "#f8f8f8", minHeight: "100vh" }}>
      <AppNavbar />

      <div id="breadcrumb">
        <Container>
          <span className="titulo">Fale Conosco</span>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/">Home</a></li>
              <li className="breadcrumb-item active" aria-current="page">Contato</li>
            </ol>
          </nav>
        </Container>
      </div>

      <div id="fale-conosco" className="py-5">
        <Container className="pt-2 pb-5">
          <div className="titulo-novo-1">ATENDIMENTO</div>
          <div className="titulo-novo-2">Estamos prontos para te ajudar</div>

          <p className="text-center text-muted mb-5" style={{ maxWidth: "700px", margin: "0 auto" }}>
            Tire suas dúvidas sobre matrículas, cursos preparatórios, editais de concursos e acesso ao portal através dos nossos canais oficiais de comunicação.
          </p>

          <Row className="g-4 justify-content-center">
            {/* WhatsApp */}
            <Col xs={12} sm={6} lg={3}>
              <Card className="h-100 border text-center p-4 shadow-sm ep-quick-card">
                <div className="my-2">
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(37, 211, 102, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto"
                    }}
                  >
                    <i className="fab fa-whatsapp fa-2x text-success"></i>
                  </div>
                </div>
                <h5 className="fw-bold mt-3">WhatsApp</h5>
                <p className="text-muted small">
                  {settings.whatsapp_description || "Atendimento rápido e suporte a dúvidas sobre cursos e matrículas."}
                </p>
                <div className="fw-bold mb-3">{whatsappDisplay || "(81) 99757-0784"}</div>
                <Button
                  variant="success"
                  className="w-100 fw-bold"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Chamar no WhatsApp
                </Button>
              </Card>
            </Col>

            {/* Instagram */}
            <Col xs={12} sm={6} lg={3}>
              <Card className="h-100 border text-center p-4 shadow-sm ep-quick-card">
                <div className="my-2">
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(225, 48, 108, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto"
                    }}
                  >
                    <i className="fab fa-instagram fa-2x" style={{ color: "#e1306c" }}></i>
                  </div>
                </div>
                <h5 className="fw-bold mt-3">Instagram</h5>
                <p className="text-muted small">
                  {settings.instagram_description || "Acompanhe dicas diárias, notícias de editais e lives exclusivas."}
                </p>
                <div className="fw-bold mb-3">{settings.instagram_handle || "@estoupreparadoconcursos"}</div>
                <Button
                  variant="outline-danger"
                  className="w-100 fw-bold"
                  href={settings.instagram_url || "https://www.instagram.com/estoupreparadoconcursos/"}
                  target="_blank"
                  rel="noreferrer"
                >
                  Seguir no Instagram
                </Button>
              </Card>
            </Col>

            {/* YouTube */}
            <Col xs={12} sm={6} lg={3}>
              <Card className="h-100 border text-center p-4 shadow-sm ep-quick-card">
                <div className="my-2">
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(196, 48, 43, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto"
                    }}
                  >
                    <i className="fab fa-youtube fa-2x text-danger"></i>
                  </div>
                </div>
                <h5 className="fw-bold mt-3">YouTube</h5>
                <p className="text-muted small">
                  {settings.youtube_description || "Aulas gratuitas, correções de provas e análises de bancas."}
                </p>
                <div className="fw-bold mb-3">{settings.youtube_title || "Preparatório Universitário Oficial"}</div>
                <Button
                  variant="outline-danger"
                  className="w-100 fw-bold"
                  href={settings.youtube_url || "https://www.youtube.com/user/isaqueljoao"}
                  target="_blank"
                  rel="noreferrer"
                >
                  Acessar Canal
                </Button>
              </Card>
            </Col>

            {/* Localização / Unidade Física */}
            <Col xs={12} sm={6} lg={3}>
              <Card className="h-100 border text-center p-4 shadow-sm ep-quick-card">
                <div className="my-2">
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(0, 68, 252, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto"
                    }}
                  >
                    <i className="fa fa-map-marker-alt fa-2x text-primary"></i>
                  </div>
                </div>
                <h5 className="fw-bold mt-3">{settings.location_title || "Unidade Física"}</h5>
                <p className="text-muted small">
                  {settings.location_description || "Cursos e simulados presenciais no estado de Pernambuco."}
                </p>
                <div className="fw-bold mb-3">{settings.location_address || "Limoeiro / Recife - PE"}</div>
                <Button
                  className="w-100 ep-btn-entrar"
                  href={settings.location_link || "/CoursesPage"}
                >
                  {settings.location_button_text || "Ver Cursos Presenciais"}
                </Button>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      <AppFooter />
    </div>
  );
}
