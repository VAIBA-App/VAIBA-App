import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  de: {
    translation: {
      "dashboard": "Dashboard",
      "clients": "Klienten",
      "telephone": "Telefon",
      "customerSearch": "Kundensuche",
      "customerList": "Kundenliste",
      "soloCalls": "Solo-Anrufe",
      "autoCalls": "Auto-Anrufe",
      "marketing": "Marketing",
      "email": "E-Mail",
      "calendar": "Kalender",
      "socialMedia": "Social Media",
      "voice": "Voice",
      "simulator": "Simulator",
      "settings": "Einstellungen",
      "language": "Sprache",
      "theme": "Erscheinungsbild",
      "assistant": "Assistent",
      "profile": "Profil",
      "subscription": "Abonnement",
      "privacy": "Datenschutz",
      "help": "Hilfe",
      "darkMode": "Dark Mode",
      "lightMode": "Light Mode",
      "activate": "Aktivieren",
    }
  },
  en: {
    translation: {
      "dashboard": "Dashboard",
      "clients": "Clients",
      "telephone": "Telephone",
      "customerSearch": "Customer Search",
      "customerList": "Customer List",
      "soloCalls": "Solo Calls",
      "autoCalls": "Auto Calls",
      "marketing": "Marketing",
      "email": "Email",
      "calendar": "Calendar",
      "socialMedia": "Social Media",
      "voice": "Voice",
      "simulator": "Simulator",
      "settings": "Settings",
      "language": "Language",
      "theme": "Theme",
      "assistant": "Assistant",
      "profile": "Profile",
      "subscription": "Subscription",
      "privacy": "Privacy",
      "help": "Help",
      "darkMode": "Dark Mode",
      "lightMode": "Light Mode",
      "activate": "Activate",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'de',
    debug: true,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  });

export default i18n;