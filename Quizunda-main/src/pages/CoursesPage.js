import React, { useEffect, useState } from "react";
import { Container, Row, Col, Modal, Button, Alert } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import AppNavbar from "../components/AppNavbar";
import AppFooter from "../components/AppFooter";
import { API_BASE_URL, getUploadUrl } from "../config/apiConfig";
import { useSettings } from "../context/SettingsContext";

export default function CoursesPage() {
  const { getWhatsAppLink } = useSettings();
  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se há parâmetro 'q' na URL
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q) setSearchQuery(q);
    const cat = params.get("cat") || params.get("categoria");
    if (cat) setCategoryFilter(cat);

    // Carregar matrículas do aluno caso esteja logado
    const token = localStorage.getItem("token") || JSON.parse(localStorage.getItem("user") || "{}").token;
    if (token) {
      fetch(`${API_BASE_URL}/compras`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) {
            setEnrolledCourseIds(data.map((item) => item.id));
          }
        })
        .catch(() => { });
    }

    const fetchCourses = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/cursos`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            if (data.length > 0) {
              const formatted = data.map((item, idx) => ({
                id: item.id || idx + 1,
                title: item.title,
                category: item.category || "Geral",
                country: item.country || "Angola",
                duration: item.duration || "Acesso vitalício",
                oldPrice: item.price ? (parseFloat(item.price) * 1.3).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "",
                price: item.price ? parseFloat(item.price).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00",
                hours: item.workload_hours || "40h",
                files: "Materiais inclusos",
                discount: "",
                thumbnail: item.thumbnail
                  ? getUploadUrl(item.thumbnail)
                  : "/banners/banner1.jpg",
                details: item.details || item.descrição || item.description || "Curso preparatório estruturado com foco em aprovação.",
                payment_whatsapp: item.payment_whatsapp
              }));
              setCourses(formatted);
            } else {
              setCourses([]);
            }
          }
        } else {
          setCourses([]);
        }
      } catch (error) {
        console.warn("Não foi possível carregar cursos da API.");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [location.search]);

  const handleShowDetails = (course) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter
      ? course.category.toLowerCase().includes(categoryFilter.toLowerCase())
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ backgroundColor: "#f8f8f8", minHeight: "100vh" }}>
      <AppNavbar onSearch={(query) => setSearchQuery(query)} />

      <div id="cursos" className="py-4">
        <Container className="pt-2 pb-5">
          <div className="titulo-novo-1">Conheça</div>
          <div className="titulo-novo-2">Nossos Cursos</div>

          {/* 🔹 Barra de Pesquisa e Filtro de Categoria (#pesquisa-cursos) */}
          <div className="row justify-content-end mb-4">
            <div className="col-lg-7 col-md-10">
              <div className="d-flex flex-column flex-sm-row gap-2">
                <div className="input-group">
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Pesquise o curso desejado..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      borderRadius: "6px 0 0 6px",
                      border: "1.5px solid #0044fc",
                      padding: "10px 16px"
                    }}
                  />
                  <button
                    className="btn btn-primary"
                    type="button"
                    style={{ backgroundColor: "#0044fc", borderColor: "#0044fc" }}
                  >
                    <i className="fa fa-search"></i>
                  </button>
                </div>

                <select
                  className="form-select"
                  style={{
                    minWidth: "180px",
                    border: "1.5px solid #ced4da",
                    borderRadius: "6px",
                    fontWeight: "600"
                  }}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">Todas as categorias</option>
                  {Array.from(new Set(courses.map((c) => c.category).filter(Boolean))).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 🔹 Grid de Cursos com layout exato do Estou Preparado */}
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

                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="ep-course-thumb"
                      />

                      <div className="ep-course-body">
                        <span className="ep-category-badge">{course.category}</span>
                        <div className="ep-course-title">
                          <a
                            href="#detalhar"
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
              <Col xs={12} className="text-center py-5">
                <i className="fa fa-book-open fa-3x mb-3 text-secondary"></i>
                <h5 className="text-muted">
                  {courses.length === 0
                    ? "Nenhum curso disponível no momento."
                    : "Nenhum curso encontrado com os filtros selecionados."}
                </h5>
                {courses.length > 0 && (
                  <Button
                    variant="outline-primary"
                    className="mt-3"
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("");
                    }}
                  >
                    Limpar Filtros
                  </Button>
                )}
              </Col>
            )}
          </Row>
        </Container>
      </div>

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
                  <h5 className="fw-bold mb-3">Informações e Conteúdo Programático</h5>
                  <p className="text-secondary" style={{ lineHeight: "1.7" }}>
                    {selectedCourse.details}
                  </p>
                  <ul className="list-unstyled text-muted small mb-4">
                    <li className="mb-2">
                      <i className="fa fa-check text-success me-2"></i> Videoaulas completas gravadas em alta definição
                    </li>
                    <li className="mb-2">
                      <i className="fa fa-check text-success me-2"></i> Material de apoio em PDF para download
                    </li>
                    <li className="mb-2">
                      <i className="fa fa-check text-success me-2"></i> Banco de questões resolvidas e comentadas
                    </li>
                    <li className="mb-2">
                      <i className="fa fa-check text-success me-2"></i> Simulados periódicos com ranking
                    </li>
                  </ul>

                  {enrolledCourseIds.includes(selectedCourse.id) ? (
                    <>
                      <Alert variant="success" className="mb-3 d-flex align-items-center gap-2">
                        <i className="fa fa-check-circle fs-4 text-success"></i>
                        <div>
                          <strong>Você já está matriculado neste curso!</strong>
                          <div className="small">Acesse todas as videoaulas e materiais no Portal do Aluno.</div>
                        </div>
                      </Alert>
                      <Button
                        className="ep-btn-entrar w-100 py-3 fs-6"
                        style={{ backgroundColor: "#28a745", borderColor: "#28a745" }}
                        onClick={() => {
                          setShowModal(false);
                          navigate(`/PortalPage?curso=${selectedCourse.id}`);
                        }}
                      >
                        <i className="fa fa-play-circle me-2"></i> Ir para a Sala de Aulas
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="ep-btn-entrar w-100 py-3 fs-6"
                      onClick={() => {
                        const msg = `Olá! Quero me inscrever no curso ${selectedCourse.title}`;
                        if (selectedCourse.payment_whatsapp) {
                          const digits = String(selectedCourse.payment_whatsapp).replace(/\D/g, "");
                          const finalPhone = (digits.length === 10 || digits.length === 11) && !digits.startsWith("55") ? `55${digits}` : digits;
                          window.open(`https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(msg)}`, "_blank");
                        } else {
                          window.open(getWhatsAppLink(msg), "_blank");
                        }
                      }}
                    >
                      <i className="fab fa-whatsapp me-2"></i> Matricular-se pelo WhatsApp
                    </Button>
                  )}
                </Col>
              </Row>
            </Modal.Body>
          </>
        )}
      </Modal>

      <AppFooter />
    </div>
  );
}
