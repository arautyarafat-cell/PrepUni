import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useSettings } from "../context/SettingsContext";
import { API_BASE_URL } from "../config/apiConfig";

export default function AppFooter() {
  const { settings, getWhatsAppLink } = useSettings();
  const whatsappUrl = getWhatsAppLink();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE_URL}/cursos`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setCourses(data);
        }
      })
      .catch((err) => {
        console.warn("Erro ao buscar cursos para o rodapé:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer id="rodape" className="ep-footer">
      <Container fluid className="px-3 px-md-4 px-xl-5">
        <Row className="gy-3">
          {/* Coluna 1: Logo e Instituição */}
          <Col xs={12} sm={6} lg={3}>
            <a href="/">
              <img
                src="/logo-preparatorio.svg"
                alt="Preparatório Universitário"
                className="ep-logo-img mb-2"
                style={{ maxHeight: "40px" }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/logo.svg";
                }}
              />
            </a>
            <p className="fw-bold mb-1">CNPJ 40.336.270/0001-92</p>
            <p className="small text-muted mb-2">
              A nossa plataforma possui uma experiente equipe de professores que tem o propósito
              de capacitar nossos estudantes para enfrentar os desafios dos diversos processos de seleção.
            </p>
            <div className="ep-social-links">
              <a
                href={settings.youtube_url || "https://www.youtube.com/user/isaqueljoao"}
                target="_blank"
                rel="noreferrer"
                className="ep-social-btn youtube"
                title="YouTube"
              >
                <i className="fab fa-youtube"></i>
              </a>
              <a
                href={settings.facebook_url || "https://www.facebook.com"}
                target="_blank"
                rel="noreferrer"
                className="ep-social-btn facebook"
                title="Facebook"
              >
                <i className="fab fa-facebook-f"></i>
              </a>
              <a
                href={settings.instagram_url || "https://www.instagram.com/estoupreparadoconcursos/"}
                target="_blank"
                rel="noreferrer"
                className="ep-social-btn instagram"
                title="Instagram"
              >
                <i className="fab fa-instagram"></i>
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="ep-social-btn whatsapp"
                title="WhatsApp"
              >
                <i className="fab fa-whatsapp"></i>
              </a>
            </div>
          </Col>

          {/* Coluna 2: Institucional */}
          <Col xs={12} sm={6} lg={3} className="ps-lg-4">
            <h5 className="footer-title">Institucional</h5>
            <ul className="ep-footer-links">
              <li>
                <a href="/">
                  <i className="fa fa-angle-right"></i> Home
                </a>
              </li>
              <li>
                <a href="/Sobre">
                  <i className="fa fa-angle-right"></i> Sobre
                </a>
              </li>
              <li>
                <a href="/Sobre">
                  <i className="fa fa-angle-right"></i> Equipe
                </a>
              </li>
              <li>
                <a href="/CoursesPage">
                  <i className="fa fa-angle-right"></i> Cursos e Planos
                </a>
              </li>
              <li>
                <a href="/Contato">
                  <i className="fa fa-angle-right"></i> Fale Conosco
                </a>
              </li>
            </ul>
          </Col>

          {/* Coluna 3: Nossos Serviços */}
          <Col xs={12} sm={6} lg={3}>
            <h5 className="footer-title">Nossos Serviços</h5>
            <ul className="ep-footer-links">
              <li>
                <a href="/CoursesPage">
                  <i className="fa fa-angle-right"></i> Loja de Cursos
                </a>
              </li>
              <li>
                <a href="/PortalPage">
                  <i className="fa fa-angle-right"></i> EP Questões
                </a>
              </li>
              <li>
                <a href="/PortalPage">
                  <i className="fa fa-angle-right"></i> Simuladões Abertos
                </a>
              </li>
              <li>
                <a href="/PortalPage">
                  <i className="fa fa-angle-right"></i> Suas Lives
                </a>
              </li>
            </ul>
          </Col>

          {/* Coluna 4: Nossos Cursos Reais */}
          <Col xs={12} sm={6} lg={3}>
            <h5 className="footer-title">Nossos Cursos</h5>
            <ul className="ep-footer-links">
              {courses.length > 0 ? (
                <>
                  {courses.slice(0, 5).map((course) => (
                    <li key={course.id}>
                      <a
                        href={`/CoursesPage?q=${encodeURIComponent(course.title)}`}
                        title={course.title}
                        className="text-truncate d-inline-block"
                        style={{ maxWidth: "100%" }}
                      >
                        <i className="fa fa-angle-right"></i> {course.title}
                      </a>
                    </li>
                  ))}
                  <li>
                    <a href="/CoursesPage" className="text-primary fw-bold mt-1">
                      <i className="fa fa-arrow-right"></i> Ver todos ({courses.length})
                    </a>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <a href="/CoursesPage">
                      <i className="fa fa-angle-right"></i> Todos os Cursos Preparatórios
                    </a>
                  </li>
                  <li>
                    <a href="/CoursesPage">
                      <i className="fa fa-angle-right"></i> Cursos Online & Módulos
                    </a>
                  </li>
                </>
              )}
            </ul>
          </Col>
        </Row>

        <div className="ep-copyright">
          <Row>
            <Col md={6} className="text-center text-md-start mb-2 mb-md-0">
              © 2026 - Todos os direitos reservados. Preparatório Universitário.
            </Col>
            <Col md={6} className="text-center text-md-end">
              Plataforma de Alta Performance em Preparação Universitária e Seleções
            </Col>
          </Row>
        </div>
      </Container>
    </footer>
  );
}

