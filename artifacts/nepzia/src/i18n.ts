import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en/common.json";
import ne from "./locales/ne/common.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      ne: { common: ne },
    },
    defaultNS: "common",
    fallbackLng: "ne",
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "nepzia_lang",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
