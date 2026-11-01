import React, { useEffect, useState, useContext } from "react";
import { Container, Row, Col, Carousel, Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AppNavbar from "../components/AppNavbar";
import AppFooter from "../components/AppFooter";
import { API_BASE_URL, getUploadUrl } from "../config/apiConfig";
import { useSettings } from "../context/SettingsContext";
import "./HomePage.css";

export default function HomePage() {
  const { settings, getWhatsAppLink } = useSettings();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchFilter, setSearchFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Redirecionamento automático de administradores para o painel administrativo
  useEffect(() => {
    if (user && (user.role || "").toLowerCase() === "admin") {
      navigate("/AdminDashboard", { replace: true });
    }
  }, [user, navigate]);

  // Carregar matrículas do aluno caso esteja logado
  useEffect(() => {
    const token = localStorage.getItem("token") || (user && user.token);
    if (token) {
      fetch(`${API_BASE_URL}/compras`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) {
            setEnrolledCourseIds(data.map((c) => c.id));
          }
        })
        .catch(() => { });
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/cursos`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar cursos");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((item, idx) => ({
            id: item.id || idx + 10,
            title: item.title,
            category: item.category || "Geral",
            duration: item.duration || "Acesso vitalício",
            oldPrice: item.price ? (parseFloat(item.price) * 1.3).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "",
            price: item.price ? parseFloat(item.price).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00",
            hours: item.workload_hours || "40h",
            files: "Materiais inclusos",
            discount: "",
            thumbnail: item.thumbnail
              ? getUploadUrl(item.thumbnail)
              : "/banners/banner1.jpg",
            details: item.details || item.descrição || "Curso preparatório estruturado com foco em aprovação."
          }));
          setCourses(formatted);
        } else {
          setCourses([]);
        }
      })
      .catch((err) => {
        console.warn("Servidor offline ou sem conexão:", err);
        setCourses([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // 🔹 Buscar professores registrados na plataforma
  useEffect(() => {
    setLoadingTeachers(true);
    fetch(`${API_BASE_URL}/professores`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar professores");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((t) => ({
            ...t,
            avatar: getUploadUrl(t.avatar)
          }));
          setTeachers(formatted);
        } else {
          setTeachers([]);
        }
      })
      .catch((err) => {
        console.warn("Servidor offline ou erro ao buscar professores:", err);
        setTeachers([]);
      })
      .finally(() => {
        setLoadingTeachers(false);
      });
  }, []);

  const handleSelectTeacher = (prof) => {
    setSelectedTeacher(prof);
    setShowTeacherModal(true);
  };

  const handleShowDetails = (course) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  const availableCategories = Array.from(
    new Set(courses.map((c) => c.category).filter(Boolean))
  );

  const filteredCourses = courses.filter((c) => {
    const matchesCategory =
      selectedCategory === "Todas" ||
      c.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      c.title.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="ep-home-wrapper">
      {/* 🔹 Header Principal */}
      <AppNavbar onSearch={(query) => setSearchFilter(query)} />

      {/* 🔹 Carrossel de Banners - Preparatório Universitário */}
      <Carousel id="carouselExampleIndicators" className="ep-main-carousel" interval={6000}>
        <Carousel.Item>
          <div className="ep-banner-wrapper">
            <img
              className="d-block w-100 ep-carousel-banner"
              src="/banners/banner1.jpg"
              alt="Preparatório Universitário - Campus e Alunos"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/banners/banner1.webp";
              }}
            />
            <div className="ep-banner-overlay"></div>
            <div className="ep-banner-caption">
              <Container>
                <div className="ep-banner-content">
                  <span className="ep-banner-badge">
                    <i className="fa fa-graduation-cap me-1"></i> Preparatório Universitário
                  </span>
                  <h1 className="ep-banner-title">
                    {settings.banner_title || "A tua aprovação é a nossa missão!"}
                  </h1>
                  <p className="ep-banner-subtitle">
                    {settings.banner_subtitle || "Junta-te à melhor academia de preparação universitária"}
                  </p>
                  <div className="ep-banner-buttons">
                    <a href="/CoursesPage" className="btn btn-primary btn-lg ep-banner-btn-primary">
                      <i className="fa fa-book-open me-2"></i> Conhecer os Cursos
                    </a>
                    <a
                      href={getWhatsAppLink("Olá! Gostaria de me inscrever no Preparatório Universitário.")}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-success btn-lg ep-banner-btn-secondary"
                    >
                      <i className="fab fa-whatsapp me-2"></i> Falar com um Consultor
                    </a>
                  </div>
                </div>
              </Container>
            </div>
          </div>
        </Carousel.Item>

        <Carousel.Item>
          <div className="ep-banner-wrapper">
            <img
              className="d-block w-100 ep-carousel-banner"
              src="/banners/banner2.jpg"
              alt="Preparatório Universitário - Vida Acadêmica e Estudos"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/banners/banner2.webp";
              }}
            />
            <div className="ep-banner-overlay"></div>
            <div className="ep-banner-caption">
              <Container>
                <div className="ep-banner-content">
                  <span className="ep-banner-badge">
                    <i className="fa fa-award me-1"></i> Excelência & Aprovação
                  </span>
                  <h1 className="ep-banner-title">
                    {settings.banner_title || "A tua aprovação é a nossa missão!"}
                  </h1>
                  <p className="ep-banner-subtitle">
                    {settings.banner_subtitle || "Junta-te à melhor academia de preparação universitária"}
                  </p>
                  <div className="ep-banner-buttons">
                    <a href="/CoursesPage" className="btn btn-primary btn-lg ep-banner-btn-primary">
                      <i className="fa fa-play-circle me-2"></i> Ver Cursos Disponíveis
                    </a>
                    <a href="/Contato" className="btn btn-outline-light btn-lg ep-banner-btn-secondary">
                      <i className="fa fa-envelope me-2"></i> Fale Conosco
                    </a>
                  </div>
                </div>
              </Container>
            </div>
          </div>
        </Carousel.Item>
      </Carousel>

      {/* 🔹 Faixa de Acesso Rápido (#quick-options) */}
      <section id="quick-options" className="my-4">
        <Container>
          <Row className="g-4">
            {/* Card 1: Inscrição */}
            <Col xs={12} md={4}>
              <div className="ep-quick-card">
                <img
                  src="/ico-inscricao.svg"
                  alt="Inscrição"
                  className="ep-quick-icon"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/ico-simulado.png";
                  }}
                />
                <div className="ep-quick-title">Inscrição</div>
                <div className="ep-quick-subtitle">
                  Garanta sua vaga nos cursos preparatórios e inicie seus estudos.
                </div>
                <a
                  href="/RegisterPage"
                  className="ep-quick-btn"
                  title="Fazer Inscrição"
                >
                  <i className="fas fa-arrow-right"></i>
                </a>
              </div>
            </Col>

            {/* Card 2: Portal do estudante */}
            <Col xs={12} md={4}>
              <div className="ep-quick-card">
                <img
                  src="/ico-portal.svg"
                  alt="Portal do estudante"
                  className="ep-quick-icon"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/ico-sqp.png";
                  }}
                />
                <div className="ep-quick-title">Portal do estudante</div>
                <div className="ep-quick-subtitle">
                  Acesse seus simulados, materiais e acompanhe seu progresso.
                </div>
                <a
                  href="/PortalPage"
                  className="ep-quick-btn"
                  title="Acessar Portal do Estudante"
                >
                  <i className="fas fa-arrow-right"></i>
                </a>
              </div>
            </Col>

            {/* Card 3: Suas Lives */}
            <Col xs={12} md={4}>
              <div className="ep-quick-card">
                <img
                  src="/ico-lives.svg"
                  alt="Suas Lives"
                  className="ep-quick-icon"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/ico-radio.png";
                  }}
                />
                <div className="ep-quick-title">Suas Lives</div>
                <div className="ep-quick-subtitle">
                  Acompanhe aulas ao vivo, transmissões e mentorias interativas.
                </div>
                <a
                  href="/PortalPage"
                  className="ep-quick-btn"
                  title="Acessar Suas Lives"
                >
                  <i className="fas fa-play"></i>
                </a>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 🔹 Seção de Professores Registrados (Estilo Stories) */}
      <section className="my-5">
        <Container>
          <div className="ep-stories-box">
            <div className="ep-stories-title d-flex justify-content-between align-items-center mb-3">
              <div>
                <span>Professores</span> Registrados
              </div>
              <small className="text-muted fw-normal d-none d-sm-inline" style={{ fontSize: "13px" }}>
                <i className="fa fa-chalkboard-teacher me-1 text-primary"></i> Corpo Docente da Plataforma
              </small>
            </div>

            {loadingTeachers ? (
              <div className="d-flex align-items-center gap-4 py-2">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div key={idx} className="ep-story-item flex-shrink-0 opacity-50">
                    <div className="ep-story-ring" style={{ background: "#e2e8f0" }}>
                      <div className="rounded-circle bg-light w-100 h-100" />
                    </div>
                    <div className="ep-story-text text-muted">Carregando...</div>
                  </div>
                ))}
              </div>
            ) : teachers.length === 0 ? (
              <div className="text-muted small py-3 text-center">
                <i className="fa fa-user-tie fa-2x mb-2 text-muted d-block"></i>
                Nenhum professor registrado no momento.
              </div>
            ) : (
              <div className="d-flex align-items-center gap-4 overflow-auto py-2 ep-stories-scroll">
                {teachers.map((prof) => (
                  <div
                    key={prof.id}
                    className="ep-story-item flex-shrink-0"
                    onClick={() => handleSelectTeacher(prof)}
                    role="button"
                    tabIndex={0}
                    title={`${prof.name} - Clique para ver perfil`}
                  >
                    <div className="ep-story-ring">
                      <img
                        src={getUploadUrl(prof.avatar)}
                        alt={prof.name}
                        className="ep-story-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(prof.name)}&background=0044fc&color=fff&size=160&bold=true`;
                        }}
                      />
                    </div>
                    <div className="ep-story-text" title={prof.name}>
                      {prof.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* 🔹 Vitrine de Cursos (#cursos) */}
      <section id="cursos" className="py-5">
        <Container>
          <div className="titulo-novo-1">CONHEÇA</div>
          <div className="titulo-novo-2">Nossos Cursos</div>

          {/* Filtros de Categoria (dinâmicos com base nos cursos cadastrados) */}
          {availableCategories.length > 0 && (
            <div className="d-flex justify-content-center flex-wrap gap-2 mb-4">
              {["Todas", ...availableCategories].map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "primary" : "outline-secondary"}
                  size="sm"
                  className={`px-3 py-2 fw-bold ${
                    selectedCategory === cat ? "ep-btn-entrar" : "bg-white text-dark border"
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}

          {/* Grid de Cards de Cursos com layout exato do Estou Preparado */}
          <Row className="g-4">
            {loading ? (
              <Col xs={12} className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">A carregar...</span>
                </div>
                <p className="text-muted mt-2 small">A carregar cursos disponíveis...</p>
              </Col>
            ) : filteredCourses.length > 0 ? (
              filteredCourses.map((course) => {
                const isEnrolled = enrolledCourseIds.includes(course.id);
                return (
                  <Col key={course.id} xs={12} sm={6} lg={3}>
                    <div className="ep-course-card">
                      {/* Selo Promocional ou Matriculado */}
                      {isEnrolled ? (
                        <div
                          className="ep-selo-promocao"
                          style={{ backgroundColor: "#28a745", fontWeight: "bold" }}
                        >
                          Matriculado
                        </div>
                      ) : (
                        <div className="ep-selo-promocao">{course.discount || "Destaque"}</div>
                      )}

                      {/* Thumbnail do Curso */}
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="ep-course-thumb"
                      />

                      {/* Corpo do Card */}
                      <div className="ep-course-body">
                        <span className="ep-category-badge">{course.category}</span>
                        <div className="ep-course-title">
                          <a
                            href="#detalhes"
                            onClick={(e) => {
                              e.preventDefault();
                              handleShowDetails(course);
                            }}
                          >
                            {course.title}
                          </a>
                        </div>

                        <div className="ep-course-duracao">Duração</div>
                        <div className="ep-course-duracao-val">{course.duration}</div>

                        {course.oldPrice ? (
                          <div className="ep-price-de">
                            de: <s>{course.oldPrice} Kz</s>
                          </div>
                        ) : null}
                        <div className="ep-price-por-label">por:</div>
                        <div className="ep-price-valor">{course.price} Kz</div>

                        {isEnrolled ? (
                          <Button
                            className="ep-btn-detalhar w-100 fw-bold"
                            style={{ backgroundColor: "#28a745", borderColor: "#28a745" }}
                            onClick={() => navigate(`/PortalPage?curso=${course.id}`)}
                          >
                            <i className="fa fa-play-circle me-1"></i> Acessar Curso
                          </Button>
                        ) : (
                          <Button
                            className="ep-btn-detalhar"
                            onClick={() => handleShowDetails(course)}
                          >
                            Inscreva-se
                          </Button>
                        )}

                        <div className="ep-course-meta">
                          <div>
                            <i className="far fa-clock"></i> {course.hours}
                          </div>
                          <div>
                            <i className="far fa-file-pdf"></i> {course.files}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>
                );
              })
            ) : (
              <Col xs={12} className="text-center py-5 text-muted">
                <i className="fa fa-book-open fa-3x mb-3 text-secondary"></i>
                <h5>Nenhum curso disponível no momento.</h5>
                <p className="small text-muted">
                  {courses.length === 0
                    ? "Novos cursos preparatórios estarão disponíveis em breve."
                    : "Nenhum curso encontrado nesta categoria."}
                </p>
              </Col>
            )}
          </Row>

          <div className="text-center mt-5">
            <Button
              className="ep-btn-entrar px-5 py-3 fs-6"
              onClick={() => navigate("/CoursesPage")}
            >
              Ver Todos os Cursos <i className="fa fa-arrow-right ms-2"></i>
            </Button>
          </div>
        </Container>
      </section>

      {/* 🔹 Newsletter Preparatório Universitário */}
      <section className="my-5">
        <Container>
          <div className="ep-newsletter">
            <Row className="align-items-center">
              <Col lg={5} md={12} className="mb-4 mb-lg-0">
                <h2>Newsletter</h2>
                <p>
                  ASSINE NOSSO NEWSLETTER E RECEBA INFORMAÇÕES, EDITAIS E ARQUIVOS GRATUITOS EM SEU E-MAIL!
                </p>
              </Col>
              <Col lg={7} md={12}>
                <Row className="g-2">
                  <Col xs={12} sm={5}>
                    <input
                      type="text"
                      className="form-control ep-newsletter-input"
                      placeholder="Nome completo"
                    />
                  </Col>
                  <Col xs={12} sm={4}>
                    <input
                      type="email"
                      className="form-control ep-newsletter-input"
                      placeholder="Seu melhor e-mail"
                    />
                  </Col>
                  <Col xs={12} sm={3}>
                    <Button className="ep-newsletter-btn w-100">
                      Inscrever-se
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row>
          </div>
        </Container>
      </section>

      {/* 🔹 Depoimentos de Alunos Aprovados */}
      <section id="depoimentos" className="py-5 bg-white">
        <Container>
          <div className="titulo-novo-1">DEPOIMENTOS</div>
          <div className="titulo-novo-2">O que dizem nossos alunos</div>

          <Row className="g-4">
            <Col xs={12} md={4}>
              <div className="ep-testimonial-card">
                <div className="text-warning mb-3">
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                </div>
                <p className="ep-testimonial-quote">
                  "A plataforma Preparatório Universitário foi essencial para minha aprovação no exame de admissão. O material focado nas bancas e os simulados fizeram toda a diferença na minha pontuação final!"
                </p>
                <div className="ep-testimonial-author">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                    alt="Aluna"
                    className="ep-testimonial-avatar"
                  />
                  <div>
                    <h6 className="mb-0 fw-bold">Juliana Lima</h6>
                    <small className="text-primary fw-semibold">Aprovada em Medicina</small>
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={12} md={4}>
              <div className="ep-testimonial-card">
                <div className="text-warning mb-3">
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                </div>
                <p className="ep-testimonial-quote">
                  "Os simulados com cronômetro idênticos ao dia da prova me deram a segurança psicológica necessária. Professores extremamente qualificados e didática impecável."
                </p>
                <div className="ep-testimonial-author">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                    alt="Aluno"
                    className="ep-testimonial-avatar"
                  />
                  <div>
                    <h6 className="mb-0 fw-bold">Carlos Eduardo Silva</h6>
                    <small className="text-primary fw-semibold">Aprovado em Engenharia Informática</small>
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={12} md={4}>
              <div className="ep-testimonial-card">
                <div className="text-warning mb-3">
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                </div>
                <p className="ep-testimonial-quote">
                  "Estudei exclusivamente pela plataforma. Os resumos em PDF e as questões comentadas economizaram meses de preparação. Recomendo de olhos fechados!"
                </p>
                <div className="ep-testimonial-author">
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
                    alt="Aluno"
                    className="ep-testimonial-avatar"
                  />
                  <div>
                    <h6 className="mb-0 fw-bold">Matheus Vinícius</h6>
                    <small className="text-primary fw-semibold">Aprovado em Direito</small>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 🔹 Galeria de Aprovados */}
      <section id="galeria" className="my-5">
        <Container>
          <div className="ep-galeria-banner">
            <h2>Estudante focado conquista a sua aprovação!</h2>
            <p className="lead mb-4">
              Junte-se aos milhares de estudantes que conquistaram o acesso ao ensino superior.
            </p>
            <a href="/CoursesPage" className="ep-galeria-btn">
              Conheça a Galeria de Aprovados <i className="fa fa-trophy ms-2"></i>
            </a>
          </div>
        </Container>
      </section>

      {/* 🔹 Modal de Detalhes do Curso */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        {selectedCourse && (
          <>
            <Modal.Header closeButton>
              <Modal.Title className="fw-bold" style={{ color: "#0044fc" }}>
                {selectedCourse.title}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-3 p-md-4">
              <Row>
                <Col xs={12} md={5} className="mb-3 mb-md-0">
                  <img
                    src={selectedCourse.thumbnail}
                    alt={selectedCourse.title}
                    className="img-fluid rounded shadow-sm w-100"
                  />
                  <div className="mt-3 p-3 bg-light rounded">
                    <div className="fw-bold text-muted small">INVESTIMENTO</div>
                    <div className="fs-3 fw-bold text-primary">{selectedCourse.price} Kz</div>
                    <div className="small text-muted">
                      Pagamento via Multicaixa Express ou Transferência Bancária
                    </div>
                  </div>
                </Col>
                <Col xs={12} md={7}>
                  <span className="badge bg-primary mb-2">{selectedCourse.category}</span>
                  <h5 className="fw-bold mb-3">Sobre o Curso</h5>
                  <p className="text-secondary" style={{ lineHeight: "1.7" }}>
                    {selectedCourse.details}
                  </p>
                  <ul className="list-unstyled text-muted small mb-4">
                    <li className="mb-2">
                      <i className="fa fa-check text-success me-2"></i> Acesso ilimitado às videoaulas
                    </li>
                    <li className="mb-2">
                      <i className="fa fa-check text-success me-2"></i> Material didático em PDF para download
                    </li>
                    <li className="mb-2">
                      <i className="fa fa-check text-success me-2"></i> Banco de questões resolvidas e comentadas
                    </li>
                    <li className="mb-2">
                      <i className="fa fa-check text-success me-2"></i> Certificado de conclusão
                    </li>
                  </ul>
                  {enrolledCourseIds.includes(selectedCourse.id) ? (
                    <Button
                      className="ep-btn-entrar w-100 py-3 fs-6"
                      style={{ backgroundColor: "#28a745", borderColor: "#28a745" }}
                      onClick={() => {
                        setShowModal(false);
                        navigate(`/PortalPage?curso=${selectedCourse.id}`);
                      }}
                    >
                      <i className="fa fa-play-circle me-2"></i> Acessar Minha Sala de Aulas
                    </Button>
                  ) : (
                    <Button
                      className="ep-btn-entrar w-100 py-3 fs-6"
                      onClick={() => {
                        setShowModal(false);
                        navigate("/CoursesPage");
                      }}
                    >
                      Garantir Minha Vaga Agora
                    </Button>
                  )}
                </Col>
              </Row>
            </Modal.Body>
          </>
        )}
      </Modal>

      {/* 🔹 Modal do Professor */}
      <Modal show={showTeacherModal} onHide={() => setShowTeacherModal(false)} centered>
        {selectedTeacher && (
          <>
            <Modal.Header closeButton className="border-0 pb-0">
              <span className="badge bg-primary text-white px-3 py-1 rounded-pill small">
                {selectedTeacher.role || "Instrutor"}
              </span>
            </Modal.Header>
            <Modal.Body className="text-center px-4 pt-1 pb-4">
              <div className="d-flex justify-content-center mb-3">
                <div
                  style={{
                    width: "110px",
                    height: "110px",
                    borderRadius: "50%",
                    padding: "4px",
                    background: "linear-gradient(45deg, #0044fc, #ff7a00)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <img
                    src={getUploadUrl(selectedTeacher.avatar)}
                    alt={selectedTeacher.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "3px solid #fff"
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedTeacher.name)}&background=0044fc&color=fff&size=160&bold=true`;
                    }}
                  />
                </div>
              </div>

              <h4 className="fw-bold mb-1 text-dark">{selectedTeacher.name}</h4>
              <p className="text-primary fw-semibold small mb-3">
                {selectedTeacher.accountType === "preparatorio" ? "Preparatório / Instituição" : "Professor da Plataforma"}
              </p>

              <div className="p-3 bg-light rounded-3 text-secondary small text-start mb-3" style={{ lineHeight: "1.6" }}>
                <strong className="d-block mb-1 text-dark">
                  <i className="fa fa-info-circle me-1 text-primary"></i> Sobre o docente:
                </strong>
                <p className="mb-0">
                  {selectedTeacher.bio || "Professor especialista e dedicado à preparação dos estudantes para aprovação."}
                </p>
              </div>

              {selectedTeacher.totalCursos > 0 && (
                <div className="d-flex justify-content-around p-2 bg-light rounded mb-3">
                  <div className="text-center">
                    <span className="d-block fw-bold fs-5 text-primary">{selectedTeacher.totalCursos}</span>
                    <small className="text-muted">Cursos na plataforma</small>
                  </div>
                </div>
              )}

              <div className="d-flex gap-2">
                <Button
                  variant="outline-secondary"
                  className="w-50"
                  onClick={() => setShowTeacherModal(false)}
                >
                  Fechar
                </Button>
                <Button
                  className="ep-btn-entrar w-50"
                  onClick={() => {
                    setShowTeacherModal(false);
                    const section = document.getElementById("cursos");
                    if (section) {
                      section.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  Ver Cursos <i className="fa fa-arrow-down ms-1"></i>
                </Button>
              </div>
            </Modal.Body>
          </>
        )}
      </Modal>

      {/* 🔹 Rodapé Oficial Preparatório Universitário */}
      <AppFooter />
    </div>
  );
}
