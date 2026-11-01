// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../config/apiConfig";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validação e sincronização da sessão com o backend
  const verifySession = useCallback(async () => {
    const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
    const savedUserStr = localStorage.getItem("user") || localStorage.getItem("adminUser");

    let localUser = null;
    if (savedUserStr) {
      try {
        localUser = JSON.parse(savedUserStr);
      } catch (e) {
        console.error("Erro ao ler dados locais de autenticação:", e);
      }
    }

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Inicializa com os dados locais imediatamente para evitar oscilações de UI
    if (localUser) {
      setUser({ ...localUser, token });
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        const verifiedUser = {
          ...data.user,
          role: (data.role || "estudante").toLowerCase(),
          token
        };

        setUser(verifiedUser);
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(verifiedUser));

        const isStaff = ["admin", "instrutor", "instructor", "professor", "preparatorio"].includes(verifiedUser.role);
        if (isStaff) {
          localStorage.setItem("adminUser", JSON.stringify(verifiedUser));
          localStorage.setItem("adminToken", token);
        } else {
          localStorage.removeItem("adminUser");
          localStorage.removeItem("adminToken");
        }
      } else if (res.status === 401) {
        // Token expirado ou inválido
        console.warn("Sessão expirada ou inválida. Limpando credenciais locais.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("adminUser");
        localStorage.removeItem("adminToken");
        setUser(null);
      }
    } catch (err) {
      console.warn("Servidor offline ou inatingível no momento. Mantendo credenciais em cache.");
      if (localUser) {
        setUser({ ...localUser, token });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (emailOrPhone, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Credenciais inválidas");
      }

      const role = (data.role || data.accountType || "estudante").toLowerCase();
      const userData = {
        id: data.user.id,
        name: data.user.name || data.user.username,
        username: data.user.username || data.user.name,
        emailOrPhone: data.user.emailOrPhone,
        role,
        accountType: data.accountType || role,
        phone: data.user.phone || "",
        bio: data.user.bio || "",
        avatar: data.user.avatar || null,
        token: data.token
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(userData));

      const isStaff = ["admin", "instrutor", "instructor", "professor", "preparatorio"].includes(role);
      if (isStaff) {
        localStorage.setItem("adminUser", JSON.stringify(userData));
        localStorage.setItem("adminToken", data.token);
      } else {
        localStorage.removeItem("adminUser");
        localStorage.removeItem("adminToken");
      }

      setUser(userData);
      return userData;
    } catch (err) {
      console.error("Erro no login:", err.message);
      throw err;
    }
  };

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const nextUser = { ...prev, ...updatedFields };
      localStorage.setItem("user", JSON.stringify(nextUser));
      const isStaff = ["admin", "instrutor", "instructor", "professor", "preparatorio"].includes(
        (nextUser.role || "").toLowerCase()
      );
      if (isStaff) {
        localStorage.setItem("adminUser", JSON.stringify(nextUser));
      }
      return nextUser;
    });
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminToken");
    setUser(null);
  };

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, verifySession, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
