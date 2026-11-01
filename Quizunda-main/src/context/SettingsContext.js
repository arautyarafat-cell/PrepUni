import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../config/apiConfig";

export const DEFAULT_SETTINGS = {
  platform_name: "prepUni - Plataforma LMS",
  contact_email: "contato@prepuni.com",
  support_phone: "+244 941 908 927",
  support_whatsapp: "5581997570784",
  payment_whatsapp: "5581997570784",
  bna_iban: "0040.0000.3762.4337.1015.4",
  bna_express: "941908927",
  currency_symbol: "Kz",
  allow_registration: true,
  certificate_min_score: 70,
  whatsapp_display: "(81) 99757-0784",
  whatsapp_message: "Olá, preciso de ajuda!",
  whatsapp_description: "Atendimento rápido e suporte a dúvidas sobre cursos e matrículas.",
  instagram_url: "https://www.instagram.com/estoupreparadoconcursos/",
  instagram_handle: "@estoupreparadoconcursos",
  instagram_description: "Acompanhe dicas diárias, notícias de editais e lives exclusivas.",
  youtube_url: "https://www.youtube.com/user/isaqueljoao",
  youtube_title: "Preparatório Universitário Oficial",
  youtube_description: "Aulas gratuitas, correções de provas e análises de bancas.",
  location_title: "Unidade Física",
  location_address: "Limoeiro / Recife - PE",
  location_description: "Cursos e simulados presenciais no estado de Pernambuco.",
  location_link: "/CoursesPage",
  location_button_text: "Ver Cursos Presenciais",
  facebook_url: "https://www.facebook.com",
  banner_title: "A tua aprovação é a nossa missão!",
  banner_subtitle: "Junta-te à melhor academia de preparação universitária"
};

const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  loading: false,
  refreshSettings: async () => {},
  updateLocalSettings: () => {},
  getWhatsAppLink: () => "",
  getWhatsAppDisplay: () => ""
});

export const formatWhatsAppDigits = (rawPhone) => {
  if (!rawPhone) return "";
  const digits = String(rawPhone).replace(/\D/g, "");
  // Se for número do Brasil com DDD (10 ou 11 dígitos) sem o código 55
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) {
    return `55${digits}`;
  }
  return digits;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem("platform_settings");
      if (cached) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
      }
    } catch (e) {
      console.warn("Erro ao ler configurações do localStorage:", e);
    }
    return DEFAULT_SETTINGS;
  });

  const [loading, setLoading] = useState(false);

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/settings`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === "object") {
          const merged = { ...DEFAULT_SETTINGS, ...data };
          setSettings(merged);
          localStorage.setItem("platform_settings", JSON.stringify(merged));
        }
      }
    } catch (err) {
      console.warn("Não foi possível carregar configurações remotas:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateLocalSettings = useCallback((newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem("platform_settings", JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  }, []);

  const getWhatsAppLink = useCallback(
    (customMessage) => {
      const phoneDigits = formatWhatsAppDigits(
        settings.support_whatsapp || settings.whatsapp_display || DEFAULT_SETTINGS.support_whatsapp
      );
      const text = customMessage || settings.whatsapp_message || DEFAULT_SETTINGS.whatsapp_message;
      return `https://api.whatsapp.com/send?phone=${phoneDigits}&text=${encodeURIComponent(text)}`;
    },
    [settings]
  );

  const getWhatsAppDisplay = useCallback(() => {
    return settings.whatsapp_display || settings.support_whatsapp || DEFAULT_SETTINGS.whatsapp_display;
  }, [settings]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings,
        updateLocalSettings,
        getWhatsAppLink,
        getWhatsAppDisplay
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
export default SettingsContext;
