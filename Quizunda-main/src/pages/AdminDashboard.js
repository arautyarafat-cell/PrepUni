import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Badge,
  Modal,
  Form,
  InputGroup,
  Tab,
  Nav,
  Alert,
  Spinner,
  ProgressBar
} from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppNavbar from "../components/AppNavbar";
import AppFooter from "../components/AppFooter";
import UserProfileModal from "../components/UserProfileModal";
import { API_BASE_URL, getUploadUrl } from "../config/apiConfig";

const API_BASE = API_BASE_URL;

// Helper autenticado para chamadas da API administrativa
const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", "Bearer " + token);
  }
  return window.fetch(url, { ...options, headers });
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get("tab") || "dashboard";

  const [activeTab, setActiveTab] = useState(activeTabParam);
  const [adminUser, setAdminUser] = useState(null);
  const [showSelfProfileModal, setShowSelfProfileModal] = useState(false);

  // Alertas Globais
  const [globalMessage, setGlobalMessage] = useState({ type: "", text: "" });

  // 1. Dashboard State
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // 2. Cursos State
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [courseStatusFilter, setCourseStatusFilter] = useState("todos");
  const [courseCategoryFilter, setCourseCategoryFilter] = useState("todas");
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    price: "",
    duration: "12 meses",
    workload_hours: "40h",
    level: "Todos os níveis",
    category: "Geral",
    subcategory: "",
    country: "Angola",
    status: "publicado",
    instructor_id: "",
    account: "",
    iban: "",
    express_number: "",
    details: "",
    support_whatsapp: "",
    payment_whatsapp: "",
    thumbnail: null
  });

  // 3. Módulos e Aulas State
  const [selectedCourseForCurriculum, setSelectedCourseForCurriculum] = useState(null);
  const [curriculumModules, setCurriculumModules] = useState([]);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [moduleForm, setModuleForm] = useState({ title: "", description: "", order_index: 1 });

  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    module_id: "",
    title: "",
    description: "",
    content_type: "video",
    video_url: "",
    video_drive_url: "",
    attachment_url: "",
    text_content: "",
    duration_minutes: 30,
    order_index: 1,
    is_free_preview: false,
    attachment: null
  });

  // 4. Avaliações e Perguntas State
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [examForm, setExamForm] = useState({
    courseId: "",
    roomName: "",
    description: "",
    time_limit_minutes: 60,
    passing_score: 50,
    status: "ativo"
  });

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionExamFilter, setQuestionExamFilter] = useState("");
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    roomId: "",
    question: "",
    correctAnswer: "",
    wrongAnswer1: "",
    wrongAnswer2: "",
    wrongAnswer3: "",
    wrongAnswer4: "",
    tema: "",
    disciplina: "Geral",
    points: 10,
    explanation: ""
  });

  // 5. Alunos State
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({
    name: "",
    emailOrPhone: "",
    password: "",
    phone: "",
    bio: "",
    status: "ativo",
    role: "Estudante",
    avatar: "",
    avatarFile: null,
    avatarPreview: null,
    removeAvatar: false
  });
  const [studentOverview, setStudentOverview] = useState(null);
  const [showOverviewModal, setShowOverviewModal] = useState(false);

  // 6. Matrículas State
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState("todos");
  const [enrollmentSearch, setEnrollmentSearch] = useState("");
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [enrollmentForm, setEnrollmentForm] = useState({
    user_id: "",
    curso_id: "",
    data_expiracao: "",
    status: "ativa"
  });

  // 7. Progresso e Desempenho State
  const [progressData, setProgressData] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [examResults, setExamResults] = useState([]);

  // 8. Certificados State
  const [certificates, setCertificates] = useState([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedCertForPreview, setSelectedCertForPreview] = useState(null);
  const [certForm, setCertForm] = useState({
    user_id: "",
    course_id: "",
    grade: 100,
    workload_hours: "40h"
  });

  // 9. Categorias State
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", icon: "fa-folder" });

  // 10. Instrutores State
  const [instructors, setInstructors] = useState([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [showInstructorModal, setShowInstructorModal] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [instructorForm, setInstructorForm] = useState({
    name: "",
    emailOrPhone: "",
    password: "",
    phone: "",
    bio: "",
    avatar: "",
    avatarFile: null,
    avatarPreview: null,
    removeAvatar: false
  });

  // 11. Configurações State
  const [settings, setSettings] = useState({
    platform_name: "",
    contact_email: "",
    support_phone: "",
    support_whatsapp: "",
    payment_whatsapp: "",
    bna_iban: "",
    bna_express: "",
    currency_symbol: "Kz",
    allow_registration: true,
    certificate_min_score: 70,
    whatsapp_display: "",
    whatsapp_message: "",
    whatsapp_description: "",
    instagram_url: "",
    instagram_handle: "",
    instagram_description: "",
    youtube_url: "",
    youtube_title: "",
    youtube_description: "",
    location_title: "",
    location_address: "",
    location_description: "",
    location_link: "",
    location_button_text: "",
    facebook_url: "",
    banner_title: "",
    banner_subtitle: ""
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Inicialização e autenticação
  useEffect(() => {
    const saved = localStorage.getItem("adminUser") || localStorage.getItem("user");
    if (!saved) {
      navigate("/login?redirect=/AdminDashboard", { replace: true });
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      const role = (parsed.role || parsed.accountType || "").toLowerCase();
      const isAuthorized = ["admin", "instrutor", "instructor", "professor", "preparatorio"].includes(role);
      if (!isAuthorized) {
        navigate("/PortalPage", { replace: true });
        return;
      }
      setAdminUser(parsed);
    } catch {
      navigate("/login?redirect=/AdminDashboard", { replace: true });
    }
  }, [navigate]);

  // Sincronizar abas com URL query param
  useEffect(() => {
    if (activeTabParam && activeTabParam !== activeTab) {
      setActiveTab(activeTabParam);
    }
  }, [activeTabParam]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  const showFeedback = (type, text) => {
    setGlobalMessage({ type, text });
    setTimeout(() => {
      setGlobalMessage({ type: "", text: "" });
    }, 5000);
  };

  // Carregar dados conforme a aba ativa
  useEffect(() => {
    if (activeTab === "dashboard") loadDashboardStats();
    if (activeTab === "courses") loadCourses(courseSearch, courseStatusFilter, courseCategoryFilter);
    if (activeTab === "curriculum") {
      loadCourses("", "todos", "todas");
    }
    if (activeTab === "exams") {
      loadExams();
      loadQuestions();
      loadCourses("", "todos", "todas");
    }
    if (activeTab === "students") loadStudents();
    if (activeTab === "enrollments") {
      loadEnrollments();
      loadStudents();
      loadCourses("", "todos", "todas");
    }
    if (activeTab === "progress") {
      loadProgress();
      loadCourses("", "todos", "todas");
    }
    if (activeTab === "certificates") {
      loadCertificates();
      loadStudents();
      loadCourses("", "todos", "todas");
    }
    if (activeTab === "categories") loadCategories();
    if (activeTab === "instructors") loadInstructors();
    if (activeTab === "settings") loadSettings();
  }, [activeTab]);

  // 1. CARREGAR STATS
  const loadDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/dashboard-stats`);
      const data = await res.json();
      if (data.success) {
        setDashboardStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  // 2. CURSOS
  const loadCourses = async (search = courseSearch, status = courseStatusFilter, category = courseCategoryFilter) => {
    setLoadingCourses(true);
    try {
      const url = `${API_BASE}/admin/courses?q=${encodeURIComponent(search)}&status=${status}&category=${category}`;
      const res = await authFetch(url);
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(courseForm).forEach((key) => {
        if (key === "thumbnail" && courseForm[key] instanceof File) {
          formData.append("thumbnail", courseForm[key]);
        } else if (courseForm[key] !== null && courseForm[key] !== undefined) {
          formData.append(key, courseForm[key]);
        }
      });

      const url = editingCourse
        ? `${API_BASE}/admin/courses/${editingCourse.id}`
        : `${API_BASE}/admin/courses`;
      const method = editingCourse ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        body: formData
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao salvar curso.");

      showFeedback("success", editingCourse ? "Curso atualizado com sucesso!" : "Curso criado com sucesso!");
      setShowCourseModal(false);
      setEditingCourse(null);
      loadCourses();
    } catch (err) {
      showFeedback("danger", err.message);
    }
  };

  const handleToggleCourseStatus = async (courseId, currentStatus) => {
    const nextStatus = currentStatus === "publicado" ? "rascunho" : "publicado";
    try {
      const res = await authFetch(`${API_BASE}/admin/courses/${courseId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        showFeedback("success", `Curso ${nextStatus === "publicado" ? "publicado" : "despublicado"} com sucesso!`);
        loadCourses();
      }
    } catch (err) {
      showFeedback("danger", "Erro ao mudar status do curso.");
    }
  };

  const handleDeleteCourse = async (id, title) => {
    if (!window.confirm(`Tem certeza de que deseja eliminar o curso "${title}"? Todas as aulas e matrículas serão removidas.`)) {
      return;
    }
    try {
      const res = await authFetch(`${API_BASE}/admin/courses/${id}`, { method: "DELETE" });
      if (res.ok) {
        showFeedback("success", "Curso eliminado com sucesso!");
        loadCourses();
      }
    } catch (err) {
      showFeedback("danger", "Erro ao eliminar curso.");
    }
  };

  // 3. MÓDULOS E AULAS
  const handleSelectCourseForCurriculum = async (course) => {
    setSelectedCourseForCurriculum(course);
    setLoadingCurriculum(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/courses/${course.id}/modules`);
      const data = await res.json();
      setCurriculumModules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCurriculum(false);
    }
  };

  const handleSaveModule = async (e) => {
    e.preventDefault();
    if (!selectedCourseForCurriculum) return;
    try {
      const url = editingModule
        ? `${API_BASE}/admin/modules/${editingModule.id}`
        : `${API_BASE}/admin/modules`;
      const method = editingModule ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...moduleForm,
          course_id: selectedCourseForCurriculum.id
        })
      });

      if (!res.ok) throw new Error("Erro ao salvar módulo.");

      showFeedback("success", "Módulo gravado com sucesso!");
      setShowModuleModal(false);
      setEditingModule(null);
      handleSelectCourseForCurriculum(selectedCourseForCurriculum);
    } catch (err) {
      showFeedback("danger", err.message);
    }
  };

  const handleDeleteModule = async (id) => {
    if (!window.confirm("Deseja realmente excluir este módulo e todas as suas aulas?")) return;
    try {
      const res = await authFetch(`${API_BASE}/admin/modules/${id}`, { method: "DELETE" });
      if (res.ok) {
        showFeedback("success", "Módulo excluído com sucesso!");
        handleSelectCourseForCurriculum(selectedCourseForCurriculum);
      }
    } catch (err) {
      showFeedback("danger", "Erro ao excluir módulo.");
    }
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!selectedCourseForCurriculum) return;
    try {
      const formData = new FormData();
      Object.keys(lessonForm).forEach((key) => {
        if (key === "attachment" && lessonForm[key] instanceof File) {
          formData.append("attachment", lessonForm[key]);
        } else if (lessonForm[key] !== null && lessonForm[key] !== undefined) {
          formData.append(key, lessonForm[key]);
        }
      });
      formData.append("course_id", selectedCourseForCurriculum.id);

      const url = editingLesson
        ? `${API_BASE}/admin/lessons/${editingLesson.id}`
        : `${API_BASE}/admin/lessons`;
      const method = editingLesson ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        body: formData
      });

      if (!res.ok) throw new Error("Erro ao salvar aula.");

      showFeedback("success", "Aula gravada com sucesso!");
      setShowLessonModal(false);
      setEditingLesson(null);
      handleSelectCourseForCurriculum(selectedCourseForCurriculum);
    } catch (err) {
      showFeedback("danger", err.message);
    }
  };

  const handleDeleteLesson = async (id) => {
    if (!window.confirm("Deseja eliminar esta aula?")) return;
    try {
      const res = await authFetch(`${API_BASE}/admin/lessons/${id}`, { method: "DELETE" });
      if (res.ok) {
        showFeedback("success", "Aula eliminada!");
        handleSelectCourseForCurriculum(selectedCourseForCurriculum);
      }
    } catch (err) {
      showFeedback("danger", "Erro ao excluir aula.");
    }
  };

  // 4. AVALIAÇÕES E QUESTÕES
  const loadExams = async () => {
    setLoadingExams(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/exams`);
      const data = await res.json();
      setExams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    try {
      const url = editingExam ? `${API_BASE}/admin/exams/${editingExam.id}` : `${API_BASE}/admin/exams`;
      const method = editingExam ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(examForm)
      });
      if (!res.ok) throw new Error("Erro ao salvar exame.");

      showFeedback("success", "Avaliação gravada com sucesso!");
      setShowExamModal(false);
      setEditingExam(null);
      loadExams();
    } catch (err) {
      showFeedback("danger", err.message);
    }
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm("Deseja excluir esta avaliação e suas questões?")) return;
    try {
      const res = await authFetch(`${API_BASE}/admin/exams/${id}`, { method: "DELETE" });
      if (res.ok) {
        showFeedback("success", "Avaliação excluída com sucesso!");
        loadExams();
      }
    } catch (err) {
      showFeedback("danger", "Erro ao excluir avaliação.");
    }
  };

  const loadQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const url = `${API_BASE}/admin/questions?roomId=${questionExamFilter}&q=${encodeURIComponent(questionSearch)}`;
      const res = await authFetch(url);
      const data = await res.json();
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    try {
      const url = editingQuestion
        ? `${API_BASE}/admin/questions/${editingQuestion.id}`
        : `${API_BASE}/admin/questions`;
      const method = editingQuestion ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionForm)
      });
      if (!res.ok) throw new Error("Erro ao salvar pergunta.");

      showFeedback("success", "Pergunta gravada com sucesso!");
      setShowQuestionModal(false);
      setEditingQuestion(null);
      loadQuestions();
    } catch (err) {
      showFeedback("danger", err.message);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Deseja eliminar esta pergunta?")) return;
    try {
      const res = await authFetch(`${API_BASE}/admin/questions/${id}`, { method: "DELETE" });
      if (res.ok) {
        showFeedback("success", "Pergunta eliminada com sucesso!");
        loadQuestions();
      }
    } catch (err) {
      showFeedback("danger", "Erro ao eliminar pergunta.");
    }
  };

  // 5. ALUNOS
  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/students?q=${encodeURIComponent(studentSearch)}`);
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    try {
      const url = editingStudent
        ? `${API_BASE}/admin/students/${editingStudent.id}`
        : `${API_BASE}/admin/students`;
      const method = editingStudent ? "PUT" : "POST";

      const formData = new FormData();
      formData.append("name", (studentForm.name || "").trim());
      formData.append("emailOrPhone", (studentForm.emailOrPhone || "").trim());
      if (studentForm.password && studentForm.password.trim()) {
        formData.append("password", studentForm.password.trim());
      }
      formData.append("phone", (studentForm.phone || "").trim());
      formData.append("bio", (studentForm.bio || "").trim());
      formData.append("status", studentForm.status || "ativo");
      formData.append("role", studentForm.role || "Estudante");
      formData.append("accountType", studentForm.accountType || "estudante");

      if (studentForm.avatarFile) {
        formData.append("avatar", studentForm.avatarFile);
      } else if (studentForm.removeAvatar) {
        formData.append("avatar", "");
      } else if (studentForm.avatar) {
        formData.append("avatar", studentForm.avatar);
      }

      const res = await authFetch(url, {
        method,
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar aluno.");

      showFeedback("success", editingStudent ? "Perfil do aluno atualizado com sucesso!" : "Aluno cadastrado com sucesso!");
      setShowStudentModal(false);
      setEditingStudent(null);
      loadStudents();
    } catch (err) {
      showFeedback("danger", err.message);
    }
  };

  const handleToggleStudentStatus = async (id, currentStatus) => {
    const next = currentStatus === "ativo" ? "bloqueado" : "ativo";
    try {
      const res = await authFetch(`${API_BASE}/admin/students/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next })
      });
      if (res.ok) {
        showFeedback("success", `Aluno ${next === "ativo" ? "desbloqueado" : "bloqueado"} com sucesso!`);
        loadStudents();
      }
    } catch (err) {
      showFeedback("danger", "Erro ao alterar status do aluno.");
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Deseja realmente eliminar o aluno "${name}"? Todas as matrículas e dados de progresso serão perdidos.`)) {
      return;
    }
    try {
      const res = await authFetch(`${API_BASE}/admin/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        showFeedback("success", "Aluno eliminado com sucesso!");
        loadStudents();
      }
    } catch (err) {
      showFeedback("danger", "Erro ao excluir aluno.");
    }
  };

  const handleOpenStudentOverview = async (studentId) => {
    try {
      const res = await authFetch(`${API_BASE}/admin/students/${studentId}/overview`);
      const data = await res.json();
      if (res.ok) {
        setStudentOverview(data);
        setShowOverviewModal(true);
      }
    } catch (err) {
      showFeedback("danger", "Erro ao carregar detalhes do aluno.");
    }
  };

  // 6. MATRÍCULAS
  const loadEnrollments = async () => {
    setLoadingEnrollments(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/enrollments?status=${enrollmentStatusFilter}&q=${encodeURIComponent(enrollmentSearch)}`);
      const data = await res.json();
      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const handleSaveEnrollment = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(`${API_BASE}/admin/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enrollmentForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao matricular aluno.");

      showFeedback("success", "Aluno matriculado com sucesso no curso!");
      setShowEnrollmentModal(false);
      loadEnrollments();
    } catch (err) {
      showFeedback("danger", err.message);
    }
  };

  const handleToggleEnrollmentStatus = async (id, currentStatus) => {
    const next = currentStatus === "ativa" ? "cancelada" : "ativa";
    try {
      const res = await authFetch(`${API_BASE}/admin/enrollments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next })
      });
      if (res.ok) {
        showFeedback("success", `Matrícula ${next === "ativa" ? "ativada" : "cancelada"}!`);
        loadEnrollments();
      }
    } catch (err) {
      showFeedback("danger", "Erro ao mudar status.");
    }
  };

  const handleDeleteEnrollment = async (id) => {
    if (!window.confirm("Deseja realmente remover esta matrícula?")) return;
    try {
      const res = await authFetch(`${API_BASE}/admin/enrollments/${id}`, { method: "DELETE" });
      if (res.ok) {
        showFeedback("success", "Matrícula removida!");
        loadEnrollments();
      }
    } catch (err) {
      showFeedback("danger", "Erro ao remover matrícula.");
    }
  };

  // 7. PROGRESSO
  const loadProgress = async () => {
    setLoadingProgress(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/progress`);
      const data = await res.json();
      setProgressData(Array.isArray(data) ? data : []);

      const resExams = await authFetch(`${API_BASE}/admin/exam-results`);
      const dataExams = await resExams.json();
      setExamResults(Array.isArray(dataExams) ? dataExams : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProgress(false);
    }
  };

  // 8. CERTIFICADOS
  const loadCertificates = async () => {
    setLoadingCertificates(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/certificates`);
      const data = await res.json();
      setCertificates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCertificates(false);
    }
  };

  const handleGenerateCertificate = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(`${API_BASE}/admin/certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(certForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao emitir certificado.");

      showFeedback("success", `Certificado emitido com sucesso! Código: ${data.code}`);
      setShowCertModal(false);
      loadCertificates();
    } catch (err) {
      showFeedback("danger", err.message);
    }
  };

  const handleDeleteCertificate = async (id) => {
    if (!window.confirm("Deseja revogar/eliminar este certificado?")) return;
    try {
      const res = await authFetch(`${API_BASE}/admin/certificates/${id}`, { method: "DELETE" });
      if (res.ok) {
        showFeedback("success", "Certificado revogado com sucesso!");
        loadCertificates();
      }
    } catch (err) {
      showFeedback("danger", "Erro ao revogar certificado.");
    }
  };

  // 9. CATEGORIAS
  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/categories`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const url = editingCategory
        ? `${API_BASE}/admin/categories/${editingCategory.id}`
        : `${API_BASE}/admin/categories`;
      const method = editingCategory ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm)
      });
      if (!res.ok) throw new Error("Erro ao salvar categoria.");

      showFeedback("success", "Categoria salva com sucesso!");
      setShowCategoryModal(false);
      setEditingCategory(null);
      loadCategories();
    } catch (err) {
      showFeedback("danger", err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Deseja eliminar esta categoria?")) return;
    try {
      const res = await authFetch(`${API_BASE}/admin/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        showFeedback("success", "Categoria eliminada!");
        loadCategories();
      }
    } catch (err) {
      showFeedback("danger", "Erro ao excluir categoria.");
    }
  };

  // 10. INSTRUTORES
  const loadInstructors = async () => {
    setLoadingInstructors(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/instructors`);
      const data = await res.json();
      setInstructors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInstructors(false);
    }
  };

  const handleSaveInstructor = async (e) => {
    e.preventDefault();
    try {
      const url = editingInstructor
        ? `${API_BASE}/admin/instructors/${editingInstructor.id}`
        : `${API_BASE}/admin/instructors`;
      const method = editingInstructor ? "PUT" : "POST";

      const formData = new FormData();
      formData.append("name", (instructorForm.name || "").trim());
      formData.append("emailOrPhone", (instructorForm.emailOrPhone || "").trim());
      if (instructorForm.password && instructorForm.password.trim()) {
        formData.append("password", instructorForm.password.trim());
      }
      formData.append("phone", (instructorForm.phone || "").trim());
      formData.append("bio", (instructorForm.bio || "").trim());

      if (instructorForm.avatarFile) {
        formData.append("avatar", instructorForm.avatarFile);
      } else if (instructorForm.removeAvatar) {
        formData.append("avatar", "");
      } else if (instructorForm.avatar) {
        formData.append("avatar", instructorForm.avatar);
      }

      const res = await authFetch(url, {
        method,
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar instrutor.");

      showFeedback("success", editingInstructor ? "Perfil do instrutor atualizado com sucesso!" : "Instrutor cadastrado com sucesso!");
      setShowInstructorModal(false);
      setEditingInstructor(null);
      loadInstructors();
    } catch (err) {
      showFeedback("danger", err.message);
    }
  };

  const handleDeleteInstructor = async (id, name) => {
    if (!window.confirm(`Tem certeza de que deseja excluir o instrutor "${name}"?`)) return;
    try {
      const res = await authFetch(`${API_BASE}/admin/instructors/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir instrutor.");
      showFeedback("success", "Instrutor excluído com sucesso!");
      loadInstructors();
    } catch (err) {
      showFeedback("danger", err.message);
    }
  };

  // 11. CONFIGURAÇÕES
  const loadSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/settings`);
      const data = await res.json();
      if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error("Erro ao atualizar configurações.");

      localStorage.setItem("platform_settings", JSON.stringify(settings));
      window.dispatchEvent(new Event("storage"));

      showFeedback("success", "Configurações da plataforma atualizadas com sucesso!");
    } catch (err) {
      showFeedback("danger", err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div style={{ backgroundColor: "#f4f6f9", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppNavbar />

      <Tab.Container activeKey={activeTab} onSelect={handleTabChange}>
        {/* Estilos dedicados do menu do topo na barra azul */}
        <style>{`
          .admin-header-nav {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
          }
          .admin-header-nav::-webkit-scrollbar {
            height: 5px;
          }
          .admin-header-nav::-webkit-scrollbar-track {
            background: transparent;
          }
          .admin-header-nav::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.25);
            border-radius: 4px;
          }
          .admin-header-nav::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.45);
          }
          .admin-header-nav .nav-link {
            color: rgba(255, 255, 255, 0.85) !important;
            background-color: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 8px;
            padding: 8px 14px;
            font-size: 13.5px;
            transition: all 0.2s ease;
            cursor: pointer;
            text-decoration: none;
          }
          .admin-header-nav .nav-link:hover {
            color: #ffffff !important;
            background-color: rgba(255, 255, 255, 0.18);
            border-color: rgba(255, 255, 255, 0.25);
          }
          .admin-header-nav .nav-link.active {
            color: #ffffff !important;
            background-color: #0d6efd !important;
            border-color: #3b82f6 !important;
            font-weight: 700;
            box-shadow: 0 2px 8px rgba(13, 110, 253, 0.4);
          }
          .admin-header-nav .nav-link.active i {
            color: #ffffff !important;
          }
          .admin-header-nav .nav-link:not(.active) i {
            color: #93c5fd !important;
          }
        `}</style>

        {/* Top Banner do Painel Admin com Menu Integrado */}
        <div style={{ backgroundColor: "#0b2265", color: "#fff", paddingTop: "18px", paddingBottom: "10px" }}>
          <Container fluid className="px-3 px-md-4 px-xl-5">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-3 border-bottom border-white border-opacity-10">
              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="badge bg-warning text-dark fw-bold text-uppercase">Painel LMS Profissional</span>
                  <span className="text-white-50 small">prepUni v2.0 • PostgreSQL</span>
                </div>
                <h3 className="fw-bold mb-0 mt-1 fs-5 fs-md-4 fs-lg-3" style={{ color: "#ffffff" }}>
                  Gestão da Plataforma de Cursos Online
                </h3>
              </div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <div
                  className="d-flex align-items-center gap-2 bg-white bg-opacity-10 px-2 py-1 rounded-pill cursor-pointer"
                  onClick={() => setShowSelfProfileModal(true)}
                  title="Clique para editar seu perfil e foto"
                  style={{ cursor: "pointer" }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid #ffc107",
                      backgroundColor: "#071746",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {adminUser?.avatar ? (
                      <img
                        src={getUploadUrl(adminUser.avatar)}
                        alt={adminUser?.name || "Instrutor"}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            adminUser?.name || "Instrutor"
                          )}&background=ffc107&color=000&size=80&bold=true`;
                        }}
                      />
                    ) : (
                      <i className={`fa ${adminUser?.role === "admin" ? "fa-shield-alt text-warning" : "fa-chalkboard-teacher text-info"}`} style={{ fontSize: "14px" }}></i>
                    )}
                  </div>
                  <span className="text-white small d-none d-sm-inline">
                    <strong>{adminUser?.name || adminUser?.username || "Perfil"}</strong>
                    <span className="badge bg-warning text-dark ms-2 text-uppercase" style={{ fontSize: "10px" }}>
                      {adminUser?.role === "admin" ? "Administrador" : "Instrutor"}
                    </span>
                  </span>
                </div>

                <Button
                  variant="warning"
                  size="sm"
                  className="text-nowrap fw-bold text-dark border-0 shadow-sm d-none d-sm-inline-flex align-items-center"
                  onClick={() => setShowSelfProfileModal(true)}
                  title="Editar dados e anexar foto ao perfil"
                >
                  <i className="fa fa-user-edit me-1"></i> Meu Perfil
                </Button>

                <Button variant="outline-light" size="sm" className="text-nowrap" onClick={() => navigate("/CoursesPage")}>
                  <i className="fa fa-external-link-alt me-1"></i> Ver Loja
                </Button>
                <Button variant="danger" size="sm" className="text-nowrap d-none d-md-inline-flex align-items-center" onClick={handleLogout}>
                  <i className="fa fa-sign-out-alt me-1"></i> Sair
                </Button>
              </div>
            </div>

            {/* Seletor Rápido de Abas para Smartphone (Mobile - Menu Suspenso de Abas) */}
            <div className="d-md-none pt-2 pb-1">
              <Form.Select
                value={activeTab}
                onChange={(e) => {
                  setActiveTab(e.target.value);
                  setSearchParams({ tab: e.target.value });
                }}
                className="bg-dark text-white border-secondary fw-semibold"
                style={{ backgroundColor: "#071746", color: "#fff" }}
              >
                <option value="dashboard">📊 Visão Geral</option>
                <option value="courses">📚 Cursos ({courses.length})</option>
                <option value="curriculum">📑 Módulos & Aulas</option>
                <option value="exams">🎯 Avaliações & Questões</option>
                <option value="students">🎓 Alunos</option>
                <option value="enrollments">💳 Matrículas</option>
                <option value="progress">📈 Progresso & Notas</option>
                <option value="certificates">📜 Certificados</option>
                <option value="categories">🏷️ Categorias</option>
                <option value="instructors">👨‍🏫 Instrutores</option>
                <option value="settings">⚙️ Configurações</option>
              </Form.Select>
            </div>

            {/* Navegação Superior de Abas na Barra Azul (Desktop & Tablet) */}
            <Nav variant="pills" className="admin-header-nav d-none d-md-flex flex-nowrap overflow-auto pt-2 pt-md-3 pb-1 gap-1 gap-md-2">
              <Nav.Item>
                <Nav.Link eventKey="dashboard" className="fw-semibold text-nowrap">
                  <i className="fa fa-tachometer-alt me-1"></i> Visão Geral
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="courses" className="fw-semibold text-nowrap">
                  <i className="fa fa-book me-1"></i> Cursos ({courses.length})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="curriculum" className="fw-semibold text-nowrap">
                  <i className="fa fa-layer-group me-1"></i> Módulos & Aulas
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="exams" className="fw-semibold text-nowrap">
                  <i className="fa fa-question-circle me-1"></i> Avaliações & Questões
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="students" className="fw-semibold text-nowrap">
                  <i className="fa fa-user-graduate me-1"></i> Alunos
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="enrollments" className="fw-semibold text-nowrap">
                  <i className="fa fa-id-card me-1"></i> Matrículas
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="progress" className="fw-semibold text-nowrap">
                  <i className="fa fa-chart-line me-1"></i> Progresso & Notas
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="certificates" className="fw-semibold text-nowrap">
                  <i className="fa fa-certificate me-1"></i> Certificados
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="categories" className="fw-semibold text-nowrap">
                  <i className="fa fa-tags me-1"></i> Categorias
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="instructors" className="fw-semibold text-nowrap">
                  <i className="fa fa-chalkboard-teacher me-1"></i> Instrutores
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="settings" className="fw-semibold text-nowrap">
                  <i className="fa fa-cog me-1"></i> Configurações
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Container>
        </div>

        <Container fluid className="py-4 flex-grow-1 px-3 px-md-4 px-xl-5">
          {/* Feedback Alert */}
          {globalMessage.text && (
            <Alert variant={globalMessage.type} dismissible onClose={() => setGlobalMessage({ type: "", text: "" })}>
              {globalMessage.text}
            </Alert>
          )}

          <Tab.Content>
            {/* ========================================================================= */}
            {/* ABA 1: DASHBOARD GERAL                                                    */}
            {/* ========================================================================= */}
            <Tab.Pane eventKey="dashboard">
              {loadingStats ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">A atualizar métricas do LMS...</p>
                </div>
              ) : dashboardStats ? (
                <div>
                  {/* KPI Cards */}
                  <Row className="g-3 mb-4">
                    <Col xs={12} sm={6} lg={3}>
                      <Card className="border-0 shadow-sm rounded-3 bg-white h-100">
                        <Card.Body className="d-flex align-items-center">
                          <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3 me-3 fs-3">
                            <i className="fa fa-book"></i>
                          </div>
                          <div>
                            <span className="text-muted small text-uppercase fw-bold">Total de Cursos</span>
                            <h3 className="fw-bold mb-0">{dashboardStats.stats.courses.total}</h3>
                            <small className="text-success fw-semibold">
                              {dashboardStats.stats.courses.publicados} publicados
                            </small>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} sm={6} lg={3}>
                      <Card className="border-0 shadow-sm rounded-3 bg-white h-100">
                        <Card.Body className="d-flex align-items-center">
                          <div className="p-3 bg-success bg-opacity-10 text-success rounded-3 me-3 fs-3">
                            <i className="fa fa-user-graduate"></i>
                          </div>
                          <div>
                            <span className="text-muted small text-uppercase fw-bold">Alunos Inscritos</span>
                            <h3 className="fw-bold mb-0">{dashboardStats.stats.users.estudantes}</h3>
                            <small className="text-muted">
                              {dashboardStats.stats.users.total} usuários no total
                            </small>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} sm={6} lg={3}>
                      <Card className="border-0 shadow-sm rounded-3 bg-white h-100">
                        <Card.Body className="d-flex align-items-center">
                          <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-3 me-3 fs-3">
                            <i className="fa fa-id-card"></i>
                          </div>
                          <div>
                            <span className="text-muted small text-uppercase fw-bold">Matrículas Ativas</span>
                            <h3 className="fw-bold mb-0">{dashboardStats.stats.enrollments.ativas}</h3>
                            <small className="text-muted">{dashboardStats.stats.enrollments.total} registradas</small>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} sm={6} lg={3}>
                      <Card className="border-0 shadow-sm rounded-3 bg-white h-100">
                        <Card.Body className="d-flex align-items-center">
                          <div className="p-3 bg-info bg-opacity-10 text-info rounded-3 me-3 fs-3">
                            <i className="fa fa-coins"></i>
                          </div>
                          <div>
                            <span className="text-muted small text-uppercase fw-bold">Receita Estimada</span>
                            <h3 className="fw-bold mb-0">
                              {dashboardStats.stats.revenue?.toLocaleString("pt-PT")} Kz
                            </h3>
                            <small className="text-muted">Cursos ativos</small>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Row className="g-3 mb-4">
                    <Col xs={6} sm={6} md={3}>
                      <Card className="border-0 shadow-sm p-3 bg-white text-center">
                        <div className="text-primary fs-4 mb-1"><i className="fa fa-video"></i></div>
                        <h4 className="fw-bold mb-0">{dashboardStats.stats.lessons.total}</h4>
                        <span className="text-muted small">Aulas & Vídeos</span>
                      </Card>
                    </Col>
                    <Col xs={6} sm={6} md={3}>
                      <Card className="border-0 shadow-sm p-3 bg-white text-center">
                        <div className="text-success fs-4 mb-1"><i className="fa fa-question-circle"></i></div>
                        <h4 className="fw-bold mb-0">{dashboardStats.stats.questions.total}</h4>
                        <span className="text-muted small">Questões no Banco</span>
                      </Card>
                    </Col>
                    <Col xs={6} sm={6} md={3}>
                      <Card className="border-0 shadow-sm p-3 bg-white text-center">
                        <div className="text-danger fs-4 mb-1"><i className="fa fa-door-open"></i></div>
                        <h4 className="fw-bold mb-0">{dashboardStats.stats.exams.total}</h4>
                        <span className="text-muted small">Salas de Exame</span>
                      </Card>
                    </Col>
                    <Col xs={6} sm={6} md={3}>
                      <Card className="border-0 shadow-sm p-3 bg-white text-center">
                        <div className="text-info fs-4 mb-1"><i className="fa fa-certificate"></i></div>
                        <h4 className="fw-bold mb-0">{dashboardStats.stats.certificates.total}</h4>
                        <span className="text-muted small">Certificados Emitidos</span>
                      </Card>
                    </Col>
                  </Row>

                  {/* Tabelas de Atividade Recente */}
                  <Row className="g-4">
                    <Col lg={6}>
                      <Card className="border-0 shadow-sm rounded-3">
                        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                          <h6 className="fw-bold mb-0 text-primary">
                            <i className="fa fa-user-plus me-2"></i> Últimos Alunos Cadastrados
                          </h6>
                          <Button variant="link" size="sm" onClick={() => handleTabChange("students")}>
                            Ver todos →
                          </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                          <Table responsive hover className="mb-0 align-middle">
                            <thead className="table-light">
                              <tr>
                                <th>Nome</th>
                                <th>Contato</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashboardStats.recentStudents?.map((s) => (
                                <tr key={s.id}>
                                  <td className="fw-semibold">{s.name}</td>
                                  <td className="text-muted small">{s.emailOrPhone}</td>
                                  <td>
                                    <Badge bg={s.status === "ativo" ? "success" : "danger"}>
                                      {s.status}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col lg={6}>
                      <Card className="border-0 shadow-sm rounded-3">
                        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                          <h6 className="fw-bold mb-0 text-success">
                            <i className="fa fa-receipt me-2"></i> Últimas Matrículas Registradas
                          </h6>
                          <Button variant="link" size="sm" onClick={() => handleTabChange("enrollments")}>
                            Ver todas →
                          </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                          <Table responsive hover className="mb-0 align-middle">
                            <thead className="table-light">
                              <tr>
                                <th>Aluno</th>
                                <th>Curso</th>
                                <th>Valor</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashboardStats.recentEnrollments?.map((m) => (
                                <tr key={m.id}>
                                  <td className="fw-semibold">{m.student_name}</td>
                                  <td className="text-muted small text-truncate" style={{ maxWidth: "160px" }}>
                                    {m.course_title}
                                  </td>
                                  <td className="small">{m.course_price} Kz</td>
                                  <td>
                                    <Badge bg={m.status === "ativa" ? "success" : "warning"}>
                                      {m.status}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </div>
              ) : null}
            </Tab.Pane>

            {/* ========================================================================= */}
            {/* ABA 2: GESTÃO DE CURSOS (CRUD COMPLETO COM STATUS E DETALHES)             */}
            {/* ========================================================================= */}
            <Tab.Pane eventKey="courses">
              <Card className="border-0 shadow-sm rounded-3">
                <Card.Header className="bg-white py-3">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h5 className="fw-bold mb-0 text-primary">
                      <i className="fa fa-book me-2"></i> Catálogo e Gestão de Cursos
                    </h5>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setEditingCourse(null);
                        setCourseForm({
                          title: "",
                          description: "",
                          price: "",
                          duration: "12 meses",
                          workload_hours: "40h",
                          level: "Todos os níveis",
                          category: "Geral",
                          subcategory: "",
                          country: "Angola",
                          status: "publicado",
                          instructor_id: "",
                          account: "",
                          iban: "",
                          express_number: "",
                          details: "",
                          support_whatsapp: "",
                          payment_whatsapp: "",
                          thumbnail: null
                        });
                        setShowCourseModal(true);
                      }}
                    >
                      <i className="fa fa-plus me-1"></i> Criar Novo Curso
                    </Button>
                  </div>

                  {/* Filtros */}
                  <Row className="mt-3 g-2">
                    <Col md={4}>
                      <InputGroup>
                        <InputGroup.Text><i className="fa fa-search"></i></InputGroup.Text>
                        <Form.Control
                          placeholder="Buscar por título ou descrição..."
                          value={courseSearch}
                          onChange={(e) => setCourseSearch(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && loadCourses(e.target.value, courseStatusFilter, courseCategoryFilter)}
                        />
                      </InputGroup>
                    </Col>
                    <Col md={3}>
                      <Form.Select
                        value={courseCategoryFilter}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCourseCategoryFilter(val);
                          loadCourses(courseSearch, courseStatusFilter, val);
                        }}
                      >
                        <option value="todas">Todas as Categorias</option>
                        <option value="Ciências da Saúde">Ciências da Saúde</option>
                        <option value="Ciências Sociais e Humanas">Ciências Sociais e Humanas</option>
                        <option value="Ciências das Engenharias">Ciências das Engenharias</option>
                        <option value="Carreiras Policiais">Carreiras Policiais</option>
                        <option value="Geral">Geral e Outros</option>
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Form.Select
                        value={courseStatusFilter}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCourseStatusFilter(val);
                          loadCourses(courseSearch, val, courseCategoryFilter);
                        }}
                      >
                        <option value="todos">Todos os Status</option>
                        <option value="publicado">Publicados</option>
                        <option value="rascunho">Rascunhos</option>
                        <option value="arquivado">Arquivados</option>
                      </Form.Select>
                    </Col>
                    <Col md={2}>
                      <Button variant="outline-primary" className="w-100" onClick={() => loadCourses(courseSearch, courseStatusFilter, courseCategoryFilter)}>
                        Filtrar
                      </Button>
                    </Col>
                  </Row>
                </Card.Header>

                <Card.Body className="p-0">
                  {loadingCourses ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  ) : courses.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="fa fa-book-open fa-3x mb-3 text-secondary"></i>
                      <p>Nenhum curso encontrado com os filtros aplicados.</p>
                    </div>
                  ) : (
                    <Table responsive hover className="mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Curso</th>
                          <th>Categoria</th>
                          <th>Preço</th>
                          <th>Módulos / Aulas</th>
                          <th>Alunos</th>
                          <th>Status</th>
                          <th className="text-end">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((c) => (
                          <tr key={c.id}>
                            <td className="fw-bold text-muted">#{c.id}</td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                {c.thumbnail ? (
                                  <img
                                    src={getUploadUrl(c.thumbnail)}
                                    alt={c.title}
                                    style={{ width: "48px", height: "36px", objectFit: "cover", borderRadius: "4px" }}
                                    onError={(e) => { e.target.style.display = "none"; }}
                                  />
                                ) : (
                                  <div style={{ width: "48px", height: "36px", background: "#e2e8f0", borderRadius: "4px" }} />
                                )}
                                <div>
                                  <div className="fw-bold">{c.title}</div>
                                  <small className="text-muted">Carga: {c.workload_hours || "40h"} • Nível: {c.level || "Geral"}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <Badge bg="light" className="text-dark border">
                                {c.category || "Geral"}
                              </Badge>
                            </td>
                            <td className="fw-semibold text-primary">{parseFloat(c.price || 0).toLocaleString("pt-PT")} Kz</td>
                            <td>
                              <span className="badge bg-secondary me-1">{c.total_modules || 0} módulos</span>
                              <span className="badge bg-info text-dark">{c.total_lessons || 0} aulas</span>
                            </td>
                            <td>
                              <span className="badge bg-success bg-opacity-25 text-success fw-bold">
                                {c.total_students || 0} matriculados
                              </span>
                            </td>
                            <td>
                              <Badge
                                bg={
                                  c.status === "publicado"
                                    ? "success"
                                    : c.status === "rascunho"
                                      ? "warning"
                                      : "secondary"
                                }
                              >
                                {c.status}
                              </Badge>
                            </td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                <Button
                                  variant="outline-info"
                                  title="Gerenciar Módulos e Aulas"
                                  onClick={() => {
                                    handleSelectCourseForCurriculum(c);
                                    handleTabChange("curriculum");
                                  }}
                                >
                                  <i className="fa fa-list"></i>
                                </Button>
                                <Button
                                  variant={c.status === "publicado" ? "outline-warning" : "outline-success"}
                                  title={c.status === "publicado" ? "Despublicar" : "Publicar"}
                                  onClick={() => handleToggleCourseStatus(c.id, c.status)}
                                >
                                  <i className={c.status === "publicado" ? "fa fa-eye-slash" : "fa fa-eye"}></i>
                                </Button>
                                <Button
                                  variant="outline-primary"
                                  title="Editar Curso"
                                  onClick={() => {
                                    setEditingCourse(c);
                                    setCourseForm({
                                      title: c.title || "",
                                      description: c.description || "",
                                      price: c.price || "",
                                      duration: c.duration || "12 meses",
                                      workload_hours: c.workload_hours || "40h",
                                      level: c.level || "Todos os níveis",
                                      category: c.category || "Geral",
                                      subcategory: c.subcategory || "",
                                      country: c.country || "Angola",
                                      status: c.status || "publicado",
                                      instructor_id: c.instructor_id || "",
                                      account: c.account || "",
                                      iban: c.iban || "",
                                      express_number: c.express_number || "",
                                      details: c.details || "",
                                      support_whatsapp: c.support_whatsapp || "",
                                      payment_whatsapp: c.payment_whatsapp || "",
                                      thumbnail: null
                                    });
                                    setShowCourseModal(true);
                                  }}
                                >
                                  <i className="fa fa-edit"></i>
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  title="Eliminar Curso"
                                  onClick={() => handleDeleteCourse(c.id, c.title)}
                                >
                                  <i className="fa fa-trash"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* ========================================================================= */}
            {/* ABA 3: MÓDULOS E VIDEOAULAS (ESTRUTURA DIDÁTICA DO CURSO)                  */}
            {/* ========================================================================= */}
            <Tab.Pane eventKey="curriculum">
              <Row className="g-3">
                {/* Seleção do Curso */}
                <Col md={4}>
                  <Card className="border-0 shadow-sm rounded-3">
                    <Card.Header className="bg-white py-3">
                      <h6 className="fw-bold mb-0 text-primary">
                        <i className="fa fa-book me-2"></i> Selecione um Curso
                      </h6>
                    </Card.Header>
                    <Card.Body className="p-2" style={{ maxHeight: "650px", overflowY: "auto" }}>
                      {courses.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCourseForCurriculum(c)}
                          className={`p-3 mb-2 rounded cursor-pointer border ${selectedCourseForCurriculum?.id === c.id
                              ? "bg-primary text-white border-primary shadow-sm"
                              : "bg-light text-dark hover-shadow"
                            }`}
                          style={{ cursor: "pointer", transition: "all 0.2s" }}
                        >
                          <div className="fw-bold">{c.title}</div>
                          <div className={`small ${selectedCourseForCurriculum?.id === c.id ? "text-white-50" : "text-muted"}`}>
                            {c.category} • {c.total_modules || 0} módulos
                          </div>
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Estrutura de Módulos e Aulas */}
                <Col md={8}>
                  {selectedCourseForCurriculum ? (
                    <Card className="border-0 shadow-sm rounded-3">
                      <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                        <div>
                          <span className="badge bg-primary text-uppercase me-2">Estrutura Didática</span>
                          <h5 className="fw-bold mb-0 mt-1">{selectedCourseForCurriculum.title}</h5>
                        </div>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => {
                            setEditingModule(null);
                            setModuleForm({
                              title: `Módulo ${curriculumModules.length + 1}: `,
                              description: "",
                              order_index: curriculumModules.length + 1
                            });
                            setShowModuleModal(true);
                          }}
                        >
                          <i className="fa fa-plus me-1"></i> Adicionar Módulo
                        </Button>
                      </Card.Header>
                      <Card.Body>
                        {loadingCurriculum ? (
                          <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                          </div>
                        ) : curriculumModules.length === 0 ? (
                          <div className="text-center py-5 text-muted">
                            <i className="fa fa-folder-open fa-3x mb-3 text-secondary"></i>
                            <p>Este curso ainda não possui módulos organizados.</p>
                            <Button
                              variant="outline-primary"
                              onClick={() => {
                                setEditingModule(null);
                                setModuleForm({ title: "Módulo 1: Introdução", description: "", order_index: 1 });
                                setShowModuleModal(true);
                              }}
                            >
                              Criar Primeiro Módulo
                            </Button>
                          </div>
                        ) : (
                          curriculumModules.map((m) => (
                            <Card key={m.id} className="mb-3 border rounded-3 overflow-hidden shadow-none">
                              <Card.Header className="bg-light d-flex justify-content-between align-items-center py-2">
                                <div>
                                  <span className="badge bg-secondary me-2">Ordem {m.order_index}</span>
                                  <strong className="text-dark">{m.title}</strong>
                                  {m.description && <span className="text-muted small ms-2">• {m.description}</span>}
                                </div>
                                <div className="btn-group btn-group-sm">
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    title="Adicionar Aula a este Módulo"
                                    onClick={() => {
                                      setEditingLesson(null);
                                      setLessonForm({
                                        module_id: m.id,
                                        title: "",
                                        description: "",
                                        content_type: "video",
                                        video_url: "",
                                        video_drive_url: "",
                                        attachment_url: "",
                                        text_content: "",
                                        duration_minutes: 30,
                                        order_index: (m.lessons?.length || 0) + 1,
                                        is_free_preview: false,
                                        attachment: null
                                      });
                                      setShowLessonModal(true);
                                    }}
                                  >
                                    <i className="fa fa-plus me-1"></i> Aula
                                  </Button>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    title="Editar Módulo"
                                    onClick={() => {
                                      setEditingModule(m);
                                      setModuleForm({
                                        title: m.title,
                                        description: m.description,
                                        order_index: m.order_index
                                      });
                                      setShowModuleModal(true);
                                    }}
                                  >
                                    <i className="fa fa-edit"></i>
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    title="Eliminar Módulo"
                                    onClick={() => handleDeleteModule(m.id)}
                                  >
                                    <i className="fa fa-trash"></i>
                                  </Button>
                                </div>
                              </Card.Header>
                              <Card.Body className="p-0">
                                {m.lessons && m.lessons.length > 0 ? (
                                  <Table responsive hover className="mb-0 align-middle">
                                    <tbody>
                                      {m.lessons.map((l) => (
                                        <tr key={l.id}>
                                          <td style={{ width: "40px" }} className="text-center text-muted">
                                            <i
                                              className={
                                                l.content_type === "video"
                                                  ? "fa fa-play-circle text-primary fs-5"
                                                  : l.content_type === "pdf"
                                                    ? "fa fa-file-pdf text-danger fs-5"
                                                    : "fa fa-file-alt text-info fs-5"
                                              }
                                            ></i>
                                          </td>
                                          <td>
                                            <div className="fw-semibold">{l.title}</div>
                                            <div className="small text-muted">
                                              {l.duration_minutes ? `${l.duration_minutes} min` : "Sem duração"} • Tipo: {l.content_type}
                                              {l.is_free_preview && (
                                                <Badge bg="success" className="ms-2">Prévia Gratuita</Badge>
                                              )}
                                            </div>
                                          </td>
                                          <td className="text-end">
                                            <div className="btn-group btn-group-sm">
                                              {l.video_url && (
                                                <Button
                                                  variant="outline-secondary"
                                                  size="sm"
                                                  title="Abrir Vídeo"
                                                  onClick={() => window.open(l.video_url, "_blank")}
                                                >
                                                  <i className="fa fa-link"></i>
                                                </Button>
                                              )}
                                              <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => {
                                                  setEditingLesson(l);
                                                  setLessonForm({
                                                    module_id: l.module_id,
                                                    title: l.title,
                                                    description: l.description,
                                                    content_type: l.content_type,
                                                    video_url: l.video_url || "",
                                                    video_drive_url: l.video_drive_url || "",
                                                    attachment_url: l.attachment_url || "",
                                                    text_content: l.text_content || "",
                                                    duration_minutes: l.duration_minutes || 0,
                                                    order_index: l.order_index || 1,
                                                    is_free_preview: l.is_free_preview || false,
                                                    attachment: null
                                                  });
                                                  setShowLessonModal(true);
                                                }}
                                              >
                                                <i className="fa fa-edit"></i>
                                              </Button>
                                              <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDeleteLesson(l.id)}
                                              >
                                                <i className="fa fa-trash"></i>
                                              </Button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                ) : (
                                  <div className="p-3 text-center text-muted small">
                                    Nenhuma aula adicionada neste módulo ainda.
                                  </div>
                                )}
                              </Card.Body>
                            </Card>
                          ))
                        )}
                      </Card.Body>
                    </Card>
                  ) : (
                    <Card className="border-0 shadow-sm rounded-3 text-center py-5">
                      <div className="py-5 text-muted">
                        <i className="fa fa-arrow-left fa-2x mb-3 text-primary"></i>
                        <h5>Selecione um curso ao lado</h5>
                        <p className="small">Clique em qualquer curso para gerenciar seus módulos, videoaulas e materiais de apoio.</p>
                      </div>
                    </Card>
                  )}
                </Col>
              </Row>
            </Tab.Pane>

            {/* ========================================================================= */}
            {/* ABA 4: AVALIAÇÕES, SIMULADOS E BANCO DE QUESTÕES                           */}
            {/* ========================================================================= */}
            <Tab.Pane eventKey="exams">
              <Row className="g-4">
                {/* Lista de Avaliações / Exames */}
                <Col lg={5}>
                  <Card className="border-0 shadow-sm rounded-3">
                    <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                      <h6 className="fw-bold mb-0 text-primary">
                        <i className="fa fa-door-open me-2"></i> Salas de Avaliação / Exame
                      </h6>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setEditingExam(null);
                          setExamForm({
                            courseId: courses[0]?.id || "",
                            roomName: "",
                            description: "",
                            time_limit_minutes: 60,
                            passing_score: 50,
                            status: "ativo"
                          });
                          setShowExamModal(true);
                        }}
                      >
                        <i className="fa fa-plus me-1"></i> Criar Sala
                      </Button>
                    </Card.Header>
                    <Card.Body className="p-0">
                      {loadingExams ? (
                        <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
                      ) : (
                        <Table responsive hover className="mb-0 align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Nome / Curso</th>
                              <th>Tempo</th>
                              <th>Questões</th>
                              <th className="text-end">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {exams.map((e) => (
                              <tr
                                key={e.id}
                                className={questionExamFilter === String(e.id) ? "table-primary" : ""}
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                  setQuestionExamFilter(String(e.id));
                                  setTimeout(loadQuestions, 50);
                                }}
                              >
                                <td>
                                  <div className="fw-bold">{e.roomName || e.roomname}</div>
                                  <small className="text-muted">{e.course_title || "Sem curso"}</small>
                                </td>
                                <td>{e.time_limit_minutes || 60}m</td>
                                <td>
                                  <Badge bg="info" className="text-dark">
                                    {e.total_questions || 0} q
                                  </Badge>
                                </td>
                                <td className="text-end" onClick={(ev) => ev.stopPropagation()}>
                                  <div className="btn-group btn-group-sm">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => {
                                        setEditingExam(e);
                                        setExamForm({
                                          courseId: e.courseId || e.courseid,
                                          roomName: e.roomName || e.roomname,
                                          description: e.description || "",
                                          time_limit_minutes: e.time_limit_minutes || 60,
                                          passing_score: e.passing_score || 50,
                                          status: e.status || "ativo"
                                        });
                                        setShowExamModal(true);
                                      }}
                                    >
                                      <i className="fa fa-edit"></i>
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => handleDeleteExam(e.id)}
                                    >
                                      <i className="fa fa-trash"></i>
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Banco de Questões */}
                <Col lg={7}>
                  <Card className="border-0 shadow-sm rounded-3">
                    <Card.Header className="bg-white py-3">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <h6 className="fw-bold mb-0 text-success">
                          <i className="fa fa-question-circle me-2"></i> Banco de Perguntas e Questões
                        </h6>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => {
                            setEditingQuestion(null);
                            setQuestionForm({
                              roomId: questionExamFilter || exams[0]?.id || "",
                              question: "",
                              correctAnswer: "",
                              wrongAnswer1: "",
                              wrongAnswer2: "",
                              wrongAnswer3: "",
                              wrongAnswer4: "",
                              tema: "",
                              disciplina: "Geral",
                              points: 10,
                              explanation: ""
                            });
                            setShowQuestionModal(true);
                          }}
                        >
                          <i className="fa fa-plus me-1"></i> Nova Questão
                        </Button>
                      </div>

                      {/* Filtros de Questões */}
                      <Row className="mt-2 g-2">
                        <Col md={7}>
                          <Form.Control
                            size="sm"
                            placeholder="Pesquisar questão, tema ou disciplina..."
                            value={questionSearch}
                            onChange={(e) => setQuestionSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && loadQuestions()}
                          />
                        </Col>
                        <Col md={5}>
                          <Form.Select
                            size="sm"
                            value={questionExamFilter}
                            onChange={(e) => {
                              setQuestionExamFilter(e.target.value);
                              setTimeout(loadQuestions, 50);
                            }}
                          >
                            <option value="">Todas as Salas de Exame</option>
                            {exams.map((ex) => (
                              <option key={ex.id} value={ex.id}>
                                {ex.roomName || ex.roomname}
                              </option>
                            ))}
                          </Form.Select>
                        </Col>
                      </Row>
                    </Card.Header>

                    <Card.Body className="p-0">
                      {loadingQuestions ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>
                      ) : questions.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                          <p>Nenhuma pergunta cadastrada para esta sala.</p>
                        </div>
                      ) : (
                        <Table responsive hover className="mb-0 align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Enunciado da Questão</th>
                              <th>Disciplina / Sala</th>
                              <th>Pontos</th>
                              <th className="text-end">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {questions.map((q) => (
                              <tr key={q.id}>
                                <td>
                                  <div className="fw-semibold text-truncate" style={{ maxWidth: "340px" }} title={q.question}>
                                    {q.question}
                                  </div>
                                  <small className="text-success fw-bold">
                                    ✓ {q.correctAnswer || q.correctanswer}
                                  </small>
                                </td>
                                <td>
                                  <Badge bg="light" className="text-dark border me-1">
                                    {q.disciplina || "Geral"}
                                  </Badge>
                                  <div className="small text-muted">{q.roomname}</div>
                                </td>
                                <td>
                                  <Badge bg="primary">{q.points || 1} pts</Badge>
                                </td>
                                <td className="text-end">
                                  <div className="btn-group btn-group-sm">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => {
                                        setEditingQuestion(q);
                                        setQuestionForm({
                                          roomId: q.roomId || q.roomid,
                                          question: q.question,
                                          correctAnswer: q.correctAnswer || q.correctanswer,
                                          wrongAnswer1: q.wrongAnswer1 || q.wronganswer1 || "",
                                          wrongAnswer2: q.wrongAnswer2 || q.wronganswer2 || "",
                                          wrongAnswer3: q.wrongAnswer3 || q.wronganswer3 || "",
                                          wrongAnswer4: q.wrongAnswer4 || q.wronganswer4 || "",
                                          tema: q.tema || "",
                                          disciplina: q.disciplina || "Geral",
                                          points: q.points || 10,
                                          explanation: q.explanation || ""
                                        });
                                        setShowQuestionModal(true);
                                      }}
                                    >
                                      <i className="fa fa-edit"></i>
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => handleDeleteQuestion(q.id)}
                                    >
                                      <i className="fa fa-trash"></i>
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab.Pane>

            {/* ========================================================================= */}
            {/* ABA 5: GESTÃO DE ALUNOS                                                   */}
            {/* ========================================================================= */}
            <Tab.Pane eventKey="students">
              <Card className="border-0 shadow-sm rounded-3">
                <Card.Header className="bg-white py-3">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h5 className="fw-bold mb-0 text-primary">
                      <i className="fa fa-user-graduate me-2"></i> Gestão de Estudantes Cadastrados
                    </h5>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setEditingStudent(null);
                        setStudentForm({
                          name: "",
                          emailOrPhone: "",
                          password: "",
                          phone: "",
                          bio: "",
                          status: "ativo",
                          role: "Estudante",
                          accountType: "estudante",
                          avatar: "",
                          avatarFile: null,
                          avatarPreview: null,
                          removeAvatar: false
                        });
                        setShowStudentModal(true);
                      }}
                    >
                      <i className="fa fa-plus me-1"></i> Cadastrar Aluno
                    </Button>
                  </div>

                  <Row className="mt-3 g-2">
                    <Col md={6}>
                      <InputGroup>
                        <InputGroup.Text><i className="fa fa-search"></i></InputGroup.Text>
                        <Form.Control
                          placeholder="Pesquisar por nome, e-mail ou telefone..."
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && loadStudents()}
                        />
                      </InputGroup>
                    </Col>
                    <Col md={3}>
                      <Button variant="outline-primary" onClick={loadStudents}>
                        Pesquisar
                      </Button>
                    </Col>
                  </Row>
                </Card.Header>

                <Card.Body className="p-0">
                  {loadingStudents ? (
                    <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                  ) : students.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <p>Nenhum aluno encontrado.</p>
                    </div>
                  ) : (
                    <Table responsive hover className="mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Nome do Aluno</th>
                          <th>E-mail / Telefone</th>
                          <th>Cursos Inscritos</th>
                          <th>Status</th>
                          <th className="text-end">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s) => (
                          <tr key={s.id}>
                            <td className="text-muted fw-bold">#{s.id}</td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    overflow: "hidden",
                                    backgroundColor: "#eef2ff",
                                    border: "1px solid #0044fc",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0
                                  }}
                                >
                                  {s.avatar ? (
                                    <img
                                      src={getUploadUrl(s.avatar)}
                                      alt={s.name}
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                      onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                          s.name || "A"
                                        )}&background=0044fc&color=fff&size=80&bold=true`;
                                      }}
                                    />
                                  ) : (
                                    <i className="fa fa-user-graduate text-primary" style={{ fontSize: "14px" }}></i>
                                  )}
                                </div>
                                <div>
                                  <div className="fw-bold">{s.name}</div>
                                  {s.phone && <small className="text-muted">{s.phone}</small>}
                                </div>
                              </div>
                            </td>
                            <td>{s.emailOrPhone}</td>
                            <td>
                              <Badge bg="primary">
                                {s.enrolled_courses || 0} cursos
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={s.status === "ativo" ? "success" : "danger"}>
                                {s.status}
                              </Badge>
                            </td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                <Button
                                  variant="outline-info"
                                  title="Ver Visão Geral e Desempenho"
                                  onClick={() => handleOpenStudentOverview(s.id)}
                                >
                                  <i className="fa fa-eye"></i>
                                </Button>
                                <Button
                                  variant={s.status === "ativo" ? "outline-warning" : "outline-success"}
                                  title={s.status === "ativo" ? "Bloquear Aluno" : "Desbloquear Aluno"}
                                  onClick={() => handleToggleStudentStatus(s.id, s.status)}
                                >
                                  <i className={s.status === "ativo" ? "fa fa-lock" : "fa fa-lock-open"}></i>
                                </Button>
                                <Button
                                  variant="outline-primary"
                                  title="Editar Aluno"
                                  onClick={() => {
                                    setEditingStudent(s);
                                    setStudentForm({
                                      name: s.name,
                                      emailOrPhone: s.emailOrPhone,
                                      password: "",
                                      phone: s.phone || "",
                                      bio: s.bio || "",
                                      status: s.status || "ativo",
                                      role: s.role || "Estudante",
                                      accountType: s.accountType || "estudante",
                                      avatar: s.avatar || "",
                                      avatarFile: null,
                                      avatarPreview: s.avatar ? getUploadUrl(s.avatar) : null,
                                      removeAvatar: false
                                    });
                                    setShowStudentModal(true);
                                  }}
                                >
                                  <i className="fa fa-edit"></i>
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  title="Eliminar Aluno"
                                  onClick={() => handleDeleteStudent(s.id, s.name)}
                                >
                                  <i className="fa fa-trash"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* ========================================================================= */}
            {/* ABA 6: GESTÃO DE MATRÍCULAS                                               */}
            {/* ========================================================================= */}
            <Tab.Pane eventKey="enrollments">
              <Card className="border-0 shadow-sm rounded-3">
                <Card.Header className="bg-white py-3">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h5 className="fw-bold mb-0 text-primary">
                      <i className="fa fa-id-card me-2"></i> Gestão de Matrículas e Inscrições
                    </h5>
                    <Button
                      variant="success"
                      onClick={() => {
                        setEnrollmentForm({
                          user_id: students[0]?.id || "",
                          curso_id: courses[0]?.id || "",
                          data_expiracao: "",
                          status: "ativa"
                        });
                        setShowEnrollmentModal(true);
                      }}
                    >
                      <i className="fa fa-user-plus me-1"></i> Nova Matrícula Manual
                    </Button>
                  </div>

                  <Row className="mt-3 g-2">
                    <Col md={6}>
                      <InputGroup>
                        <InputGroup.Text><i className="fa fa-search"></i></InputGroup.Text>
                        <Form.Control
                          placeholder="Buscar por aluno ou curso..."
                          value={enrollmentSearch}
                          onChange={(e) => setEnrollmentSearch(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && loadEnrollments()}
                        />
                      </InputGroup>
                    </Col>
                    <Col md={3}>
                      <Form.Select
                        value={enrollmentStatusFilter}
                        onChange={(e) => {
                          setEnrollmentStatusFilter(e.target.value);
                          setTimeout(loadEnrollments, 50);
                        }}
                      >
                        <option value="todos">Todos os Status</option>
                        <option value="ativa">Ativas</option>
                        <option value="pendente">Pendentes</option>
                        <option value="cancelada">Canceladas</option>
                        <option value="expirada">Expiradas</option>
                      </Form.Select>
                    </Col>
                  </Row>
                </Card.Header>

                <Card.Body className="p-0">
                  {loadingEnrollments ? (
                    <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                  ) : enrollments.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <p>Nenhuma matrícula registrada.</p>
                    </div>
                  ) : (
                    <Table responsive hover className="mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Estudante</th>
                          <th>Curso</th>
                          <th>Data Inscrição</th>
                          <th>Validade</th>
                          <th>Status</th>
                          <th className="text-end">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrollments.map((en) => (
                          <tr key={en.id}>
                            <td className="text-muted fw-bold">#{en.id}</td>
                            <td>
                              <div className="fw-bold">{en.student_name}</div>
                              <small className="text-muted">{en.student_email}</small>
                            </td>
                            <td>
                              <div className="fw-semibold">{en.course_title}</div>
                              <small className="text-primary">{en.course_price} Kz</small>
                            </td>
                            <td>{en.data_compra ? new Date(en.data_compra).toLocaleDateString("pt-PT") : "-"}</td>
                            <td>{en.data_expiracao ? new Date(en.data_expiracao).toLocaleDateString("pt-PT") : "Vitalício"}</td>
                            <td>
                              <Badge
                                bg={
                                  en.status === "ativa"
                                    ? "success"
                                    : en.status === "pendente"
                                      ? "warning"
                                      : "danger"
                                }
                              >
                                {en.status}
                              </Badge>
                            </td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                <Button
                                  variant={en.status === "ativa" ? "outline-warning" : "outline-success"}
                                  title={en.status === "ativa" ? "Suspender Matrícula" : "Ativar Matrícula"}
                                  onClick={() => handleToggleEnrollmentStatus(en.id, en.status)}
                                >
                                  <i className={en.status === "ativa" ? "fa fa-pause" : "fa fa-play"}></i>
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  title="Remover Matrícula"
                                  onClick={() => handleDeleteEnrollment(en.id)}
                                >
                                  <i className="fa fa-trash"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* ========================================================================= */}
            {/* ABA 7: PROGRESSO E NOTAS                                                  */}
            {/* ========================================================================= */}
            <Tab.Pane eventKey="progress">
              <Row className="g-4">
                <Col lg={7}>
                  <Card className="border-0 shadow-sm rounded-3">
                    <Card.Header className="bg-white py-3">
                      <h6 className="fw-bold mb-0 text-primary">
                        <i className="fa fa-tasks me-2"></i> Progresso de Conclusão por Aluno e Curso
                      </h6>
                    </Card.Header>
                    <Card.Body className="p-0">
                      {loadingProgress ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                      ) : progressData.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                          <p>Nenhum dado de progresso registrado ainda.</p>
                        </div>
                      ) : (
                        <Table responsive hover className="mb-0 align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Aluno</th>
                              <th>Curso</th>
                              <th>Aulas Concluídas</th>
                              <th>Progresso</th>
                            </tr>
                          </thead>
                          <tbody>
                            {progressData.map((p, idx) => (
                              <tr key={idx}>
                                <td>
                                  <div className="fw-bold">{p.student_name}</div>
                                  <small className="text-muted">{p.student_email}</small>
                                </td>
                                <td>{p.course_title}</td>
                                <td>
                                  <Badge bg="light" className="text-dark border">
                                    {p.completed_lessons || 0} / {p.total_lessons || 0}
                                  </Badge>
                                </td>
                                <td style={{ width: "160px" }}>
                                  <div className="d-flex align-items-center gap-2">
                                    <ProgressBar
                                      now={p.progress_percent}
                                      variant={p.progress_percent >= 70 ? "success" : "primary"}
                                      className="flex-grow-1"
                                      style={{ height: "8px" }}
                                    />
                                    <small className="fw-bold">{p.progress_percent}%</small>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={5}>
                  <Card className="border-0 shadow-sm rounded-3">
                    <Card.Header className="bg-white py-3">
                      <h6 className="fw-bold mb-0 text-success">
                        <i className="fa fa-award me-2"></i> Desempenho e Resultados em Avaliações
                      </h6>
                    </Card.Header>
                    <Card.Body className="p-0">
                      {examResults.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                          <p>Nenhuma tentativa de avaliação realizada pelos estudantes até ao momento.</p>
                        </div>
                      ) : (
                        <Table responsive hover className="mb-0 align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Aluno</th>
                              <th>Avaliação</th>
                              <th>Nota</th>
                              <th>Resultado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {examResults.map((er) => (
                              <tr key={er.id}>
                                <td>
                                  <div className="fw-semibold">{er.student_name}</div>
                                </td>
                                <td className="small">{er.exam_title}</td>
                                <td className="fw-bold">{er.score} %</td>
                                <td>
                                  <Badge bg={er.passed ? "success" : "danger"}>
                                    {er.passed ? "Aprovado" : "Reprovado"}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab.Pane>

            {/* ========================================================================= */}
            {/* ABA 8: GESTÃO DE CERTIFICADOS                                             */}
            {/* ========================================================================= */}
            <Tab.Pane eventKey="certificates">
              <Card className="border-0 shadow-sm rounded-3">
                <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0 text-primary">
                    <i className="fa fa-certificate me-2"></i> Certificados Emitidos e Validação
                  </h5>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setCertForm({
                        user_id: students[0]?.id || "",
                        course_id: courses[0]?.id || "",
                        grade: 100,
                        workload_hours: "40h"
                      });
                      setShowCertModal(true);
                    }}
                  >
                    <i className="fa fa-plus me-1"></i> Emitir Novo Certificado
                  </Button>
                </Card.Header>

                <Card.Body className="p-0">
                  {loadingCertificates ? (
                    <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                  ) : certificates.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <p>Nenhum certificado emitido até agora.</p>
                    </div>
                  ) : (
                    <Table responsive hover className="mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Código Único</th>
                          <th>Aluno</th>
                          <th>Curso Concluído</th>
                          <th>Aproveitamento</th>
                          <th>Data de Emissão</th>
                          <th className="text-end">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {certificates.map((c) => (
                          <tr key={c.id}>
                            <td>
                              <span className="badge bg-dark font-monospace">{c.code}</span>
                            </td>
                            <td className="fw-bold">{c.student_name}</td>
                            <td>{c.course_title}</td>
                            <td>
                              <Badge bg="success">{c.grade}%</Badge>
                            </td>
                            <td>{c.issued_at ? new Date(c.issued_at).toLocaleDateString("pt-PT") : "-"}</td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                <Button
                                  variant="outline-info"
                                  title="Visualizar Certificado Oficial"
                                  onClick={() => setSelectedCertForPreview(c)}
                                >
                                  <i className="fa fa-eye"></i> Visualizar
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  title="Revogar Certificado"
                                  onClick={() => handleDeleteCertificate(c.id)}
                                >
                                  <i className="fa fa-trash"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* ========================================================================= */}
            {/* ABA 9: CATEGORIAS E SUBCATEGORIAS                                         */}
            {/* ========================================================================= */}
            <Tab.Pane eventKey="categories">
              <Card className="border-0 shadow-sm rounded-3">
                <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0 text-primary">
                    <i className="fa fa-tags me-2"></i> Gestão de Categorias e Áreas de Ensino
                  </h5>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({ name: "", description: "", icon: "fa-folder" });
                      setShowCategoryModal(true);
                    }}
                  >
                    <i className="fa fa-plus me-1"></i> Nova Categoria
                  </Button>
                </Card.Header>
                <Card.Body className="p-0">
                  {loadingCategories ? (
                    <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                  ) : (
                    <Table responsive hover className="mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Nome</th>
                          <th>Slug</th>
                          <th>Descrição</th>
                          <th>Cursos Vinculados</th>
                          <th className="text-end">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((cat) => (
                          <tr key={cat.id}>
                            <td className="fw-bold">
                              <i className={`fa ${cat.icon || "fa-folder"} me-2 text-primary`}></i>
                              {cat.name}
                            </td>
                            <td><code>{cat.slug}</code></td>
                            <td className="text-muted small">{cat.description}</td>
                            <td>
                              <Badge bg="info" className="text-dark">
                                {cat.total_courses || 0} cursos
                              </Badge>
                            </td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                <Button
                                  variant="outline-primary"
                                  onClick={() => {
                                    setEditingCategory(cat);
                                    setCategoryForm({
                                      name: cat.name,
                                      description: cat.description,
                                      icon: cat.icon || "fa-folder"
                                    });
                                    setShowCategoryModal(true);
                                  }}
                                >
                                  <i className="fa fa-edit"></i>
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  onClick={() => handleDeleteCategory(cat.id)}
                                >
                                  <i className="fa fa-trash"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* ========================================================================= */}
            {/* ABA 10: INSTRUTORES                                                       */}
            {/* ========================================================================= */}
            <Tab.Pane eventKey="instructors">
              <Card className="border-0 shadow-sm rounded-3">
                <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0 text-primary">
                    <i className="fa fa-chalkboard-teacher me-2"></i> Corpo Docente e Instrutores
                  </h5>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setEditingInstructor(null);
                      setInstructorForm({
                        name: "",
                        emailOrPhone: "",
                        password: "",
                        phone: "",
                        bio: "",
                        avatar: "",
                        avatarFile: null,
                        avatarPreview: null,
                        removeAvatar: false
                      });
                      setShowInstructorModal(true);
                    }}
                  >
                    <i className="fa fa-plus me-1"></i> Cadastrar Instrutor
                  </Button>
                </Card.Header>
                <Card.Body className="p-0">
                  {loadingInstructors ? (
                    <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                  ) : instructors.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <p>Nenhum instrutor cadastrado.</p>
                    </div>
                  ) : (
                    <Table responsive hover className="mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Instrutor</th>
                          <th>Contato</th>
                          <th>Biografia / Especialidade</th>
                          <th>Cursos Atribuídos</th>
                          <th className="text-end">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {instructors.map((ins) => (
                          <tr key={ins.id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  style={{
                                    width: "38px",
                                    height: "38px",
                                    borderRadius: "50%",
                                    overflow: "hidden",
                                    backgroundColor: "#eef2ff",
                                    border: "1.5px solid #0044fc",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0
                                  }}
                                >
                                  {ins.avatar ? (
                                    <img
                                      src={getUploadUrl(ins.avatar)}
                                      alt={ins.name}
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                      onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                          ins.name || "I"
                                        )}&background=0044fc&color=fff&size=80&bold=true`;
                                      }}
                                    />
                                  ) : (
                                    <i className="fa fa-chalkboard-teacher text-primary" style={{ fontSize: "14px" }}></i>
                                  )}
                                </div>
                                <div>
                                  <div className="fw-bold">{ins.name}</div>
                                  <small className="text-muted">ID #{ins.id}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div>{ins.emailOrPhone}</div>
                              <small className="text-muted">{ins.phone}</small>
                            </td>
                            <td className="text-muted small" style={{ maxWidth: "260px" }}>{ins.bio || "Sem biografia cadastrada"}</td>
                            <td>
                              <Badge bg="primary">{ins.assigned_courses || 0} cursos</Badge>
                            </td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                <Button
                                  variant="outline-primary"
                                  title="Editar Perfil do Instrutor"
                                  onClick={() => {
                                    setEditingInstructor(ins);
                                    setInstructorForm({
                                      name: ins.name || "",
                                      emailOrPhone: ins.emailOrPhone || "",
                                      password: "",
                                      phone: ins.phone || "",
                                      bio: ins.bio || "",
                                      avatar: ins.avatar || "",
                                      avatarFile: null,
                                      avatarPreview: ins.avatar ? getUploadUrl(ins.avatar) : null,
                                      removeAvatar: false
                                    });
                                    setShowInstructorModal(true);
                                  }}
                                >
                                  <i className="fa fa-edit me-1"></i> Editar
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  title="Excluir Instrutor"
                                  onClick={() => handleDeleteInstructor(ins.id, ins.name)}
                                >
                                  <i className="fa fa-trash"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* ========================================================================= */}
            {/* ABA 11: CONFIGURAÇÕES DA PLATAFORMA                                       */}
            {/* ========================================================================= */}
            <Tab.Pane eventKey="settings">
              <Card className="border-0 shadow-sm rounded-3">
                <Card.Header className="bg-white py-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div>
                    <h5 className="fw-bold mb-1 text-primary">
                      <i className="fa fa-cog me-2"></i> Configurações da Plataforma, Contatos e Redes Sociais
                    </h5>
                    <small className="text-muted">
                      Personalize os números, links e descrições dos cards de atendimento (WhatsApp, Instagram, YouTube, Unidade Física) e regras do sistema.
                    </small>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="px-4 fw-bold shadow-sm"
                  >
                    {savingSettings ? <Spinner animation="border" size="sm" className="me-1" /> : <i className="fa fa-save me-1"></i>}
                    Salvar Alterações
                  </Button>
                </Card.Header>

                <Card.Body className="p-4">
                  {loadingSettings ? (
                    <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                  ) : (
                    <Form onSubmit={handleSaveSettings}>
                      {/* ======================================================== */}
                      {/* SEÇÃO 1: CARDS DE ATENDIMENTO & REDES SOCIAIS (CONTATO)  */}
                      {/* ======================================================== */}
                      <div className="mb-5">
                        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                          <span
                            className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                            style={{ width: "32px", height: "32px", fontSize: "15px" }}
                          >
                            <i className="fa fa-share-alt"></i>
                          </span>
                          <div>
                            <h5 className="fw-bold mb-0 text-dark">Canais de Contato e Redes Sociais (Página de Contato e Rodapé)</h5>
                            <small className="text-muted">
                              Altere os links, números e textos exibidos nos 4 cards oficiais do site.
                            </small>
                          </div>
                        </div>

                        <Row className="g-4">
                          {/* 1. WHATSAPP */}
                          <Col xs={12} lg={6}>
                            <Card className="h-100 border-success shadow-sm" style={{ borderLeftWidth: "5px" }}>
                              <Card.Header className="bg-light fw-bold text-success d-flex align-items-center gap-2">
                                <i className="fab fa-whatsapp fa-lg"></i> 1. Card WhatsApp
                              </Card.Header>
                              <Card.Body>
                                <Form.Group className="mb-3">
                                  <Form.Label className="fw-semibold small">
                                    Número do WhatsApp (com DDI e DDD) <span className="text-danger">*</span>
                                  </Form.Label>
                                  <Form.Control
                                    placeholder="Ex: 5581997570784 ou 941908927"
                                    value={settings.support_whatsapp || ""}
                                    onChange={(e) => setSettings({ ...settings, support_whatsapp: e.target.value })}
                                  />
                                  <Form.Text className="text-muted small">
                                    Utilizado para gerar o link direto <code>https://api.whatsapp.com/send?phone=...</code>
                                  </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                  <Form.Label className="fw-semibold small">Texto de Exibição do Número</Form.Label>
                                  <Form.Control
                                    placeholder="Ex: (81) 99757-0784"
                                    value={settings.whatsapp_display || ""}
                                    onChange={(e) => setSettings({ ...settings, whatsapp_display: e.target.value })}
                                  />
                                  <Form.Text className="text-muted small">
                                    Formato visual exibido em negrito no card.
                                  </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                  <Form.Label className="fw-semibold small">Mensagem Inicial Padrão</Form.Label>
                                  <Form.Control
                                    placeholder="Ex: Olá, preciso de ajuda!"
                                    value={settings.whatsapp_message || ""}
                                    onChange={(e) => setSettings({ ...settings, whatsapp_message: e.target.value })}
                                  />
                                  <Form.Text className="text-muted small">
                                    Mensagem pré-preenchida que o usuário envia ao clicar no botão.
                                  </Form.Text>
                                </Form.Group>

                                <Form.Group>
                                  <Form.Label className="fw-semibold small">Descrição / Subtítulo do Card</Form.Label>
                                  <Form.Control
                                    as="textarea"
                                    rows={2}
                                    placeholder="Atendimento rápido e suporte a dúvidas sobre cursos e matrículas."
                                    value={settings.whatsapp_description || ""}
                                    onChange={(e) => setSettings({ ...settings, whatsapp_description: e.target.value })}
                                  />
                                </Form.Group>
                              </Card.Body>
                            </Card>
                          </Col>

                          {/* 2. INSTAGRAM */}
                          <Col xs={12} lg={6}>
                            <Card className="h-100 shadow-sm" style={{ borderColor: "#e1306c", borderLeftWidth: "5px" }}>
                              <Card.Header className="bg-light fw-bold d-flex align-items-center gap-2" style={{ color: "#e1306c" }}>
                                <i className="fab fa-instagram fa-lg"></i> 2. Card Instagram
                              </Card.Header>
                              <Card.Body>
                                <Form.Group className="mb-3">
                                  <Form.Label className="fw-semibold small">
                                    Link / URL do Instagram <span className="text-danger">*</span>
                                  </Form.Label>
                                  <Form.Control
                                    placeholder="Ex: https://www.instagram.com/estoupreparadoconcursos/"
                                    value={settings.instagram_url || ""}
                                    onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                                  />
                                  <Form.Text className="text-muted small">
                                    URL completa para onde o botão "Seguir no Instagram" direciona.
                                  </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                  <Form.Label className="fw-semibold small">Nome de Usuário (@handle)</Form.Label>
                                  <Form.Control
                                    placeholder="Ex: @estoupreparadoconcursos"
                                    value={settings.instagram_handle || ""}
                                    onChange={(e) => setSettings({ ...settings, instagram_handle: e.target.value })}
                                  />
                                  <Form.Text className="text-muted small">
                                    Texto exibido em destaque no card.
                                  </Form.Text>
                                </Form.Group>

                                <Form.Group>
                                  <Form.Label className="fw-semibold small">Descrição / Subtítulo do Card</Form.Label>
                                  <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Acompanhe dicas diárias, notícias de editais e lives exclusivas."
                                    value={settings.instagram_description || ""}
                                    onChange={(e) => setSettings({ ...settings, instagram_description: e.target.value })}
                                  />
                                </Form.Group>
                              </Card.Body>
                            </Card>
                          </Col>

                          {/* 3. YOUTUBE */}
                          <Col xs={12} lg={6}>
                            <Card className="h-100 border-danger shadow-sm" style={{ borderLeftWidth: "5px" }}>
                              <Card.Header className="bg-light fw-bold text-danger d-flex align-items-center gap-2">
                                <i className="fab fa-youtube fa-lg"></i> 3. Card YouTube
                              </Card.Header>
                              <Card.Body>
                                <Form.Group className="mb-3">
                                  <Form.Label className="fw-semibold small">
                                    Link / URL do Canal do YouTube <span className="text-danger">*</span>
                                  </Form.Label>
                                  <Form.Control
                                    placeholder="Ex: https://www.youtube.com/user/isaqueljoao"
                                    value={settings.youtube_url || ""}
                                    onChange={(e) => setSettings({ ...settings, youtube_url: e.target.value })}
                                  />
                                  <Form.Text className="text-muted small">
                                    URL completa para onde o botão "Acessar Canal" direciona.
                                  </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                  <Form.Label className="fw-semibold small">Nome / Título do Canal</Form.Label>
                                  <Form.Control
                                    placeholder="Ex: Preparatório Universitário Oficial"
                                    value={settings.youtube_title || ""}
                                    onChange={(e) => setSettings({ ...settings, youtube_title: e.target.value })}
                                  />
                                  <Form.Text className="text-muted small">
                                    Nome exibido em destaque no card.
                                  </Form.Text>
                                </Form.Group>

                                <Form.Group>
                                  <Form.Label className="fw-semibold small">Descrição / Subtítulo do Card</Form.Label>
                                  <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Aulas gratuitas, correções de provas e análises de bancas."
                                    value={settings.youtube_description || ""}
                                    onChange={(e) => setSettings({ ...settings, youtube_description: e.target.value })}
                                  />
                                </Form.Group>
                              </Card.Body>
                            </Card>
                          </Col>

                          {/* 4. UNIDADE FÍSICA / LOCALIZAÇÃO */}
                          <Col xs={12} lg={6}>
                            <Card className="h-100 border-primary shadow-sm" style={{ borderLeftWidth: "5px" }}>
                              <Card.Header className="bg-light fw-bold text-primary d-flex align-items-center gap-2">
                                <i className="fa fa-map-marker-alt fa-lg"></i> 4. Card Unidade Física / Presencial
                              </Card.Header>
                              <Card.Body>
                                <Row className="g-2 mb-3">
                                  <Col md={6}>
                                    <Form.Group>
                                      <Form.Label className="fw-semibold small">Título do Card</Form.Label>
                                      <Form.Control
                                        placeholder="Ex: Unidade Física"
                                        value={settings.location_title || ""}
                                        onChange={(e) => setSettings({ ...settings, location_title: e.target.value })}
                                      />
                                    </Form.Group>
                                  </Col>
                                  <Col md={6}>
                                    <Form.Group>
                                      <Form.Label className="fw-semibold small">Texto do Endereço / Polo</Form.Label>
                                      <Form.Control
                                        placeholder="Ex: Limoeiro / Recife - PE"
                                        value={settings.location_address || ""}
                                        onChange={(e) => setSettings({ ...settings, location_address: e.target.value })}
                                      />
                                    </Form.Group>
                                  </Col>
                                </Row>

                                <Row className="g-2 mb-3">
                                  <Col md={6}>
                                    <Form.Group>
                                      <Form.Label className="fw-semibold small">Texto do Botão</Form.Label>
                                      <Form.Control
                                        placeholder="Ex: Ver Cursos Presenciais"
                                        value={settings.location_button_text || ""}
                                        onChange={(e) => setSettings({ ...settings, location_button_text: e.target.value })}
                                      />
                                    </Form.Group>
                                  </Col>
                                  <Col md={6}>
                                    <Form.Group>
                                      <Form.Label className="fw-semibold small">Link de Destino do Botão</Form.Label>
                                      <Form.Control
                                        placeholder="Ex: /CoursesPage ou link do Maps"
                                        value={settings.location_link || ""}
                                        onChange={(e) => setSettings({ ...settings, location_link: e.target.value })}
                                      />
                                    </Form.Group>
                                  </Col>
                                </Row>

                                <Form.Group>
                                  <Form.Label className="fw-semibold small">Descrição / Subtítulo do Card</Form.Label>
                                  <Form.Control
                                    as="textarea"
                                    rows={2}
                                    placeholder="Cursos e simulados presenciais no estado de Pernambuco."
                                    value={settings.location_description || ""}
                                    onChange={(e) => setSettings({ ...settings, location_description: e.target.value })}
                                  />
                                </Form.Group>
                              </Card.Body>
                            </Card>
                          </Col>

                          {/* OUTRAS REDES (FACEBOOK E TELEFONE) */}
                          <Col xs={12}>
                            <Card className="border bg-light">
                              <Card.Body className="py-3">
                                <Row className="g-3">
                                  <Col md={6}>
                                    <Form.Group>
                                      <Form.Label className="fw-semibold small">
                                        <i className="fab fa-facebook-f text-primary me-1"></i> Link do Facebook (Rodapé)
                                      </Form.Label>
                                      <Form.Control
                                        placeholder="Ex: https://www.facebook.com"
                                        value={settings.facebook_url || ""}
                                        onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                                      />
                                    </Form.Group>
                                  </Col>
                                  <Col md={6}>
                                    <Form.Group>
                                      <Form.Label className="fw-semibold small">
                                        <i className="fa fa-phone text-secondary me-1"></i> Telefone Fixo Geral (Opcional)
                                      </Form.Label>
                                      <Form.Control
                                        placeholder="Ex: +244 941 908 927"
                                        value={settings.support_phone || ""}
                                        onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                                      />
                                    </Form.Group>
                                  </Col>
                                </Row>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>

                        {/* ======================================================== */}
                        {/* PRÉ-VISUALIZAÇÃO EM TEMPO REAL DOS CARDS DE CONTATO       */}
                        {/* ======================================================== */}
                        <div className="mt-4 p-4 border rounded-3 bg-white shadow-sm">
                          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                            <span className="fw-bold text-dark d-flex align-items-center gap-2">
                              <i className="fa fa-eye text-primary"></i> Pré-visualização em Tempo Real (Página de Contato)
                            </span>
                            <Badge bg="secondary" className="px-2 py-1">Atualização Dinâmica</Badge>
                          </div>

                          <Row className="g-3 justify-content-center">
                            {/* Card WhatsApp Preview */}
                            <Col xs={12} sm={6} lg={3}>
                              <Card className="h-100 border text-center p-3 shadow-sm">
                                <div className="my-2">
                                  <div
                                    style={{
                                      width: "50px",
                                      height: "50px",
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
                                <h6 className="fw-bold mt-2">WhatsApp</h6>
                                <p className="text-muted small" style={{ fontSize: "12px", minHeight: "36px" }}>
                                  {settings.whatsapp_description || "Atendimento rápido e suporte a dúvidas sobre cursos e matrículas."}
                                </p>
                                <div className="fw-bold mb-2 text-dark small">
                                  {settings.whatsapp_display || settings.support_whatsapp || "(81) 99757-0784"}
                                </div>
                                <Button variant="success" size="sm" className="w-100 fw-bold">
                                  Chamar no WhatsApp
                                </Button>
                              </Card>
                            </Col>

                            {/* Card Instagram Preview */}
                            <Col xs={12} sm={6} lg={3}>
                              <Card className="h-100 border text-center p-3 shadow-sm">
                                <div className="my-2">
                                  <div
                                    style={{
                                      width: "50px",
                                      height: "50px",
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
                                <h6 className="fw-bold mt-2">Instagram</h6>
                                <p className="text-muted small" style={{ fontSize: "12px", minHeight: "36px" }}>
                                  {settings.instagram_description || "Acompanhe dicas diárias, notícias de editais e lives exclusivas."}
                                </p>
                                <div className="fw-bold mb-2 text-dark small">
                                  {settings.instagram_handle || "@estoupreparadoconcursos"}
                                </div>
                                <Button variant="outline-danger" size="sm" className="w-100 fw-bold">
                                  Seguir no Instagram
                                </Button>
                              </Card>
                            </Col>

                            {/* Card YouTube Preview */}
                            <Col xs={12} sm={6} lg={3}>
                              <Card className="h-100 border text-center p-3 shadow-sm">
                                <div className="my-2">
                                  <div
                                    style={{
                                      width: "50px",
                                      height: "50px",
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
                                <h6 className="fw-bold mt-2">YouTube</h6>
                                <p className="text-muted small" style={{ fontSize: "12px", minHeight: "36px" }}>
                                  {settings.youtube_description || "Aulas gratuitas, correções de provas e análises de bancas."}
                                </p>
                                <div className="fw-bold mb-2 text-dark small">
                                  {settings.youtube_title || "Preparatório Universitário Oficial"}
                                </div>
                                <Button variant="outline-danger" size="sm" className="w-100 fw-bold">
                                  Acessar Canal
                                </Button>
                              </Card>
                            </Col>

                            {/* Card Unidade Física Preview */}
                            <Col xs={12} sm={6} lg={3}>
                              <Card className="h-100 border text-center p-3 shadow-sm">
                                <div className="my-2">
                                  <div
                                    style={{
                                      width: "50px",
                                      height: "50px",
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
                                <h6 className="fw-bold mt-2">{settings.location_title || "Unidade Física"}</h6>
                                <p className="text-muted small" style={{ fontSize: "12px", minHeight: "36px" }}>
                                  {settings.location_description || "Cursos e simulados presenciais no estado de Pernambuco."}
                                </p>
                                <div className="fw-bold mb-2 text-dark small">
                                  {settings.location_address || "Limoeiro / Recife - PE"}
                                </div>
                                <Button variant="primary" size="sm" className="w-100 fw-bold">
                                  {settings.location_button_text || "Ver Cursos Presenciais"}
                                </Button>
                              </Card>
                            </Col>
                          </Row>
                        </div>
                      </div>

                      {/* ======================================================== */}
                      {/* SEÇÃO 2: DADOS GERAIS E IDENTIDADE DA PLATAFORMA          */}
                      {/* ======================================================== */}
                      <div className="mb-5">
                        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                          <span
                            className="bg-secondary text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                            style={{ width: "32px", height: "32px", fontSize: "15px" }}
                          >
                            <i className="fa fa-info-circle"></i>
                          </span>
                          <div>
                            <h5 className="fw-bold mb-0 text-dark">Identidade e Regras da Plataforma</h5>
                            <small className="text-muted">
                              Nome da instituição, e-mail administrativo, nota de certificação e cadastros.
                            </small>
                          </div>
                        </div>

                        <Row className="g-3">
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="fw-bold small">Nome da Plataforma / Instituição</Form.Label>
                              <Form.Control
                                value={settings.platform_name || ""}
                                onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                                required
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="fw-bold small">E-mail de Suporte / Contato</Form.Label>
                              <Form.Control
                                type="email"
                                value={settings.contact_email || ""}
                                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                              />
                            </Form.Group>
                          </Col>

                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="fw-bold small text-primary">
                                <i className="fa fa-heading me-1"></i> Título do Banner Principal (Home)
                              </Form.Label>
                              <Form.Control
                                placeholder="A tua aprovação é a nossa missão!"
                                value={settings.banner_title || ""}
                                onChange={(e) => setSettings({ ...settings, banner_title: e.target.value })}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="fw-bold small text-primary">
                                <i className="fa fa-paragraph me-1"></i> Subtítulo / Frase do Banner Principal
                              </Form.Label>
                              <Form.Control
                                placeholder="Junta-te à melhor academia de preparação universitária"
                                value={settings.banner_subtitle || ""}
                                onChange={(e) => setSettings({ ...settings, banner_subtitle: e.target.value })}
                              />
                            </Form.Group>
                          </Col>

                          <Col md={4}>
                            <Form.Group>
                              <Form.Label className="fw-bold small">Símbolo da Moeda</Form.Label>
                              <Form.Control
                                value={settings.currency_symbol || "Kz"}
                                onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label className="fw-bold small">Nota Mínima para Certificado (%)</Form.Label>
                              <Form.Control
                                type="number"
                                min="0"
                                max="100"
                                value={settings.certificate_min_score || 70}
                                onChange={(e) => setSettings({ ...settings, certificate_min_score: e.target.value })}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group className="d-flex align-items-center h-100 pt-3">
                              <Form.Check
                                type="switch"
                                id="allow-registration-switch"
                                label="Permitir novos cadastros de alunos"
                                checked={settings.allow_registration}
                                onChange={(e) => setSettings({ ...settings, allow_registration: e.target.checked })}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      </div>

                      {/* ======================================================== */}
                      {/* SEÇÃO 3: DADOS FINANCEIROS E PAGAMENTOS BNA              */}
                      {/* ======================================================== */}
                      <div className="mb-4">
                        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                          <span
                            className="bg-warning text-dark rounded-circle d-inline-flex align-items-center justify-content-center"
                            style={{ width: "32px", height: "32px", fontSize: "15px" }}
                          >
                            <i className="fa fa-money-bill-wave"></i>
                          </span>
                          <div>
                            <h5 className="fw-bold mb-0 text-dark">Dados Financeiros e Pagamentos BNA</h5>
                            <small className="text-muted">
                              Contas de recebimento e validação manual de pagamentos.
                            </small>
                          </div>
                        </div>

                        <Row className="g-3">
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label className="fw-bold small text-warning text-dark">
                                <i className="fab fa-whatsapp me-1 text-warning"></i> WhatsApp Financeiro / Validação
                              </Form.Label>
                              <Form.Control
                                placeholder="Ex: 941908927"
                                value={settings.payment_whatsapp || ""}
                                onChange={(e) => setSettings({ ...settings, payment_whatsapp: e.target.value })}
                              />
                              <Form.Text className="text-muted small">
                                Número para onde alunos enviam comprovantes de depósito.
                              </Form.Text>
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label className="fw-bold small">Número Express BNA</Form.Label>
                              <Form.Control
                                value={settings.bna_express || ""}
                                onChange={(e) => setSettings({ ...settings, bna_express: e.target.value })}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label className="fw-bold small">IBAN Bancário</Form.Label>
                              <Form.Control
                                value={settings.bna_iban || ""}
                                onChange={(e) => setSettings({ ...settings, bna_iban: e.target.value })}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      </div>

                      <hr className="my-4" />

                      <div className="d-flex justify-content-end gap-2">
                        <Button
                          variant="secondary"
                          type="button"
                          onClick={loadSettings}
                          disabled={savingSettings || loadingSettings}
                          className="px-4"
                        >
                          <i className="fa fa-undo me-1"></i> Cancelar / Recarregar
                        </Button>
                        <Button
                          variant="primary"
                          type="submit"
                          disabled={savingSettings}
                          className="px-5 py-2 fw-bold shadow-sm"
                        >
                          {savingSettings ? <Spinner animation="border" size="sm" className="me-1" /> : <i className="fa fa-save me-1"></i>}
                          Salvar Todas as Configurações
                        </Button>
                      </div>
                    </Form>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>
          </Tab.Content>
        </Container>
      </Tab.Container>

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR CURSO                                               */}
      {/* ========================================================================= */}
      <Modal show={showCourseModal} onHide={() => setShowCourseModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>{editingCourse ? "Editar Curso" : "Criar Novo Curso"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveCourse}>
          <Modal.Body className="p-4">
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold">Título do Curso *</Form.Label>
                  <Form.Control
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    required
                    placeholder="Ex: Preparatório Intensivo de Medicina 2027"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold">Descrição Curta</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    placeholder="Resumo dos objetivos e matérias contempladas..."
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Preço (Kz) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={courseForm.price}
                    onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Duração / Validade</Form.Label>
                  <Form.Control
                    value={courseForm.duration}
                    onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                    placeholder="Ex: 12 meses, Vitalício"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Carga Horária</Form.Label>
                  <Form.Control
                    value={courseForm.workload_hours}
                    onChange={(e) => setCourseForm({ ...courseForm, workload_hours: e.target.value })}
                    placeholder="Ex: 120h"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Categoria</Form.Label>
                  <Form.Select
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                  >
                    <option value="Ciências da Saúde">Ciências da Saúde</option>
                    <option value="Ciências Sociais e Humanas">Ciências Sociais e Humanas</option>
                    <option value="Ciências das Engenharias">Ciências das Engenharias</option>
                    <option value="Carreiras Policiais">Carreiras Policiais</option>
                    <option value="Geral">Geral e Outros</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Nível</Form.Label>
                  <Form.Select
                    value={courseForm.level}
                    onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                  >
                    <option value="Todos os níveis">Todos os níveis</option>
                    <option value="Iniciante">Iniciante</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Status do Curso</Form.Label>
                  <Form.Select
                    value={courseForm.status}
                    onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value })}
                  >
                    <option value="publicado">Publicado</option>
                    <option value="rascunho">Rascunho</option>
                    <option value="arquivado">Arquivado</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold">Imagem de Capa (Thumbnail)</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCourseForm({ ...courseForm, thumbnail: e.target.files[0] })}
                  />
                  <small className="text-muted">Selecione uma imagem representativa para a vitrine do curso.</small>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">WhatsApp de Apoio Pedagógico</Form.Label>
                  <Form.Control
                    value={courseForm.support_whatsapp}
                    onChange={(e) => setCourseForm({ ...courseForm, support_whatsapp: e.target.value })}
                    placeholder="Número ou link"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">WhatsApp Financeiro do Curso</Form.Label>
                  <Form.Control
                    value={courseForm.payment_whatsapp}
                    onChange={(e) => setCourseForm({ ...courseForm, payment_whatsapp: e.target.value })}
                    placeholder="Número ou link"
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold">Detalhes Didáticos / Conteúdo Programático</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={courseForm.details}
                    onChange={(e) => setCourseForm({ ...courseForm, details: e.target.value })}
                    placeholder="Metodologia, diferenciais, corpo docente..."
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCourseModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingCourse ? "Salvar Alterações" : "Criar Curso"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: MÓDULO                                                             */}
      {/* ========================================================================= */}
      <Modal show={showModuleModal} onHide={() => setShowModuleModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingModule ? "Editar Módulo" : "Novo Módulo Didático"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveModule}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Título do Módulo *</Form.Label>
              <Form.Control
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                required
                placeholder="Ex: Módulo 1: Introdução"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Descrição</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                placeholder="Breve resumo deste módulo..."
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Ordem de Exibição</Form.Label>
              <Form.Control
                type="number"
                value={moduleForm.order_index}
                onChange={(e) => setModuleForm({ ...moduleForm, order_index: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModuleModal(false)}>Cancelar</Button>
            <Button variant="primary" type="submit">Salvar Módulo</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: AULA / VÍDEO / MATERIAL DIDÁTICO                                  */}
      {/* ========================================================================= */}
      <Modal show={showLessonModal} onHide={() => setShowLessonModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingLesson ? "Editar Aula / Conteúdo" : "Adicionar Aula / Recurso Didático"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveLesson}>
          <Modal.Body className="p-4">
            <Row className="g-3">
              <Col md={8}>
                <Form.Group>
                  <Form.Label className="fw-bold">Título da Aula *</Form.Label>
                  <Form.Control
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    required
                    placeholder="Ex: Aula 1: Membrana Plasmática e Permeabilidade"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Tipo de Conteúdo</Form.Label>
                  <Form.Select
                    value={lessonForm.content_type}
                    onChange={(e) => setLessonForm({ ...lessonForm, content_type: e.target.value })}
                  >
                    <option value="video">Vídeo (YouTube / Vimeo / Drive)</option>
                    <option value="pdf">Documento PDF / Apostila</option>
                    <option value="text">Texto / Artigo Didático</option>
                    <option value="link">Link Externo</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold">URL do Vídeo (YouTube, Vimeo ou Drive)</Form.Label>
                  <Form.Control
                    value={lessonForm.video_url}
                    onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=... ou Vimeo"
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold">Anexo / Material de Apoio (PDF, Documento)</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={(e) => setLessonForm({ ...lessonForm, attachment: e.target.files[0] })}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Duração (minutos)</Form.Label>
                  <Form.Control
                    type="number"
                    value={lessonForm.duration_minutes}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Ordem</Form.Label>
                  <Form.Control
                    type="number"
                    value={lessonForm.order_index}
                    onChange={(e) => setLessonForm({ ...lessonForm, order_index: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4} className="d-flex align-items-center">
                <Form.Check
                  type="checkbox"
                  id="preview-check"
                  label="Prévia Gratuita (liberado sem compra)"
                  checked={lessonForm.is_free_preview}
                  onChange={(e) => setLessonForm({ ...lessonForm, is_free_preview: e.target.checked })}
                />
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold">Descrição da Aula / Conteúdo Textual</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={lessonForm.description || lessonForm.text_content}
                    onChange={(e) =>
                      setLessonForm({
                        ...lessonForm,
                        description: e.target.value,
                        text_content: e.target.value
                      })
                    }
                    placeholder="Explicação dos pontos abordados nesta aula..."
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowLessonModal(false)}>Cancelar</Button>
            <Button variant="primary" type="submit">Salvar Aula</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: SALA DE EXAME / AVALIAÇÃO                                         */}
      {/* ========================================================================= */}
      <Modal show={showExamModal} onHide={() => setShowExamModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingExam ? "Editar Avaliação" : "Criar Sala de Avaliação / Exame"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveExam}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Curso Vinculado *</Form.Label>
              <Form.Select
                value={examForm.courseId}
                onChange={(e) => setExamForm({ ...examForm, courseId: e.target.value })}
                required
              >
                <option value="">Selecione um curso</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Nome da Sala / Avaliação *</Form.Label>
              <Form.Control
                value={examForm.roomName}
                onChange={(e) => setExamForm({ ...examForm, roomName: e.target.value })}
                required
                placeholder="Ex: Simulado Geral de Admissão - Fase 1"
              />
            </Form.Group>
            <Row className="g-2 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Tempo Limite (minutos)</Form.Label>
                  <Form.Control
                    type="number"
                    value={examForm.time_limit_minutes}
                    onChange={(e) => setExamForm({ ...examForm, time_limit_minutes: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Nota de Aprovação (%)</Form.Label>
                  <Form.Control
                    type="number"
                    value={examForm.passing_score}
                    onChange={(e) => setExamForm({ ...examForm, passing_score: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Instruções aos Alunos</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={examForm.description}
                onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowExamModal(false)}>Cancelar</Button>
            <Button variant="primary" type="submit">Salvar Avaliação</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: QUESTÃO / PERGUNTA                                                 */}
      {/* ========================================================================= */}
      <Modal show={showQuestionModal} onHide={() => setShowQuestionModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingQuestion ? "Editar Pergunta" : "Cadastrar Nova Pergunta"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveQuestion}>
          <Modal.Body className="p-4">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Sala / Exame *</Form.Label>
                  <Form.Select
                    value={questionForm.roomId}
                    onChange={(e) => setQuestionForm({ ...questionForm, roomId: e.target.value })}
                    required
                  >
                    <option value="">Selecione a sala de exame</option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.roomName || ex.roomname}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-bold">Disciplina</Form.Label>
                  <Form.Control
                    value={questionForm.disciplina}
                    onChange={(e) => setQuestionForm({ ...questionForm, disciplina: e.target.value })}
                    placeholder="Ex: Biologia"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-bold">Pontuação</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.5"
                    value={questionForm.points}
                    onChange={(e) => setQuestionForm({ ...questionForm, points: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold">Enunciado da Questão *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={questionForm.question}
                    onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                    required
                    placeholder="Escreva claramente a pergunta do simulado..."
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold text-success">
                    <i className="fa fa-check-circle me-1"></i> Alternativa Correta (Gabarito) *
                  </Form.Label>
                  <Form.Control
                    value={questionForm.correctAnswer}
                    onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                    required
                    placeholder="Resposta correta"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-danger small fw-bold">Alternativa Incorreta 1 *</Form.Label>
                  <Form.Control
                    value={questionForm.wrongAnswer1}
                    onChange={(e) => setQuestionForm({ ...questionForm, wrongAnswer1: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-danger small fw-bold">Alternativa Incorreta 2 *</Form.Label>
                  <Form.Control
                    value={questionForm.wrongAnswer2}
                    onChange={(e) => setQuestionForm({ ...questionForm, wrongAnswer2: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-danger small">Alternativa Incorreta 3 (Opcional)</Form.Label>
                  <Form.Control
                    value={questionForm.wrongAnswer3}
                    onChange={(e) => setQuestionForm({ ...questionForm, wrongAnswer3: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-danger small">Alternativa Incorreta 4 (Opcional)</Form.Label>
                  <Form.Control
                    value={questionForm.wrongAnswer4}
                    onChange={(e) => setQuestionForm({ ...questionForm, wrongAnswer4: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold text-muted">Comentário / Explicação da Resposta</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={questionForm.explanation}
                    onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                    placeholder="Explique o motivo do gabarito para orientar o estudante..."
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowQuestionModal(false)}>Cancelar</Button>
            <Button variant="primary" type="submit">Salvar Pergunta</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ALUNO                                                              */}
      {/* ========================================================================= */}
      <Modal show={showStudentModal} onHide={() => setShowStudentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingStudent ? "Editar Perfil do Aluno" : "Cadastrar Novo Aluno"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveStudent}>
          <Modal.Body>
            {/* Seção de Foto do Aluno */}
            <div className="d-flex flex-column align-items-center mb-3">
              <div
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid #0044fc",
                  backgroundColor: "#eef2ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "8px"
                }}
              >
                {studentForm.avatarPreview ? (
                  <img
                    src={studentForm.avatarPreview}
                    alt="Foto do Aluno"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        studentForm.name || "A"
                      )}&background=0044fc&color=fff&size=120&bold=true`;
                    }}
                  />
                ) : (
                  <i className="fa fa-user-graduate text-primary fs-2"></i>
                )}
              </div>
              <div className="d-flex gap-2">
                <Form.Label className="btn btn-sm btn-outline-primary mb-0 cursor-pointer">
                  <i className="fa fa-upload me-1"></i> Inserir / Trocar Foto
                  <Form.Control
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setStudentForm({
                          ...studentForm,
                          avatarFile: file,
                          avatarPreview: URL.createObjectURL(file),
                          removeAvatar: false
                        });
                      }
                    }}
                  />
                </Form.Label>
                {studentForm.avatarPreview && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => {
                      setStudentForm({
                        ...studentForm,
                        avatar: "",
                        avatarFile: null,
                        avatarPreview: null,
                        removeAvatar: true
                      });
                    }}
                    title="Remover foto"
                  >
                    <i className="fa fa-trash"></i>
                  </Button>
                )}
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Nome Completo *</Form.Label>
              <Form.Control
                value={studentForm.name}
                onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                required
                placeholder="Ex: Carlos Silva"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">E-mail ou Telefone de Acesso *</Form.Label>
              <Form.Control
                value={studentForm.emailOrPhone}
                onChange={(e) => setStudentForm({ ...studentForm, emailOrPhone: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{editingStudent ? "Nova Senha (deixe em branco para manter)" : "Senha *"}</Form.Label>
              <Form.Control
                type="password"
                value={studentForm.password}
                onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                required={!editingStudent}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Telefone WhatsApp</Form.Label>
              <Form.Control
                value={studentForm.phone}
                onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Biografia / Observações</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={studentForm.bio}
                onChange={(e) => setStudentForm({ ...studentForm, bio: e.target.value })}
                placeholder="Observações do perfil do aluno..."
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Status da Conta</Form.Label>
              <Form.Select
                value={studentForm.status}
                onChange={(e) => setStudentForm({ ...studentForm, status: e.target.value })}
              >
                <option value="ativo">Ativo</option>
                <option value="bloqueado">Bloqueado</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowStudentModal(false)}>Cancelar</Button>
            <Button variant="primary" type="submit">
              {editingStudent ? "Salvar Alterações" : "Cadastrar Aluno"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DETALHES COMPLETOS DO ALUNO (OVERVIEW)                            */}
      {/* ========================================================================= */}
      <Modal show={showOverviewModal} onHide={() => setShowOverviewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            <i className="fa fa-user-graduate me-2 text-primary"></i>
            Perfil e Desempenho: {studentOverview?.student?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {studentOverview && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
                <div>
                  <strong>{studentOverview.student.emailOrPhone}</strong> • {studentOverview.student.phone || "Sem telefone"}
                </div>
                <Badge bg={studentOverview.student.status === "ativo" ? "success" : "danger"}>
                  {studentOverview.student.status}
                </Badge>
              </div>

              <h6 className="fw-bold text-primary mt-4 mb-2">Cursos Matriculados</h6>
              {studentOverview.courses?.length > 0 ? (
                <Table responsive bordered size="sm">
                  <thead className="table-light">
                    <tr>
                      <th>Curso</th>
                      <th>Data Matrícula</th>
                      <th>Progresso</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentOverview.courses.map((c) => (
                      <tr key={c.enrollment_id}>
                        <td className="fw-semibold">{c.course_title}</td>
                        <td>{new Date(c.data_compra).toLocaleDateString("pt-PT")}</td>
                        <td>{c.progress || 0}%</td>
                        <td><Badge bg="success">{c.enrollment_status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted small">Nenhum curso matriculado.</p>
              )}

              <h6 className="fw-bold text-success mt-4 mb-2">Resultados de Avaliações</h6>
              {studentOverview.examResults?.length > 0 ? (
                <Table responsive bordered size="sm">
                  <thead className="table-light">
                    <tr>
                      <th>Avaliação</th>
                      <th>Nota</th>
                      <th>Acertos</th>
                      <th>Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentOverview.examResults.map((er) => (
                      <tr key={er.id}>
                        <td>{er.roomname}</td>
                        <td className="fw-bold">{er.score}%</td>
                        <td>{er.correct_answers} / {er.total_questions}</td>
                        <td><Badge bg={er.passed ? "success" : "danger"}>{er.passed ? "Aprovado" : "Reprovado"}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted small">Nenhum exame realizado.</p>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOverviewModal(false)}>Fechar</Button>
        </Modal.Footer>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: NOVA MATRÍCULA MANUAL                                              */}
      {/* ========================================================================= */}
      <Modal show={showEnrollmentModal} onHide={() => setShowEnrollmentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Matricular Aluno Manualmente</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveEnrollment}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Estudante *</Form.Label>
              <Form.Select
                value={enrollmentForm.user_id}
                onChange={(e) => setEnrollmentForm({ ...enrollmentForm, user_id: e.target.value })}
                required
              >
                <option value="">Selecione um aluno</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.emailOrPhone})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Curso *</Form.Label>
              <Form.Select
                value={enrollmentForm.curso_id}
                onChange={(e) => setEnrollmentForm({ ...enrollmentForm, curso_id: e.target.value })}
                required
              >
                <option value="">Selecione um curso</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.price} Kz)
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Data de Expiração (Opcional)</Form.Label>
              <Form.Control
                type="date"
                value={enrollmentForm.data_expiracao}
                onChange={(e) => setEnrollmentForm({ ...enrollmentForm, data_expiracao: e.target.value })}
              />
              <small className="text-muted">Deixe em branco para acesso sem prazo limite.</small>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Status da Matrícula</Form.Label>
              <Form.Select
                value={enrollmentForm.status}
                onChange={(e) => setEnrollmentForm({ ...enrollmentForm, status: e.target.value })}
              >
                <option value="ativa">Ativa (Acesso Liberado Imediato)</option>
                <option value="pendente">Pendente (Aguardando Pagamento)</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEnrollmentModal(false)}>Cancelar</Button>
            <Button variant="success" type="submit">Confirmar Matrícula</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: EMITIR CERTIFICADO                                                 */}
      {/* ========================================================================= */}
      <Modal show={showCertModal} onHide={() => setShowCertModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Emitir Certificado de Conclusão</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleGenerateCertificate}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Aluno Concluinte *</Form.Label>
              <Form.Select
                value={certForm.user_id}
                onChange={(e) => setCertForm({ ...certForm, user_id: e.target.value })}
                required
              >
                <option value="">Selecione o aluno</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>{st.name} ({st.emailOrPhone})</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Curso Concluído *</Form.Label>
              <Form.Select
                value={certForm.course_id}
                onChange={(e) => setCertForm({ ...certForm, course_id: e.target.value })}
                required
              >
                <option value="">Selecione o curso</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Row className="g-2 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Nota / Aproveitamento (%)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="100"
                    value={certForm.grade}
                    onChange={(e) => setCertForm({ ...certForm, grade: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Carga Horária</Form.Label>
                  <Form.Control
                    value={certForm.workload_hours}
                    onChange={(e) => setCertForm({ ...certForm, workload_hours: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCertModal(false)}>Cancelar</Button>
            <Button variant="primary" type="submit">Emitir Certificado</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: VISUALIZAÇÃO DE CERTIFICADO COM IMPRESSÃO                          */}
      {/* ========================================================================= */}
      <Modal show={!!selectedCertForPreview} onHide={() => setSelectedCertForPreview(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Certificado Oficial de Conclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 bg-light text-center">
          {selectedCertForPreview && (
            <div
              className="bg-white p-5 border shadow-sm mx-auto position-relative"
              style={{
                maxWidth: "700px",
                border: "8px double #0b2265 !important",
                borderRadius: "8px",
                fontFamily: "'Georgia', serif"
              }}
            >
              <div className="mb-4">
                <h1 className="fw-bold text-uppercase" style={{ color: "#0b2265", letterSpacing: "2px" }}>
                  Certificado
                </h1>
                <p className="text-muted text-uppercase small" style={{ letterSpacing: "1px" }}>
                  prepUni • Preparatórios Universitários e Concursos
                </p>
              </div>

              <p className="lead mb-4">Certificamos com distinção que</p>
              <h2 className="fw-bold text-primary mb-3" style={{ borderBottom: "2px solid #ddd", paddingBottom: "8px" }}>
                {selectedCertForPreview.student_name}
              </h2>
              <p className="mb-4" style={{ fontSize: "1.1rem" }}>
                concluiu com êxito todas as etapas e avaliações do curso
                <br />
                <strong>"{selectedCertForPreview.course_title}"</strong>,
                <br />
                com carga horária total de <strong>{selectedCertForPreview.workload_hours || "40h"}</strong> e
                aproveitamento de <strong>{selectedCertForPreview.grade}%</strong>.
              </p>

              <div className="d-flex justify-content-between align-items-end mt-5 pt-4 border-top">
                <div className="text-start">
                  <small className="text-muted d-block">Autenticação Digital:</small>
                  <code className="fw-bold fs-6">{selectedCertForPreview.code}</code>
                  <div className="text-muted small">Data: {new Date(selectedCertForPreview.issued_at).toLocaleDateString("pt-PT")}</div>
                </div>
                <div className="text-end">
                  <div style={{ width: "200px", borderBottom: "1px solid #333", margin: "0 0 5px auto" }} />
                  <small className="fw-bold d-block">Diretoria Pedagógica</small>
                  <small className="text-muted">prepUni Angola</small>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => window.print()}>
            <i className="fa fa-print me-1"></i> Imprimir
          </Button>
          <Button variant="secondary" onClick={() => setSelectedCertForPreview(null)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: CATEGORIA                                                          */}
      {/* ========================================================================= */}
      <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveCategory}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Nome da Categoria *</Form.Label>
              <Form.Control
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
                placeholder="Ex: Carreiras Policiais"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Descrição</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>Cancelar</Button>
            <Button variant="primary" type="submit">Salvar Categoria</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: INSTRUTOR                                                          */}
      {/* ========================================================================= */}
      <Modal show={showInstructorModal} onHide={() => setShowInstructorModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingInstructor ? "Editar Perfil do Instrutor" : "Cadastrar Instrutor / Professor"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveInstructor}>
          <Modal.Body>
            {/* Foto de Perfil do Instrutor */}
            <div className="d-flex flex-column align-items-center mb-3">
              <div
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid #0044fc",
                  backgroundColor: "#eef2ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "8px"
                }}
              >
                {instructorForm.avatarPreview ? (
                  <img
                    src={instructorForm.avatarPreview}
                    alt="Foto do Instrutor"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        instructorForm.name || "I"
                      )}&background=0044fc&color=fff&size=120&bold=true`;
                    }}
                  />
                ) : (
                  <i className="fa fa-chalkboard-teacher text-primary fs-2"></i>
                )}
              </div>
              <div className="d-flex gap-2">
                <Form.Label className="btn btn-sm btn-outline-primary mb-0 cursor-pointer">
                  <i className="fa fa-upload me-1"></i> Inserir / Anexar Foto
                  <Form.Control
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setInstructorForm({
                          ...instructorForm,
                          avatarFile: file,
                          avatarPreview: URL.createObjectURL(file),
                          removeAvatar: false
                        });
                      }
                    }}
                  />
                </Form.Label>
                {instructorForm.avatarPreview && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => {
                      setInstructorForm({
                        ...instructorForm,
                        avatar: "",
                        avatarFile: null,
                        avatarPreview: null,
                        removeAvatar: true
                      });
                    }}
                    title="Remover foto"
                  >
                    <i className="fa fa-trash"></i>
                  </Button>
                )}
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Nome do Instrutor *</Form.Label>
              <Form.Control
                value={instructorForm.name}
                onChange={(e) => setInstructorForm({ ...instructorForm, name: e.target.value })}
                required
                placeholder="Ex: Prof. Dr. Silva"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">E-mail ou Telefone de Acesso *</Form.Label>
              <Form.Control
                type="text"
                value={instructorForm.emailOrPhone}
                onChange={(e) => setInstructorForm({ ...instructorForm, emailOrPhone: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">
                {editingInstructor ? "Nova Senha (opcional - deixe em branco para manter)" : "Senha Inicial *"}
              </Form.Label>
              <Form.Control
                type="password"
                value={instructorForm.password}
                onChange={(e) => setInstructorForm({ ...instructorForm, password: e.target.value })}
                required={!editingInstructor}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Telefone</Form.Label>
              <Form.Control
                value={instructorForm.phone}
                onChange={(e) => setInstructorForm({ ...instructorForm, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Biografia / Titulação</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={instructorForm.bio}
                onChange={(e) => setInstructorForm({ ...instructorForm, bio: e.target.value })}
                placeholder="Ex: Mestre em Ciências, especialista em vestibulares..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowInstructorModal(false)}>Cancelar</Button>
            <Button variant="primary" type="submit">
              {editingInstructor ? "Salvar Alterações" : "Cadastrar Instrutor"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: MEU PERFIL (ADMIN / INSTRUTOR ATIVO)                                */}
      {/* ========================================================================= */}
      <UserProfileModal
        show={showSelfProfileModal}
        onHide={() => setShowSelfProfileModal(false)}
        user={adminUser}
        onProfileUpdated={(updated) => {
          setAdminUser((prev) => ({ ...prev, ...updated }));
          try {
            const saved = JSON.parse(localStorage.getItem("adminUser") || "{}");
            localStorage.setItem("adminUser", JSON.stringify({ ...saved, ...updated }));
          } catch (e) {}
        }}
      />

      <AppFooter />
    </div>
  );
}
