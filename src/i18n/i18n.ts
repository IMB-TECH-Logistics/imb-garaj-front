import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

import enCommon from "./locales/en/common.json"
import jaCommon from "./locales/ja/common.json"
import ruCommon from "./locales/ru/common.json"
import uzCommon from "./locales/uz/common.json"

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            uz: { common: uzCommon },
            ru: { common: ruCommon },
            en: { common: enCommon },
            ja: { common: jaCommon },
        },
        defaultNS: "common",
        fallbackLng: "uz",
        detection: {
            order: ["localStorage"],
            caches: ["localStorage"],
            lookupLocalStorage: "garage_lang",
        },
        interpolation: { escapeValue: false },
    })

export default i18n
