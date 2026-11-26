import React, { createContext, useContext, useState, useEffect } from "react";
import api from "./api";
import { toast } from "react-toastify";

export type SupportedLanguage = "en" | "es" | "hi" | "pt" | "zh" | "fr";

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
];

export const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    nav_home: "Home",
    nav_internships: "Internships",
    nav_jobs: "Jobs",
    nav_resume_builder: "Resume Builder",
    nav_pricing: "Subscriptions",
    nav_dashboard: "Company Dashboard",
    nav_admin: "Admin Panel",
    nav_profile: "My Profile",
    nav_applications: "My Applications",
    nav_login: "Login",
    nav_register: "Register",
    nav_logout: "Logout",
    search_placeholder: "Search by title, category, company...",
    filter_title: "Filters",
    clear_all: "Clear all",
    apply_now: "Apply Now",
    applied: "Applied",
    view_details: "View Details",
    monthly_stipend: "Monthly Stipend",
    location: "Location",
    start_date: "Start Date",
    actively_hiring: "Actively Hiring",
    subscription_title: "Subscription Plans & Quotas",
    upgrade_now: "Upgrade Plan",
    resume_builder_title: "Premium Resume Builder",
    download_resume_btn: "Download PDF (₹50)",
    current_plan: "Current Plan",
    applications_remaining: "Applications Remaining",
  },
  es: {
    nav_home: "Inicio",
    nav_internships: "Pasantías",
    nav_jobs: "Empleos",
    nav_resume_builder: "Creador de CV",
    nav_pricing: "Suscripciones",
    nav_dashboard: "Panel de Empresa",
    nav_admin: "Panel Admin",
    nav_profile: "Mi Perfil",
    nav_applications: "Mis Solicitudes",
    nav_login: "Iniciar Sesión",
    nav_register: "Registrarse",
    nav_logout: "Cerrar Sesión",
    search_placeholder: "Buscar por título, categoría, empresa...",
    filter_title: "Filtros",
    clear_all: "Borrar todo",
    apply_now: "Postularse",
    applied: "Postulado",
    view_details: "Ver Detalles",
    monthly_stipend: "Estipendio Mensual",
    location: "Ubicación",
    start_date: "Fecha de Inicio",
    actively_hiring: "Contratando Activamente",
    subscription_title: "Planes de Suscripción y Cuotas",
    upgrade_now: "Mejorar Plan",
    resume_builder_title: "Creador de CV Premium",
    download_resume_btn: "Descargar PDF (₹50)",
    current_plan: "Plan Actual",
    applications_remaining: "Solicitudes Restantes",
  },
  hi: {
    nav_home: "होम",
    nav_internships: "इंटर्नशिप",
    nav_jobs: "नौकरियां",
    nav_resume_builder: "रिज्यूमे बिल्डर",
    nav_pricing: "सदस्यता योजनाएं",
    nav_dashboard: "कंपनी डैशबोर्ड",
    nav_admin: "एडमिन पैनल",
    nav_profile: "मेरी प्रोफ़ाइल",
    nav_applications: "मेरे आवेदन",
    nav_login: "लॉग इन",
    nav_register: "रजिस्टर",
    nav_logout: "लॉग आउट",
    search_placeholder: "शीर्षक, श्रेणी, कंपनी द्वारा खोजें...",
    filter_title: "फ़िल्टर",
    clear_all: "सभी साफ़ करें",
    apply_now: "अभी आवेदन करें",
    applied: "आवेदन किया गया",
    view_details: "विवरण देखें",
    monthly_stipend: "मासिक वजीफा",
    location: "स्थान",
    start_date: "प्रारंभ तिथि",
    actively_hiring: "सक्रिय रूप से भर्ती",
    subscription_title: "सदस्यता योजनाएं और कोटा",
    upgrade_now: "योजना अपग्रेड करें",
    resume_builder_title: "प्रीमियम रिज्यूमे बिल्डर",
    download_resume_btn: "पीडीएफ डाउनलोड करें (₹50)",
    current_plan: "वर्तमान योजना",
    applications_remaining: "शेष आवेदन",
  },
  pt: {
    nav_home: "Início",
    nav_internships: "Estágios",
    nav_jobs: "Vagas",
    nav_resume_builder: "Criador de Currículo",
    nav_pricing: "Assinaturas",
    nav_dashboard: "Painel da Empresa",
    nav_admin: "Painel Admin",
    nav_profile: "Meu Perfil",
    nav_applications: "Minhas Candidaturas",
    nav_login: "Entrar",
    nav_register: "Cadastrar",
    nav_logout: "Sair",
    search_placeholder: "Buscar por cargo, categoria, empresa...",
    filter_title: "Filtros",
    clear_all: "Limpar tudo",
    apply_now: "Candidatar-se",
    applied: "Candidatado",
    view_details: "Ver Detalhes",
    monthly_stipend: "Bolsa Mensal",
    location: "Localização",
    start_date: "Data de Início",
    actively_hiring: "Contratação Ativa",
    subscription_title: "Planos de Assinatura e Cotas",
    upgrade_now: "Atualizar Plano",
    resume_builder_title: "Criador de Currículo Premium",
    download_resume_btn: "Baixar PDF (₹50)",
    current_plan: "Plano Atual",
    applications_remaining: "Candidaturas Restantes",
  },
  zh: {
    nav_home: "首页",
    nav_internships: "实习机会",
    nav_jobs: "全职工作",
    nav_resume_builder: "简历制作工具",
    nav_pricing: "会员订阅",
    nav_dashboard: "企业后台",
    nav_admin: "管理面板",
    nav_profile: "个人中心",
    nav_applications: "我的申请",
    nav_login: "登录",
    nav_register: "注册",
    nav_logout: "退出登录",
    search_placeholder: "按职位、类别或公司搜索...",
    filter_title: "筛选条件",
    clear_all: "清除全部",
    apply_now: "立即申请",
    applied: "已申请",
    view_details: "查看详情",
    monthly_stipend: "月薪补贴",
    location: "工作地点",
    start_date: "入职时间",
    actively_hiring: "正在急聘",
    subscription_title: "订阅套餐与申请额度",
    upgrade_now: "升级套餐",
    resume_builder_title: "高级专业简历生成器",
    download_resume_btn: "下载PDF简历 (₹50)",
    current_plan: "当前套餐",
    applications_remaining: "剩余申请次数",
  },
  fr: {
    nav_home: "Accueil",
    nav_internships: "Stages",
    nav_jobs: "Emplois",
    nav_resume_builder: "Générateur de CV",
    nav_pricing: "Abonnements",
    nav_dashboard: "Tableau de Bord Entreprise",
    nav_admin: "Panneau d'administration",
    nav_profile: "Mon Profil",
    nav_applications: "Mes Candidatures",
    nav_login: "Connexion",
    nav_register: "S'inscrire",
    nav_logout: "Déconnexion",
    search_placeholder: "Rechercher par titre, catégorie, entreprise...",
    filter_title: "Filtres",
    clear_all: "Tout effacer",
    apply_now: "Postuler",
    applied: "Candidaté",
    view_details: "Voir les détails",
    monthly_stipend: "Indemnité Mensuelle",
    location: "Localisation",
    start_date: "Date de début",
    actively_hiring: "Recrutement Actif",
    subscription_title: "Abonnements & Quotas de Candidatures",
    upgrade_now: "Améliorer le Plan",
    resume_builder_title: "Générateur de CV Premium",
    download_resume_btn: "Télécharger PDF (₹50)",
    current_plan: "Plan Actuel",
    applications_remaining: "Candidatures Restantes",
  },
};

interface I18nContextType {
  language: SupportedLanguage;
  t: (key: string) => string;
  changeLanguage: (targetLang: SupportedLanguage, otp?: string) => Promise<{ requireOtp?: boolean; success?: boolean }>;
  isFrenchOtpModalOpen: boolean;
  setIsFrenchOtpModalOpen: (open: boolean) => void;
}

const I18nContext = createContext<I18nContextType>({
  language: "en",
  t: (key: string) => key,
  changeLanguage: async () => ({ success: true }),
  isFrenchOtpModalOpen: false,
  setIsFrenchOtpModalOpen: () => {},
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<SupportedLanguage>("en");
  const [isFrenchOtpModalOpen, setIsFrenchOtpModalOpen] = useState(false);

  useEffect(() => {
    // Load persisted language
    const saved = localStorage.getItem("internshala_lang") as SupportedLanguage;
    if (saved && translations[saved]) {
      setLanguage(saved);
    }
  }, []);

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const changeLanguage = async (
    targetLang: SupportedLanguage,
    otp?: string
  ): Promise<{ requireOtp?: boolean; debugOtp?: string; success?: boolean }> => {
    try {
      const token = localStorage.getItem("internshala_token");
      if (!token) {
        // If not logged in, allow instant client-side switch except French security check notice
        if (targetLang === "fr" && !otp) {
          toast.warning("French language selection requires login and OTP verification for security compliance.");
        }
        setLanguage(targetLang);
        localStorage.setItem("internshala_lang", targetLang);
        return { success: true };
      }

      const res = await api.post("/language/change", {
        language: targetLang,
        otp,
      });

      if (res.status === 202 && res.data.requireOtp) {
        setIsFrenchOtpModalOpen(true);
        toast.info(res.data.message || "OTP required to switch language to French");
        return { requireOtp: true };
      }

      setLanguage(targetLang);
      localStorage.setItem("internshala_lang", targetLang);
      setIsFrenchOtpModalOpen(false);
      toast.success(res.data.message || `Language updated to ${targetLang}`);
      return { success: true };
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || "Failed to update language";
      toast.error(errMsg);
      return { success: false };
    }
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        t,
        changeLanguage,
        isFrenchOtpModalOpen,
        setIsFrenchOtpModalOpen,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
