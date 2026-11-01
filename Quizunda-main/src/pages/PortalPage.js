import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Button,
  ButtonGroup,
  Row,
  Col,
  Card,
  Alert,
  ProgressBar,
  Badge,
  Spinner
} from "react-bootstrap";
import {
  FaGraduationCap,
  FaBook,
  FaFolderOpen,
  FaChartBar,
  FaVideo,
  FaHistory,
  FaWhatsapp,
  FaCheckCircle,
  FaPlayCircle,
  FaChevronLeft,
  FaChevronRight,
  FaFileDownload,
  FaUserEdit,
  FaCamera
} from "react-icons/fa";
import ExamVerticalHistogram from "../components/ExamChart";
import AppNavbar from "../components/AppNavbar";
import AppFooter from "../components/AppFooter";
import UserProfileModal from "../components/UserProfileModal";
import { API_BASE_URL, getUploadUrl } from "../config/apiConfig";
import "./PortalPage.css";

// Converte URLs do YouTube, Google Drive e uploads em fontes válidas para reprodução
function formatVideoSource(rawUrl) {
  if (!rawUrl) return null;
  const url = String(rawUrl).trim();

  // YouTube watch ou share
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch) {
    return {
      type: "iframe",
      src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`
    };
  }

  // Google Drive
  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    const fileId = driveMatch[1] || driveMatch[2];
    return {
      type: "iframe",
      src: `https://drive.google.com/file/d/${fileId}/preview`
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch) {
    return {
      type: "iframe",
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}`
    };
  }

  // Arquivos diretos de vídeo / uploads no servidor backend
  if (url.startsWith("/uploads/") || url.includes("/uploads/")) {
    return { type: "video", src: getUploadUrl(url) };
  }

  if (url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".ogg")) {
    return { type: "video", src: url };
  }

  return { type: "iframe", src: url };
}

function formatMaterialUrl(url) {
  if (!url) return "#";
  return getUploadUrl(url);
}

export default function PortalPage() {
  const [user, setUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [cursos, setCursos] = useState([]);
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [loadingCursos, setLoadingCursos] = useState(true);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);

  const [supportWhatsapp, setSupportWhatsapp] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [courseProgress, setCourseProgress] = useState(0);

  const [dadosCurso, setDadosCurso] = useState({
    videoLessonsArray: [],
    supportMaterials: []
  });

  const [examHistory, setExamHistory] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);

  // Carrega histórico real de simulados do backend e do localStorage
  useEffect(() => {
    const fetchExamHistory = async () => {
      setLoadingExams(true);
      try {
        const token = getToken();

        // 1. Carregar cache local de exames reais
        let localData = [];
        try {
          const raw = localStorage.getItem("user_exam_history");
          if (raw) localData = JSON.parse(raw);
        } catch (e) {}

        if (Array.isArray(localData) && localData.length > 0) {
          setExamHistory(localData);
        }

        // 2. Sincronizar dados reais do servidor
        if (token) {
          const res = await fetch(`${API_BASE_URL}/exam-attempts`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              const formatted = data.map((item, idx) => ({
                id: item.id,
                titulo: item.titulo || `Simulado #${data.length - idx}`,
                data: item.data || (item.completed_at ? item.completed_at.split("T")[0] : new Date().toISOString().split("T")[0]),
                score: Number(item.score || 0),
                acertos: Number(item.acertos || 0),
                erros: Number(item.erros || 0),
                total: Number(item.total || 0),
                disciplinas: Array.isArray(item.disciplinas) ? item.disciplinas : []
              }));
              setExamHistory(formatted);
              localStorage.setItem("user_exam_history", JSON.stringify(formatted));
            } else if (!localData || localData.length === 0) {
              setExamHistory([]);
            }
          }
        }
      } catch (err) {
        console.warn("Aviso ao carregar histórico de simulados:", err);
      } finally {
        setLoadingExams(false);
      }
    };

    fetchExamHistory();
  }, []);

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      JSON.parse(localStorage.getItem("user") || "{}").token ||
      ""
    );
  };

  // Carrega informações do usuário e cursos matriculados
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }

    const fetchCursos = async () => {
      setLoadingCursos(true);
      try {
        const token = getToken();
        if (!token) {
          setCursos([]);
          setLoadingCursos(false);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/compras`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          const lista = Array.isArray(data) ? data : [];
          setCursos(lista);

          if (lista.length > 0) {
            // Verificar parâmetro na URL: ?curso=ID ou ?cursoId=ID
            const params = new URLSearchParams(location.search);
            const paramId = params.get("curso") || params.get("cursoId");
            const target = paramId
              ? lista.find((c) => String(c.id) === String(paramId)) || lista[0]
              : lista[0];

            handleSelectCurso(target);
          }
        } else {
          setCursos([]);
        }
      } catch (err) {
        console.error("Erro ao carregar cursos matriculados:", err);
        setCursos([]);
      } finally {
        setLoadingCursos(false);
      }
    };

    fetchCursos();
  }, [location.search]);

  // Carrega aulas, materiais e progresso do curso selecionado
  const handleSelectCurso = async (curso) => {
    if (!curso) return;
    setSelectedCurso(curso);
    setLoadingDetalhes(true);

    try {
      const token = getToken();

      // 1. Carregar aulas e materiais
      const res = await fetch(`${API_BASE_URL}/detalhes_c/${curso.id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json"
        }
      });

      let lessons = [];
      let materials = [];
      let whatsapp = "";

      if (res.ok) {
        const data = await res.json();
        lessons = data.video_lessons || [];
        materials = data.support_materials || [];
        whatsapp = data.support_whatsapp || "";
      } else {
        // Fallback defensivo com vídeo demonstrativo em embed
        lessons = [
          {
            id: 1,
            title: "Aula 01 - Introdução ao Preparatório",
            tema: "Apresentação do edital e cronograma de aprovação",
            disciplina: "Módulo Inicial",
            moduleTitle: "Módulo Inicial",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            duration: 40
          }
        ];
        materials = [];
      }

      setDadosCurso({
        videoLessonsArray: lessons,
        supportMaterials: materials
      });
      setSupportWhatsapp(whatsapp);

      // 2. Carregar progresso salvo do aluno
      try {
        const progRes = await fetch(`${API_BASE_URL}/progress/${curso.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (progRes.ok) {
          const progData = await progRes.json();
          setCompletedLessons(progData.completedLessonIds || []);
          setCourseProgress(progData.progressPercent || curso.progress || 0);
        } else {
          setCourseProgress(curso.progress || 0);
        }
      } catch {
        setCourseProgress(curso.progress || 0);
      }

      // 3. Seleciona automaticamente a primeira videoaula
      if (lessons.length > 0) {
        setSelectedVideo(lessons[0]);
      } else {
        setSelectedVideo(null);
      }
    } catch (err) {
      console.error("Erro ao selecionar curso:", err);
    } finally {
      setLoadingDetalhes(false);
    }
  };

  // Alterna status de conclusão da aula
  const handleToggleComplete = async (lessonId) => {
    if (!selectedCurso || !lessonId) return;
    const token = getToken();

    try {
      const res = await fetch(
        `${API_BASE_URL}/progress/${selectedCurso.id}/lesson/${lessonId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (res.ok) {
        const data = await res.json();
        setCompletedLessons((prev) => {
          if (data.completed) {
            return [...new Set([...prev, lessonId])];
          } else {
            return prev.filter((id) => id !== lessonId);
          }
        });
        setCourseProgress(data.progressPercent);
      }
    } catch (err) {
      console.error("Erro ao atualizar conclusão:", err);
    }
  };

  // Navegar para aula anterior ou próxima
  const handleNavigateLesson = (direction) => {
    const list = dadosCurso.videoLessonsArray;
    if (!list || list.length === 0 || !selectedVideo) return;
    const idx = list.findIndex((l) => l.id === selectedVideo.id);
    if (idx === -1) return;

    if (direction === "next" && idx + 1 < list.length) {
      setSelectedVideo(list[idx + 1]);
    } else if (direction === "prev" && idx - 1 >= 0) {
      setSelectedVideo(list[idx - 1]);
    }
  };

  const videoSource = selectedVideo ? formatVideoSource(selectedVideo.url || selectedVideo.url_drive) : null;
  const isCurrentCompleted = selectedVideo ? completedLessons.includes(selectedVideo.id) : false;

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <AppNavbar />

      {/* Breadcrumb Estou Preparado */}
      <div id="breadcrumb">
        <Container>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <span className="titulo">Portal do Aluno</span>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item"><a href="/">Home</a></li>
                  <li className="breadcrumb-item active" aria-current="page">Sala de Aulas</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex flex-column flex-sm-row gap-2 mt-2 mt-md-0 w-100 w-md-auto">
              <Button
                variant="primary"
                className="ep-btn-entrar justify-content-center"
                onClick={() => navigate("/ChangePage")}
              >
                <FaGraduationCap className="me-2" /> Sala de Exames / Simulados
              </Button>
              {supportWhatsapp && (
                <Button
                  variant="success"
                  className="fw-bold d-flex align-items-center justify-content-center gap-2"
                  onClick={() => {
                    const msg = encodeURIComponent(
                      `Olá! Sou aluno do curso ${selectedCurso?.title || ""} e preciso de apoio pedagógico.`
                    );
                    window.open(`https://wa.me/${supportWhatsapp}?text=${msg}`, "_blank");
                  }}
                >
                  <FaWhatsapp /> Suporte do Professor
                </Button>
              )}
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-4 py-md-5">
        {/* Banner de Boas-vindas do Aluno com Foto de Perfil e Edição */}
        <div className="bg-white p-3 p-md-4 rounded-3 shadow-sm border mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            {/* Foto de Perfil do Aluno com atalho para troca */}
            <div
              className="position-relative cursor-pointer shadow-sm"
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid #0044fc",
                backgroundColor: "#eef2ff",
                flexShrink: 0
              }}
              onClick={() => setShowProfileModal(true)}
              title="Clique para editar seu perfil e trocar foto"
            >
              {user?.avatar ? (
                <img
                  src={getUploadUrl(user.avatar)}
                  alt={user?.name || "Aluno"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.name || "Aluno"
                    )}&background=0044fc&color=fff&size=120&bold=true`;
                  }}
                />
              ) : (
                <div className="w-100 h-100 d-flex align-items-center justify-content-center text-primary fw-bold fs-4">
                  {(user?.name || "A")
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
              )}
              {/* Badge de Câmera */}
              <div
                className="position-absolute bottom-0 start-0 w-100 py-1 text-center text-white"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.55)",
                  fontSize: "9px"
                }}
              >
                <FaCamera />
              </div>
            </div>

            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h4 className="fw-bold mb-0" style={{ color: "#0044fc" }}>
                  Olá, {user?.name || "Estudante"}!
                </h4>
                <span className="badge bg-primary text-uppercase" style={{ fontSize: "11px" }}>
                  {user?.role || "Aluno"}
                </span>
              </div>
              <p className="text-muted mb-0 small mt-1">
                Acesse aqui as videoaulas completas, materiais em PDF e acompanhe seu progresso de aprovação.
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <Button
              variant="outline-primary"
              className="fw-bold d-flex align-items-center gap-2 shadow-sm"
              onClick={() => setShowProfileModal(true)}
            >
              <FaUserEdit /> Editar Meu Perfil
            </Button>
            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fw-bold">
              <i className="fa fa-check-circle me-1"></i> Matrícula Ativa
            </span>
          </div>
        </div>

        {/* 🔹 Lista de Cursos Matriculados do Aluno */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <FaBook style={{ color: "#0044fc" }} /> Meus Cursos Matriculados
            </h5>
            <small className="text-muted">
              {cursos.length} {cursos.length === 1 ? "curso ativo" : "cursos ativos"}
            </small>
          </div>

          {loadingCursos ? (
            <div className="text-center py-4 bg-white rounded border">
              <Spinner animation="border" variant="primary" size="sm" />
              <span className="ms-2 small text-muted">A carregar os seus cursos...</span>
            </div>
          ) : cursos.length > 0 ? (
            <Row className="g-3">
              {cursos.map((curso) => {
                const isSelected = selectedCurso && selectedCurso.id === curso.id;
                return (
                  <Col xs={12} sm={6} lg={4} key={curso.id}>
                    <Card
                      className={`h-100 shadow-sm border p-3 cursor-pointer transition-all ${
                        isSelected ? "border-primary bg-primary-subtle shadow" : "bg-white"
                      }`}
                      style={{
                        cursor: "pointer",
                        borderWidth: isSelected ? "2px" : "1px",
                        transform: isSelected ? "scale(1.01)" : "none"
                      }}
                      onClick={() => handleSelectCurso(curso)}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Badge bg={isSelected ? "primary" : "secondary"}>
                          {curso.category || "Preparatório"}
                        </Badge>
                        <Badge bg="success">Matriculado</Badge>
                      </div>

                      <Card.Title className="fw-bold fs-6 mb-2 text-dark">
                        {curso.title}
                      </Card.Title>

                      <Card.Text className="text-muted small mb-3" style={{ minHeight: "38px" }}>
                        {curso.description
                          ? curso.description.substring(0, 90) + (curso.description.length > 90 ? "..." : "")
                          : "Acesse aulas, simulados e materiais deste preparatório."}
                      </Card.Text>

                      <div className="mt-auto">
                        <div className="d-flex justify-content-between align-items-center mb-1 small">
                          <span className="text-muted">Progresso</span>
                          <span className="fw-bold text-primary">
                            {isSelected ? courseProgress : (curso.progress || 0)}%
                          </span>
                        </div>
                        <ProgressBar
                          now={isSelected ? courseProgress : (curso.progress || 0)}
                          variant="primary"
                          style={{ height: "6px" }}
                          className="mb-3"
                        />
                        <Button
                          variant={isSelected ? "primary" : "outline-primary"}
                          size="sm"
                          className="w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                          onClick={() => handleSelectCurso(curso)}
                        >
                          <FaPlayCircle /> {isSelected ? "Em Sala de Aula" : "Acessar Curso"}
                        </Button>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <Alert variant="warning" className="border-0 shadow-sm d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <h6 className="fw-bold mb-1">Nenhum curso matriculado encontrado.</h6>
                <p className="mb-0 small">
                  Você ainda não possui inscrições ativas ou sua matrícula aguarda validação.
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={() => navigate("/CoursesPage")}>
                Conhecer Cursos Disponíveis
              </Button>
            </Alert>
          )}
        </div>

        {/* 🔹 Sala de Aula: Videoaulas, Player & Conteúdo Programático */}
        {selectedCurso && (
          <div id="sala-de-aula" className="mb-5 pt-3">
            <div className="bg-white p-3 p-md-4 rounded-3 shadow-sm border mb-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2 border-bottom">
                <div>
                  <Badge bg="primary" className="mb-1">
                    {selectedCurso.category || "Curso"}
                  </Badge>
                  <h4 className="fw-bold text-dark mb-0">{selectedCurso.title}</h4>
                </div>
                <div className="text-end">
                  <div className="small text-muted">Progresso geral</div>
                  <div className="fw-bold fs-5 text-primary">{courseProgress}%</div>
                </div>
              </div>

              <Row className="g-4">
                {/* 🔹 Player de Vídeo e Detalhes da Aula */}
                <Col xs={12} lg={8}>
                  {loadingDetalhes ? (
                    <div className="text-center py-5 bg-light rounded border">
                      <Spinner animation="border" variant="primary" />
                      <p className="text-muted mt-2 small">A carregar conteúdos do curso...</p>
                    </div>
                  ) : selectedVideo ? (
                    <div>
                      {/* Container do Vídeo com Player Adaptável */}
                      <div
                        className="bg-dark rounded-3 overflow-hidden shadow-sm position-relative mb-3"
                        style={{ minHeight: "360px" }}
                      >
                        {videoSource?.type === "video" ? (
                          <video
                            controls
                            controlsList="nodownload"
                            className="w-100 h-100"
                            style={{ maxHeight: "480px", display: "block", backgroundColor: "#000" }}
                            src={videoSource.src}
                            key={videoSource.src}
                          >
                            O seu navegador não suporta a reprodução deste formato.
                          </video>
                        ) : videoSource?.type === "iframe" ? (
                          <div className="ratio ratio-16x9">
                            <iframe
                              src={videoSource.src}
                              title={selectedVideo.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            ></iframe>
                          </div>
                        ) : (
                          <div className="p-5 text-center text-white">
                            <i className="fa fa-film fa-3x mb-3 text-secondary"></i>
                            <h5>Vídeo em processamento</h5>
                            <p className="text-muted small">
                              Este conteúdo está a ser otimizado pelo instrutor. Acesse os materiais em anexo abaixo.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Barra de Controles da Aula */}
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                        <div>
                          <h5 className="fw-bold text-dark mb-1">{selectedVideo.title}</h5>
                          <small className="text-muted">
                            {selectedVideo.moduleTitle || selectedVideo.disciplina || "Geral"} • {selectedVideo.duration || 30} min
                          </small>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          <Button
                            variant={isCurrentCompleted ? "success" : "outline-success"}
                            size="sm"
                            className="fw-bold d-flex align-items-center gap-1"
                            onClick={() => handleToggleComplete(selectedVideo.id)}
                          >
                            <FaCheckCircle /> {isCurrentCompleted ? "Aula Concluída" : "Marcar como Concluída"}
                          </Button>

                          <ButtonGroup size="sm">
                            <Button
                              variant="light"
                              className="border"
                              onClick={() => handleNavigateLesson("prev")}
                              title="Aula Anterior"
                            >
                              <FaChevronLeft />
                            </Button>
                            <Button
                              variant="light"
                              className="border"
                              onClick={() => handleNavigateLesson("next")}
                              title="Próxima Aula"
                            >
                              <FaChevronRight />
                            </Button>
                          </ButtonGroup>
                        </div>
                      </div>

                      {/* Descrição do Tema e Anexo Direto */}
                      {selectedVideo.tema && selectedVideo.tema !== selectedVideo.title && (
                        <div className="p-3 bg-light rounded border mb-3">
                          <strong className="d-block text-secondary small mb-1">CONTEÚDO PROGRAMÁTICO:</strong>
                          <p className="mb-0 text-muted small">{selectedVideo.tema}</p>
                        </div>
                      )}

                      {/* Material da Aula */}
                      {selectedVideo.attachmentUrl && (
                        <div className="d-flex align-items-center justify-content-between p-3 bg-primary-subtle rounded border border-primary-subtle mb-3">
                          <div className="d-flex align-items-center gap-2">
                            <FaFileDownload className="text-primary fs-4" />
                            <div>
                              <strong className="d-block small text-dark">
                                {selectedVideo.attachmentName || "Material de Apoio da Aula"}
                              </strong>
                              <small className="text-muted">PDF / Material complementar</small>
                            </div>
                          </div>
                          <a
                            href={formatMaterialUrl(selectedVideo.attachmentUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-primary fw-bold"
                          >
                            Baixar Material
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-5 text-center bg-light rounded border">
                      <FaVideo className="text-muted fa-3x mb-3" />
                      <h5>Nenhuma videoaula cadastrada para este curso ainda.</h5>
                      <p className="text-muted small">
                        O instrutor está atualizando as aulas. Verifique os materiais complementares em PDF ao lado.
                      </p>
                    </div>
                  )}
                </Col>

                {/* 🔹 Lista de Aulas do Curso (Currículo) */}
                <Col xs={12} lg={4}>
                  <div className="bg-light p-3 rounded-3 border h-100 d-flex flex-column">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
                      <FaVideo className="text-primary" /> Conteúdo do Curso ({dadosCurso.videoLessonsArray.length} aulas)
                    </h6>

                    <div
                      className="flex-grow-1 overflow-auto pe-1"
                      style={{ maxHeight: "540px" }}
                    >
                      {dadosCurso.videoLessonsArray.length > 0 ? (
                        dadosCurso.videoLessonsArray.map((aula, index) => {
                          const isPlaying = selectedVideo && selectedVideo.id === aula.id;
                          const isDone = completedLessons.includes(aula.id);

                          return (
                            <div
                              key={aula.id || index}
                              className={`p-2 mb-2 rounded-2 border cursor-pointer transition-all d-flex align-items-start gap-2 ${
                                isPlaying
                                  ? "bg-white border-primary shadow-sm"
                                  : "bg-white border-light-subtle hover-bg-light"
                              }`}
                              style={{ cursor: "pointer" }}
                              onClick={() => setSelectedVideo(aula)}
                            >
                              <div className="pt-1">
                                {isDone ? (
                                  <FaCheckCircle className="text-success" />
                                ) : isPlaying ? (
                                  <FaPlayCircle className="text-primary" />
                                ) : (
                                  <span className="badge bg-light text-secondary border">
                                    {index + 1}
                                  </span>
                                )}
                              </div>
                              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                <div
                                  className={`small fw-semibold text-truncate ${
                                    isPlaying ? "text-primary" : "text-dark"
                                  }`}
                                  title={aula.title}
                                >
                                  {aula.title}
                                </div>
                                <div className="d-flex justify-content-between align-items-center text-muted" style={{ fontSize: "11px" }}>
                                  <span>{aula.moduleTitle || "Geral"}</span>
                                  <span>{aula.duration || 30} min</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-muted small text-center py-4 mb-0">
                          Nenhuma videoaula listada para este preparatório.
                        </p>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        )}

        {/* 🔹 Seção de Materiais Didáticos em PDF */}
        <Row className="g-4 mb-5">
          <Col xs={12}>
            <div className="bg-white p-3 p-md-4 rounded-3 shadow-sm border">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: "#0044fc" }}>
                  <FaFolderOpen /> Apostilas e Materiais Didáticos em PDF
                </h5>
                <small className="text-muted">
                  {dadosCurso.supportMaterials?.length || 0} materiais disponíveis
                </small>
              </div>

              {dadosCurso.supportMaterials && dadosCurso.supportMaterials.length > 0 ? (
                <Row className="g-3">
                  {dadosCurso.supportMaterials.map((material, idx) => (
                    <Col xs={12} sm={6} md={4} key={material.id || idx}>
                      <div className="p-3 bg-light rounded-3 border d-flex justify-content-between align-items-center h-100">
                        <div className="me-2 overflow-hidden">
                          <i className="far fa-file-pdf text-danger me-2 fs-5"></i>
                          <span className="small fw-semibold text-dark text-truncate d-inline-block align-middle" style={{ maxWidth: "200px" }} title={material.discipline}>
                            {material.discipline}
                          </span>
                        </div>
                        <a
                          href={formatMaterialUrl(material.materialUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="btn btn-sm btn-outline-primary fw-bold text-nowrap"
                        >
                          <i className="fa fa-download me-1"></i> Abrir
                        </a>
                      </div>
                    </Col>
                  ))}
                </Row>
              ) : (
                <Alert variant="light" className="border text-center text-muted small mb-0 py-4">
                  Nenhum arquivo PDF carregado para este curso. Todos os materiais serão sincronizados automaticamente assim que disponibilizados pelo corpo docente.
                </Alert>
              )}
            </div>
          </Col>
        </Row>

        {/* Estatísticas e Histórico de Simulados */}
        <Row className="g-4">
          <Col xs={12} lg={7}>
            <div className="bg-white p-3 p-md-4 rounded-3 shadow-sm border h-100">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: "#0044fc" }}>
                <FaChartBar /> Desempenho por Disciplina
              </h5>
              <ExamVerticalHistogram data={examHistory} />
            </div>
          </Col>

          <Col xs={12} lg={5}>
            <div className="bg-white p-3 p-md-4 rounded-3 shadow-sm border h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: "#0044fc" }}>
                  <FaHistory /> Histórico de Simulados
                </h5>
                <Button variant="outline-primary" size="sm" onClick={() => navigate("/ChangePage")}>
                  Fazer Simulado
                </Button>
              </div>
              {loadingExams ? (
                <div className="text-center py-4 text-muted small">
                  <Spinner animation="border" size="sm" variant="primary" className="me-2" />
                  Carregando histórico...
                </div>
              ) : examHistory.length > 0 ? (
                <div className="list-group" style={{ maxHeight: "360px", overflowY: "auto" }}>
                  {examHistory.map((exame, i) => (
                    <div key={exame.id || i} className="list-group-item border-0 bg-light rounded mb-2 p-3">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <div>
                          <strong className="text-dark d-block">{exame.titulo || `Simulado #${i + 1}`}</strong>
                          <small className="text-muted">{exame.data}</small>
                        </div>
                        {exame.score !== undefined && (
                          <Badge bg={exame.score >= 70 ? "success" : exame.score >= 50 ? "warning" : "danger"}>
                            {exame.score}% aproveitamento
                          </Badge>
                        )}
                      </div>

                      {exame.disciplinas && exame.disciplinas.length > 0 ? (
                        <ul className="small list-unstyled mt-2 mb-0">
                          {exame.disciplinas.slice(0, 3).map((d, j) => (
                            <li key={j} className="text-muted">
                              <strong>{d.nome || d.disciplina}:</strong> {d.respondidas ?? d.acertos ?? 0} acertos / {d.naoRespondidas ?? d.erros ?? 0} erros
                            </li>
                          ))}
                          {exame.disciplinas.length > 3 && (
                            <li className="text-muted fst-italic" style={{ fontSize: "11px" }}>
                              + {exame.disciplinas.length - 3} outra(s) matéria(s)
                            </li>
                          )}
                        </ul>
                      ) : (
                        <div className="small text-muted mt-2">
                          Resultado: <strong>{exame.acertos}</strong> acertos / <strong>{exame.erros}</strong> erros (Total: {exame.total})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 bg-light rounded-3 border">
                  <FaHistory className="text-secondary fa-2x mb-2 opacity-50" />
                  <h6 className="fw-bold text-dark mb-1">Nenhum simulado realizado</h6>
                  <p className="text-muted small mb-3">
                    Você ainda não fez nenhum simulado. Inicie um exame para registrar suas notas e evolução real.
                  </p>
                  <Button variant="primary" size="sm" onClick={() => navigate("/ChangePage")}>
                    Fazer Primeiro Simulado
                  </Button>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Container>

      <AppFooter />

      {/* Modal de Edição de Perfil do Aluno */}
      <UserProfileModal
        show={showProfileModal}
        onHide={() => setShowProfileModal(false)}
        user={user}
        onProfileUpdated={(updated) => {
          setUser((prev) => ({ ...prev, ...updated }));
        }}
      />
    </div>
  );
}
