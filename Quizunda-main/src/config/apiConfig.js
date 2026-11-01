// src/config/apiConfig.js
// Configuração unificada de endpoints e host da API para desenvolvimento e produção

export const API_HOST = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");
export const API_BASE_URL = `${API_HOST}/api`;

/**
 * Normaliza URLs de upload para garantir que apontem para o host correto em produção
 */
export const getUploadUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${API_HOST}${cleanPath}`;
};

const apiConfig = {
  API_HOST,
  API_BASE_URL,
  getUploadUrl
};

export default apiConfig;

