import { Button } from "@/components/ui/button"
import { useTheme } from "@/layouts/theme"
import { Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"

export function ThemeColorToggle() {
    const { theme, setTheme } = useTheme()
    const isLight = theme === "light"
    const { t } = useTranslation()

    return (
        <Button
            type="button"
            variant="default"
            size="icon"
            aria-label={t("actions.toggle_theme")}
            className="size-9 shrink-0"
            onClick={() => setTheme(isLight ? "dark" : "light")}
        >
            {isLight ? <Moon size={18} /> : <Sun size={18} />}
        </Button>
    )
}
