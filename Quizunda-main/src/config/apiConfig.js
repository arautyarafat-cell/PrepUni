// src/config/apiConfig.js
// Configuração unificada de endpoints e host da API para desenvolvimento e produção

export const API_HOST = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");
export const API_BASE_URL = `${API_HOST}/api`;

if (typeof window !== "undefined") {
  console.log("🔗 [PrepUni API] Conectado a:", API_BASE_URL);
  if (API_HOST.includes("localhost") && window.location.hostname !== "localhost") {
    console.warn("⚠️ [Atenção] O Frontend na Vercel está tentando se conectar a localhost:5000. Configure a variável de ambiente REACT_APP_API_URL na Vercel e faça um Redeploy!");
  }
}

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

