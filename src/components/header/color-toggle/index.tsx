import { Button } from "@/components/ui/button"
import { useTheme } from "@/layouts/theme"
import { Moon, Sun } from "lucide-react"

export function ThemeColorToggle() {
    const { theme, setTheme } = useTheme()
    const isLight = theme === "light"

    return (
        <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            onClick={() => setTheme(isLight ? "dark" : "light")}
        >
            {isLight ? <Moon size={18} /> : <Sun size={18} />}
        </Button>
    )
}
