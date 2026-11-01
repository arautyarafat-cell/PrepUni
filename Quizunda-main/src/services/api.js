import axios from "axios";
import { API_BASE_URL, API_HOST, getUploadUrl } from "../config/apiConfig";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("adminToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export { API_BASE_URL, API_HOST, getUploadUrl };
export default api;
