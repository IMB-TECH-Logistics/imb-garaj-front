import { enUS, ja, ru, uz, uzCyrl } from "date-fns/locale"
import { useTranslation } from "react-i18next"

const LOCALES = { uz, "uz-Cyrl": uzCyrl, ru, en: enUS, ja }

export function useDateLocale() {
    const { i18n } = useTranslation()
    const lng = i18n.resolvedLanguage || i18n.language || "uz"
    return LOCALES[lng as keyof typeof LOCALES] ?? LOCALES[lng.slice(0, 2) as keyof typeof LOCALES] ?? uz
}
