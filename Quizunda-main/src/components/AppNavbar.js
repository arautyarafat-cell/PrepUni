import React, { useState, useEffect, useContext } from "react";
import { Container, Modal, Form, Button, Alert, Offcanvas, Dropdown } from "react-bootstrap";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { getRedirectPathForRole } from "../utils/roleRedirect";
import { API_BASE_URL, getUploadUrl } from "../config/apiConfig";
import UserProfileModal from "./UserProfileModal";

export default function AppNavbar({ onSearch }) {
  const { user: contextUser, login: contextLogin, logout: contextLogout } = useContext(AuthContext) || {};
  const { getWhatsAppLink } = useSettings();
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const isAdminOrStaff = Boolean(
    user && (
      ["admin", "instrutor", "instructor", "professor"].includes((user.role || "").toLowerCase()) ||
      location.pathname.toLowerCase().includes("admin")
    )
  );

  useEffect(() => {
    if (contextUser) {
      setUser(contextUser);
    } else {
      const storedUser = localStorage.getItem("user") || localStorage.getItem("adminUser");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error(e);
        }
      } else {
        setUser(null);
      }
    }
  }, [contextUser]);

  const handleLogout = () => {
    if (contextLogout) {
      contextLogout();
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("adminUser");
      localStorage.removeItem("adminToken");
    }
    setUser(null);
    setShowMobileMenu(false);
    navigate("/");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setShowMobileMenu(false);
    setShowMobileSearch(false);
    if (onSearch) {
      onSearch(searchTerm);
    } else {
      navigate(`/CoursesPage?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleNavigate = (path) => {
    setShowMobileMenu(false);
    navigate(path);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      let loggedUser = null;
      if (contextLogin) {
        loggedUser = await contextLogin(loginEmail, loginPassword);
      } else {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailOrPhone: loginEmail, password: loginPassword }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "E-mail/CPF ou senha incorretos.");
        }
        loggedUser = {
          ...data.user,
          role: (data.role || "estudante").toLowerCase(),
          token: data.token
        };
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(loggedUser));
        const isStaff = ["admin", "instrutor", "instructor", "professor"].includes(loggedUser.role);
        if (isStaff) {
          localStorage.setItem("adminUser", JSON.stringify(loggedUser));
          localStorage.setItem("adminToken", data.token);
        }
      }

      setUser(loggedUser);
      setShowLoginModal(false);

      // Redirecionamento inteligente baseado no papel autenticado
      const targetPath = getRedirectPathForRole(loggedUser.role);
      navigate(targetPath);
    } catch (err) {
      console.error(err);
      setLoginError(err.message || "Erro ao comunicar com o servidor.");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <>
      {/* 🔹 Barra Superior Negra (#menu-topo) */}
      <div className="ep-topbar">
        <Container className="d-flex justify-content-between align-items-center">
          <div className="ep-topbar-scroll d-flex align-items-center">
            <a href="/Sobre">Sobre</a>
            <a href="/#noticias">Notícias</a>
            <a href="/#depoimentos">Depoimentos</a>
            <a href="/Sobre">Equipe</a>
            <a href="/#galeria">Galeria</a>
            <a href="/Contato">Fale Conosco</a>
          </div>
        </Container>
      </div>

      {/* 🔹 Header Principal com Logo, Busca e Menu */}
      <header className="ep-main-header">
        <Container>
          <div className="row align-items-center">
            {/* Logo */}
            <div className="col-6 col-sm-5 col-lg-3">
              <Link to="/" className="d-inline-flex align-items-center text-decoration-none">
                <img
                  src="/logo-preparatorio.svg"
                  alt="Preparatório Universitário"
                  className="ep-logo-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/logo.svg";
                  }}
                />
              </Link>
            </div>

            {/* Campo de Busca (Desktop) */}
            <div className="col-lg-4 d-none d-lg-block">
              <form className="ep-search-form" onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  className="form-control ep-search-input"
                  placeholder="O que você procura?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="ep-search-btn" title="Pesquisar">
                  <i className="fa fa-search"></i>
                </button>
              </form>
            </div>

            {/* Menu de Navegação (Desktop) */}
            <div className="col-lg-3 d-none d-lg-block">
              <ul className="ep-mainmenu justify-content-center">
                <li>
                  <Link to="/" className={location.pathname === "/" ? "active" : ""}>
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/CoursesPage" className={location.pathname === "/CoursesPage" ? "active" : ""}>
                    Cursos
                  </Link>
                </li>
                <li>
                  <Link to="/Sobre" className={location.pathname === "/Sobre" ? "active" : ""}>
                    Sobre
                  </Link>
                </li>
              </ul>
            </div>

            {/* Ações (Desktop & Mobile) */}
            <div className="col-6 col-sm-7 col-lg-2 text-end">
              <div className="d-flex align-items-center justify-content-end gap-2">
                {/* Botão de Busca Mobile */}
                <button
                  type="button"
                  className="btn btn-light ep-mobile-icon-btn d-lg-none"
                  onClick={() => setShowMobileSearch(!showMobileSearch)}
                  aria-label="Abrir busca"
                >
                  <i className={`fa ${showMobileSearch ? "fa-times" : "fa-search"}`}></i>
                </button>

                {!user ? (
                  <Button
                    className="ep-btn-entrar"
                    onClick={() => setShowLoginModal(true)}
                  >
                    <i className="far fa-user"></i>
                    <span className="d-none d-sm-inline">Entrar</span>
                  </Button>
                ) : (
                  <div className="d-flex align-items-center gap-1">
                    {/* Menu Suspenso do Administrador / Instrutor ou Botão Portal Aluno */}
                    {["admin", "instrutor", "instructor", "professor"].includes((user.role || "").toLowerCase()) ? (
                      <Dropdown align="end" className="d-inline-block">
                        <Dropdown.Toggle
                          variant="warning"
                          size="sm"
                          className="ep-btn-admin-portal fw-bold text-dark border-0 shadow-sm d-flex align-items-center gap-1"
                          id="admin-menu-dropdown"
                          title={user.role === "admin" ? "Menu Suspenso do Administrador" : "Menu Suspenso do Instrutor"}
                        >
                          <i className={`fa ${user.role === "admin" ? "fa-shield-alt" : "fa-chalkboard-teacher"}`}></i>
                          <span className="d-none d-sm-inline">{user.role === "admin" ? "Admin" : "Instrutor"}</span>
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="shadow border-0 py-2 mt-1" style={{ minWidth: "220px", zIndex: 1050 }}>
                          <div className="px-3 py-1 border-bottom mb-1">
                            <div className="fw-bold small text-dark">
                              {user.role === "admin" ? "Painel Administrativo" : "Painel do Instrutor"}
                            </div>
                            <small className="text-muted" style={{ fontSize: "11px" }}>Menu de Gestão</small>
                          </div>

                          <Dropdown.Item onClick={() => navigate("/AdminDashboard?tab=dashboard")} className="py-2">
                            <i className="fa fa-tachometer-alt me-2 text-primary" style={{ width: "16px" }}></i>
                            <span>Visão Geral</span>
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => navigate("/AdminDashboard?tab=courses")} className="py-2">
                            <i className="fa fa-book me-2 text-primary" style={{ width: "16px" }}></i>
                            <span>Cursos</span>
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => navigate("/AdminDashboard?tab=curriculum")} className="py-2">
                            <i className="fa fa-layer-group me-2 text-primary" style={{ width: "16px" }}></i>
                            <span>Módulos & Aulas</span>
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => navigate("/AdminDashboard?tab=exams")} className="py-2">
                            <i className="fa fa-question-circle me-2 text-primary" style={{ width: "16px" }}></i>
                            <span>Avaliações & Questões</span>
                          </Dropdown.Item>
                          {user.role === "admin" && (
                            <>
                              <Dropdown.Item onClick={() => navigate("/AdminDashboard?tab=students")} className="py-2">
                                <i className="fa fa-user-graduate me-2 text-primary" style={{ width: "16px" }}></i>
                                <span>Alunos</span>
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => navigate("/AdminDashboard?tab=enrollments")} className="py-2">
                                <i className="fa fa-id-card me-2 text-primary" style={{ width: "16px" }}></i>
                                <span>Matrículas</span>
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => navigate("/AdminDashboard?tab=progress")} className="py-2">
                                <i className="fa fa-chart-line me-2 text-primary" style={{ width: "16px" }}></i>
                                <span>Progresso & Notas</span>
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => navigate("/AdminDashboard?tab=certificates")} className="py-2">
                                <i className="fa fa-certificate me-2 text-primary" style={{ width: "16px" }}></i>
                                <span>Certificados</span>
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => navigate("/AdminDashboard?tab=settings")} className="py-2">
                                <i className="fa fa-cog me-2 text-primary" style={{ width: "16px" }}></i>
                                <span>Configurações</span>
                              </Dropdown.Item>
                            </>
                          )}
                          <Dropdown.Divider />
                          <Dropdown.Item onClick={() => navigate("/CoursesPage")} className="py-2 text-secondary">
                            <i className="fa fa-external-link-alt me-2" style={{ width: "16px" }}></i>
                            <span>Ver Loja / Catálogo</span>
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    ) : (
                      <Button
                        variant="outline-primary"
                        className="ep-btn-portal"
                        onClick={() => navigate(getRedirectPathForRole(user.role))}
                      >
                        <i className="fa fa-user-graduate me-1"></i>
                        <span className="d-none d-sm-inline">Portal</span>
                      </Button>
                    )}

                    {/* Botão Sair no Header (Apenas Desktop - no Mobile fica no menu hambúrguer) */}
                    <Button
                      variant="light"
                      size="sm"
                      className="text-danger border ep-btn-logout-header d-none d-lg-inline-flex"
                      onClick={handleLogout}
                      title="Terminar Sessão"
                    >
                      <i className="fa fa-sign-out-alt"></i>
                    </Button>
                  </div>
                )}

                {/* Botão Hambúrguer Mobile */}
                <button
                  type="button"
                  className="btn ep-hamburger-btn d-lg-none"
                  onClick={() => setShowMobileMenu(true)}
                  aria-label="Menu principal"
                >
                  <i className="fa fa-bars"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Barra de Busca Retrátil (Mobile) */}
          {showMobileSearch && (
            <div className="d-lg-none pt-2 pb-1 border-top mt-2">
              <form className="ep-search-form w-100" onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  className="form-control ep-search-input"
                  placeholder="Pesquisar cursos, provas, matérias..."
                  value={searchTerm}
                  autoFocus
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="ep-search-btn" title="Pesquisar">
                  <i className="fa fa-search"></i>
                </button>
              </form>
            </div>
          )}
        </Container>
      </header>

      {/* 🔹 Menu Lateral Responsivo (Offcanvas Mobile Drawer) */}
      <Offcanvas
        show={showMobileMenu}
        onHide={() => setShowMobileMenu(false)}
        placement="end"
        className="ep-offcanvas"
      >
        <Offcanvas.Header closeButton className="border-bottom py-3">
          <Offcanvas.Title className="d-flex align-items-center">
            <img
              src="/logo-preparatorio.svg"
              alt="Preparatório Universitário"
              style={{ maxHeight: "38px" }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/logo.svg";
              }}
            />
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body className="d-flex flex-column p-0">
          {/* Card de Usuário / Login */}
          <div className="p-3 bg-light border-bottom">
            {user ? (
              <div>
                <div className="d-flex align-items-center gap-3">
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      backgroundColor: "#eef2ff",
                      border: "2px solid #0044fc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    {user.avatar ? (
                      <img
                        src={getUploadUrl(user.avatar)}
                        alt={user.name || "Perfil"}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user.name || "U"
                          )}&background=0044fc&color=fff&size=80&bold=true`;
                        }}
                      />
                    ) : (
                      <i className={user.role === "admin" ? "fa fa-shield-alt text-warning fs-5" : ["instrutor", "instructor", "professor"].includes((user.role || "").toLowerCase()) ? "fa fa-chalkboard-teacher text-warning fs-5" : "fa fa-user-graduate text-primary fs-5"}></i>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <strong className="d-block text-dark text-truncate fs-6">
                      {user.name || user.username || user.emailOrPhone || "Usuário"}
                    </strong>
                    <div className="d-flex align-items-center gap-1 mt-1">
                      <span className={`badge ${user.role === "admin" ? "bg-warning text-dark" : ["instrutor", "instructor", "professor"].includes((user.role || "").toLowerCase()) ? "bg-info text-dark" : "bg-primary"} text-uppercase`} style={{ fontSize: "10px" }}>
                        {user.role === "admin" ? "Administrador" : ["instrutor", "instructor", "professor"].includes((user.role || "").toLowerCase()) ? "Instrutor" : (user.role || "Aluno Ativo")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação no Menu Hambúrguer: Editar Perfil e Painel/Portal */}
                <div className="d-flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="w-100 fw-bold d-flex align-items-center justify-content-center gap-2 py-2"
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowProfileModal(true);
                    }}
                    title="Editar Perfil"
                  >
                    <i className="fa fa-user-edit"></i>
                    <span>Editar Perfil</span>
                  </Button>

                  {["admin", "instrutor", "instructor", "professor"].includes((user.role || "").toLowerCase()) ? (
                    <Button
                      size="sm"
                      variant="warning"
                      className="ep-btn-entrar w-100 fw-bold text-dark border-0 justify-content-center py-2"
                      style={{ backgroundColor: "#ffc107" }}
                      onClick={() => handleNavigate("/AdminDashboard")}
                    >
                      <i className="fa fa-tachometer-alt me-1"></i> Painel
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      className="ep-btn-entrar w-100 justify-content-center py-2"
                      onClick={() => handleNavigate(getRedirectPathForRole(user.role))}
                    >
                      <i className="fa fa-user-graduate me-1"></i> Portal
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Button
                  className="ep-btn-entrar w-50 justify-content-center"
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowLoginModal(true);
                  }}
                >
                  <i className="far fa-user me-1"></i> Entrar
                </Button>
                <Button
                  variant="outline-primary"
                  className="w-50 fw-bold"
                  onClick={() => handleNavigate("/RegisterPage")}
                >
                  Cadastrar
                </Button>
              </div>
            )}
          </div>

          {/* Busca no Drawer Mobile */}
          <div className="p-3 border-bottom">
            <form onSubmit={handleSearchSubmit} className="position-relative">
              <input
                type="text"
                className="form-control ep-search-input pe-5"
                placeholder="Buscar no catálogo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="btn position-absolute top-50 end-0 translate-middle-y text-primary border-0 me-2"
              >
                <i className="fa fa-search"></i>
              </button>
            </form>
          </div>

          {/* Links de Navegação Principal */}
          <div className="flex-grow-1 overflow-auto py-2">
            <div className="px-3 py-1 text-uppercase text-muted fw-bold small" style={{ fontSize: "11px", letterSpacing: "1px" }}>
              Navegação
            </div>

            <nav className="ep-mobile-nav">
              <button
                type="button"
                className={`ep-mobile-nav-item ${location.pathname === "/" ? "active" : ""}`}
                onClick={() => handleNavigate("/")}
              >
                <i className="fa fa-home"></i>
                <span>Início (Home)</span>
              </button>

              <button
                type="button"
                className={`ep-mobile-nav-item ${location.pathname === "/CoursesPage" ? "active" : ""}`}
                onClick={() => handleNavigate("/CoursesPage")}
              >
                <i className="fa fa-book-open"></i>
                <span>Cursos Preparatórios</span>
              </button>

              <button
                type="button"
                className={`ep-mobile-nav-item ${location.pathname === "/ChangePage" ? "active" : ""}`}
                onClick={() => handleNavigate("/ChangePage")}
              >
                <i className="fa fa-clipboard-check"></i>
                <span>Simulados & Salas de Exame</span>
              </button>

              <button
                type="button"
                className={`ep-mobile-nav-item ${location.pathname === "/MTcomplementarPage" ? "active" : ""}`}
                onClick={() => handleNavigate("/MTcomplementarPage")}
              >
                <i className="fa fa-file-pdf"></i>
                <span>Materiais de Apoio (PDFs)</span>
              </button>

              <button
                type="button"
                className={`ep-mobile-nav-item ${location.pathname === "/Sobre" ? "active" : ""}`}
                onClick={() => handleNavigate("/Sobre")}
              >
                <i className="fa fa-users"></i>
                <span>Sobre Nós & Professores</span>
              </button>

              <button
                type="button"
                className={`ep-mobile-nav-item ${location.pathname === "/Contato" ? "active" : ""}`}
                onClick={() => handleNavigate("/Contato")}
              >
                <i className="fa fa-headset"></i>
                <span>Fale Conosco</span>
              </button>
            </nav>

            {/* Seção Administrador no Menu Hambúrguer (Mobile) */}
            {user && ["admin", "instrutor", "instructor", "professor"].includes((user.role || "").toLowerCase()) && (
              <>
                <div className="px-3 pt-3 pb-1 text-uppercase text-muted fw-bold small" style={{ fontSize: "11px", letterSpacing: "1px" }}>
                  <i className="fa fa-shield-alt text-warning me-1"></i> {user.role === "admin" ? "Administração" : "Área do Instrutor"}
                </div>
                <nav className="ep-mobile-nav">
                  <button
                    type="button"
                    className="ep-mobile-nav-item"
                    onClick={() => handleNavigate("/AdminDashboard?tab=dashboard")}
                  >
                    <i className="fa fa-tachometer-alt"></i>
                    <span>Visão Geral</span>
                  </button>
                  <button
                    type="button"
                    className="ep-mobile-nav-item"
                    onClick={() => handleNavigate("/AdminDashboard?tab=courses")}
                  >
                    <i className="fa fa-book"></i>
                    <span>Gerenciar Cursos</span>
                  </button>
                  <button
                    type="button"
                    className="ep-mobile-nav-item"
                    onClick={() => handleNavigate("/AdminDashboard?tab=curriculum")}
                  >
                    <i className="fa fa-layer-group"></i>
                    <span>Módulos & Aulas</span>
                  </button>
                  <button
                    type="button"
                    className="ep-mobile-nav-item"
                    onClick={() => handleNavigate("/AdminDashboard?tab=exams")}
                  >
                    <i className="fa fa-question-circle"></i>
                    <span>Avaliações & Questões</span>
                  </button>
                  {user.role === "admin" && (
                    <>
                      <button
                        type="button"
                        className="ep-mobile-nav-item"
                        onClick={() => handleNavigate("/AdminDashboard?tab=students")}
                      >
                        <i className="fa fa-user-graduate"></i>
                        <span>Alunos</span>
                      </button>
                      <button
                        type="button"
                        className="ep-mobile-nav-item"
                        onClick={() => handleNavigate("/AdminDashboard?tab=enrollments")}
                      >
                        <i className="fa fa-id-card"></i>
                        <span>Matrículas</span>
                      </button>
                      <button
                        type="button"
                        className="ep-mobile-nav-item"
                        onClick={() => handleNavigate("/AdminDashboard?tab=settings")}
                      >
                        <i className="fa fa-cog"></i>
                        <span>Configurações</span>
                      </button>
                    </>
                  )}
                </nav>
              </>
            )}

            <div className="px-3 pt-3 pb-1 text-uppercase text-muted fw-bold small" style={{ fontSize: "11px", letterSpacing: "1px" }}>
              Atalhos & Institucional
            </div>

            <nav className="ep-mobile-nav">
              <button
                type="button"
                className="ep-mobile-nav-item"
                onClick={() => handleNavigate("/#noticias")}
              >
                <i className="fa fa-newspaper"></i>
                <span>Notícias de Concursos</span>
              </button>

              <button
                type="button"
                className="ep-mobile-nav-item"
                onClick={() => handleNavigate("/#depoimentos")}
              >
                <i className="fa fa-comment-dots"></i>
                <span>Depoimentos de Aprovados</span>
              </button>

              <button
                type="button"
                className="ep-mobile-nav-item"
                onClick={() => handleNavigate("/#galeria")}
              >
                <i className="fa fa-award"></i>
                <span>Galeria de Aprovados</span>
              </button>
            </nav>
          </div>

          {/* Suporte WhatsApp & Rodapé do Drawer com Botão Sair */}
          <div className="p-3 bg-light border-top mt-auto">
            {user && (
              <Button
                variant="danger"
                className="w-100 fw-bold d-flex align-items-center justify-content-center gap-2 py-2 mb-2 shadow-sm"
                onClick={handleLogout}
              >
                <i className="fa fa-sign-out-alt"></i> Sair da Conta
              </Button>
            )}
            <Button
              variant="success"
              className="w-100 fw-bold d-flex align-items-center justify-content-center gap-2 py-2 mb-2"
              href={getWhatsAppLink("Olá! Vim pelo site e gostaria de informações.")}
              target="_blank"
              rel="noreferrer"
            >
              <i className="fab fa-whatsapp fs-5"></i> Suporte WhatsApp
            </Button>
            <div className="text-center text-muted small" style={{ fontSize: "11px" }}>
              Preparatório Universitário • Todos os direitos reservados
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      {/* 🔹 Modal Oficial de Login (Preparatório Universitário) */}
      <Modal
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
        centered
        id="login-modal-home"
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold w-100 text-center" style={{ color: "#0044fc" }}>
            Faça seu login
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-3 px-md-4 py-4">
          {loginError && <Alert variant="danger">{loginError}</Alert>}
          <Form onSubmit={handleLoginSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold text-muted small">E-mail ou CPF</Form.Label>
              <Form.Control
                type="text"
                className="ep-form-control"
                placeholder="Digite seu CPF ou E-mail"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold text-muted small">Senha</Form.Label>
              <Form.Control
                type="password"
                className="ep-form-control"
                placeholder="Digite sua senha"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button
              type="submit"
              className="ep-btn-submit"
              disabled={loginLoading}
            >
              {loginLoading ? "Acessando..." : "Entrar"}
            </Button>
          </Form>

          <div className="text-center mt-3 small">
            <span className="text-muted">Não tem conta ainda? </span>
            <a href="/RegisterPage" className="fw-bold">Cadastre-se</a>
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-content-center bg-light">
          <small className="text-muted">
            Esqueceu sua senha?{" "}
            <a href="/RecuperarSenha" className="fw-bold">Recupere</a>
          </small>
        </Modal.Footer>
      </Modal>

      {/* 🔹 Modal de Edição de Perfil (Aluno, Instrutor ou Admin) */}
      <UserProfileModal
        show={showProfileModal}
        onHide={() => setShowProfileModal(false)}
        user={user}
        onProfileUpdated={(updated) => {
          setUser((prev) => ({ ...prev, ...updated }));
        }}
      />
    </>
  );
}
