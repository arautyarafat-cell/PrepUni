// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import "bootstrap-icons/font/bootstrap-icons.css";

// Contextos e rotas protegidas
import ProtectedRoute from './components/ProtectedRoute';       // estudantes/preparatório
import ProtectedRoute1 from './components/ProtectedRoute1';   // administradores
import AdminGateway from './components/AdminGateway';          // Gateway inteligente /admin
import { AuthProvider } from './context/AuthContext';           // estudantes/preparatório
import { AdminAuthProvider } from './context/AuthContext1';    // administradores
import { SettingsProvider } from './context/SettingsContext';  // configurações da plataforma

// Páginas públicas
import HomePage from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLogin from './pages/AdminLogin';
import Contato from './pages/Contato';
import Sobre from './pages/Sobre';
import RecuperarSenha from './pages/RecuperarSenha';
import SenhaEsquecida from './pages/SenhaEsquecida';
import Mentoria from './pages/Mentoria';

// Páginas de estudante/preparatório (LMS)
import PortalPage from './pages/PortalPage';
import ChangePage from './pages/ChangePage';
import ExamPage from './pages/ExamPage';
import MTcomplementarPage from './pages/MTcomplementarPage';
import ConfigPage from './pages/ConfigPage';
import Banco from './pages/Banco';

// Páginas de administrador
import AdminDashboard from "./pages/AdminDashboard";
import DestacarCurso from "./pages/DestacarCurso";
import ValidarCompra from "./pages/ValidarCompra";
import GerenciarUsuarios from "./pages/GerenciarUsuarios";
import GerenciarCurso from "./pages/GerenciarCurso";
import ExamQuestions from './pages/ExamQuestions';
import CourseContacts from './pages/CourseContacts';
import ExamClasses from './pages/ExamClasses';

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <SettingsProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
            {/* Gateway inteligente de redirecionamento */}
            <Route path="/admin" element={<AdminGateway />} />
            <Route path="/app" element={<AdminGateway />} />
            <Route path="/dashboard" element={<AdminGateway />} />

            {/* Rotas públicas */}
            <Route path="/" element={<HomePage />} />
            <Route path="/CoursesPage" element={<CoursesPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/RegisterPage" element={<RegisterPage />} />
            <Route path="/AdminLogin" element={<AdminLogin />} />
            <Route path="/Contato" element={<Contato />} />
            <Route path="/Sobre" element={<Sobre />} />
            <Route path="/RecuperarSenha" element={<RecuperarSenha />} />
            <Route path="/Mentoria" element={<Mentoria />} />

            {/* Dashboard administrativo protegido */}
            <Route
              path="/AdminDashboard"
              element={
                <ProtectedRoute1>
                  <AdminDashboard />
                </ProtectedRoute1>
              }
            />

            {/* Rotas protegidas para estudantes (LMS) */}
            <Route
              path="/PortalPage"
              element={
                <ProtectedRoute allowedRoles={['estudante']}>
                  <PortalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Banco"
              element={
                <ProtectedRoute allowedRoles={['estudante']}>
                  <Banco />
                </ProtectedRoute>
              }
            />
            <Route
              path="/MTcomplementarPage"
              element={
                <ProtectedRoute allowedRoles={['estudante']}>
                  <MTcomplementarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ChangePage"
              element={
                <ProtectedRoute allowedRoles={['estudante']}>
                  <ChangePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ExamPage"
              element={
                <ProtectedRoute allowedRoles={['estudante', 'aluno']}>
                  <ExamPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ExamPage/:id"
              element={
                <ProtectedRoute allowedRoles={['estudante', 'aluno']}>
                  <ExamPage />
                </ProtectedRoute>
              }
            />

            {/* Rota protegida para preparatório */}
            <Route
              path="/config"
              element={
                <ProtectedRoute allowedRoles={['preparatorio']}>
                  <ConfigPage />
                </ProtectedRoute>
              }
            />

            {/* Rotas administrativas auxiliares protegidas */}
            <Route
              path="/DestacarCurso"
              element={
                <ProtectedRoute1>
                  <DestacarCurso />
                </ProtectedRoute1>
              }
            />
            <Route
              path="/ExamQuestions"
              element={
                <ProtectedRoute1>
                  <ExamQuestions />
                </ProtectedRoute1>
              }
            />
            <Route
              path="/CourseContacts"
              element={
                <ProtectedRoute1>
                  <CourseContacts />
                </ProtectedRoute1>
              }
            />
            <Route
              path="/ExamClasses"
              element={
                <ProtectedRoute1>
                  <ExamClasses />
                </ProtectedRoute1>
              }
            />
            <Route
              path="/SenhaEsquecida"
              element={
                <ProtectedRoute1>
                  <SenhaEsquecida />
                </ProtectedRoute1>
              }
            />
            <Route
              path="/ValidarCompra"
              element={
                <ProtectedRoute1>
                  <ValidarCompra />
                </ProtectedRoute1>
              }
            />
            <Route
              path="/GerenciarCurso"
              element={
                <ProtectedRoute1>
                  <GerenciarCurso />
                </ProtectedRoute1>
              }
            />
            <Route
              path="/GerenciarUsuarios"
              element={
                <ProtectedRoute1>
                  <GerenciarUsuarios />
                </ProtectedRoute1>
              }
            />

            {/* Página de acesso não autorizado */}
            <Route
              path="/unauthorized"
              element={
                <div className="container py-5 text-center">
                  <h2 className="text-danger fw-bold">Acesso Não Autorizado</h2>
                  <p className="text-muted">Você não possui permissões suficientes para aceder a esta área da plataforma.</p>
                  <a href="/" className="btn btn-primary mt-3">Voltar à Página Inicial</a>
                </div>
              }
            />

            {/* Fallback de rotas desconhecidas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        </SettingsProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;
