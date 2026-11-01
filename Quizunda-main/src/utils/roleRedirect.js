// src/utils/roleRedirect.js

/**
 * Retorna a rota principal de destino correspondente ao papel (role) do utilizador.
 * @param {string} role - Papel do utilizador (ex: 'admin', 'estudante', 'preparatorio', 'instrutor')
 * @returns {string} - Caminho de rota correspondente
 */
export function getRedirectPathForRole(role) {
  const normalized = (role || "").toLowerCase().trim();
  if (normalized === "admin" || normalized === "instrutor" || normalized === "instructor" || normalized === "professor") {
    return "/AdminDashboard";
  }
  if (normalized === "preparatorio") {
    return "/config";
  }
  // Alunos e demais utilizadores são direcionados para o LMS (PortalPage)
  return "/PortalPage";
}

/**
 * Verifica se um utilizador possui privilégios de administrador ou instrutor.
 * @param {object|null} user - Objeto do utilizador autenticado
 * @returns {boolean}
 */
export function isAdminUser(user) {
  if (!user) return false;
  const role = (user.role || user.accountType || "").toLowerCase().trim();
  return ["admin", "instrutor", "instructor", "professor"].includes(role);
}

