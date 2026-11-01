// src/context/AuthContext1.js
import React, { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL } from "../config/apiConfig";

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (username, password) => {
    // Tenta primeiro o login administrativo direto
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrPhone: username, password }),
    });

    if (!res.ok) {
      throw new Error("Credenciais inválidas");
    }

    const data = await res.json();
    const role = (data.role || data.accountType || "").toLowerCase();
    const isStaff = ["admin", "instrutor", "instructor", "professor", "preparatorio"].includes(role);

    if (!isStaff) {
      throw new Error("Acesso restrito. Este usuário não possui privilégios de administrador ou instrutor.");
    }

    let decoded = {};
    try {
      decoded = jwtDecode(data.token);
    } catch {
      decoded = { username: data.user?.username || username, role: role || "admin" };
    }

    const adminData = {
      id: data.user?.id || decoded.id,
      name: data.user?.name || decoded.name || username,
      username: decoded.username || data.user?.username || username,
      role: role,
      accountType: data.accountType || role,
      token: data.token,
    };

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(adminData));
    localStorage.setItem("adminUser", JSON.stringify(adminData));
    localStorage.setItem("adminToken", data.token);

    setAdmin(adminData);
    return adminData;
  };

  const logout = () => {
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setAdmin(null);
  };

  useEffect(() => {
    const savedAdmin = localStorage.getItem("adminUser");
    const savedUser = localStorage.getItem("user");

    if (savedAdmin) {
      try {
        setAdmin(JSON.parse(savedAdmin));
      } catch (e) {
        console.error("Erro ao carregar adminUser:", e);
      }
    } else if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        const r = (parsed.role || parsed.accountType || "").toLowerCase();
        if (["admin", "instrutor", "instructor", "professor", "preparatorio"].includes(r)) {
          setAdmin(parsed);
          localStorage.setItem("adminUser", JSON.stringify(parsed));
        }
      } catch (e) {
        console.error("Erro ao converter user em admin:", e);
      }
    }
    setLoading(false);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
