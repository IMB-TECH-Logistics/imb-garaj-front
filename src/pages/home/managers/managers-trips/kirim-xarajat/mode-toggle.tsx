import { cn } from "@/lib/utils"
import { Truck, User } from "lucide-react"
import { useTranslation } from "react-i18next"

// ──── T hisob mode toggle ────

export function ModeToggle({
    mode,
    onToggle,
}: {
    mode: "aylanma" | "haydovchi"
    onToggle: (mode: "aylanma" | "haydovchi") => void
}) {
    const { t } = useTranslation()
    const isHaydovchi = mode === "haydovchi"
    return (
        <div className="w-full max-w-sm mx-auto">
            <div className="flex items-center rounded-lg bg-muted p-1 relative">
                <div
                    className={cn(
                        "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md bg-background shadow-sm transition-all duration-300 ease-in-out pointer-events-none",
                        isHaydovchi ? "left-[calc(50%+2px)]" : "left-1",
                    )}
                />
                <button
                    onClick={() => onToggle("aylanma")}
                    className={cn(
                        "relative z-10 flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200",
                        !isHaydovchi
                            ? "text-primary"
                            : "text-muted-foreground",
                    )}
                >
                    <Truck size={16} />
                    {t("page.turnovers")}
                </button>
                <button
                    onClick={() => onToggle("haydovchi")}
                    className={cn(
                        "relative z-10 flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200",
                        isHaydovchi
                            ? "text-primary"
                            : "text-muted-foreground",
                    )}
                >
                    <User size={16} />
                    {t("nav.drivers")}
                </button>
            </div>
        </div>
    )
}
