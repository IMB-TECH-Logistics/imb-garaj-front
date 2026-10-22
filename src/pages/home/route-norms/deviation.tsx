import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Flag } from "lucide-react"
import { useTranslation } from "react-i18next"
import { DeviationLevel, DeviationLevels } from "./types"

export const DEFAULT_LEVELS: DeviationLevels = { yellow: 15, red: 20 }

export const FLAG_COLORS: Record<DeviationLevel, string> = {
    yellow: "text-amber-500 fill-amber-500",
    red: "text-red-500 fill-red-500",
}

export const FLAG_TEXT: Record<DeviationLevel, string> = {
    yellow: "text-amber-600 dark:text-amber-400",
    red: "text-red-600 dark:text-red-400",
}

export const FlagIcon = ({
    level,
    size = 14,
}: {
    level: DeviationLevel
    size?: number
}) => <Flag size={size} className={cn("shrink-0", FLAG_COLORS[level])} />

export const FlagCount = ({
    level,
    count,
}: {
    level: DeviationLevel
    count: number
}) => (
    <span
        className={cn(
            "inline-flex items-center gap-1 tabular-nums font-medium",
            FLAG_TEXT[level],
        )}
    >
        <FlagIcon level={level} />
        {count}
    </span>
)

export function DeviationLegend({
    levels = DEFAULT_LEVELS,
}: {
    levels?: DeviationLevels
}) {
    const { t } = useTranslation()
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    className="h-auto p-0 text-sm font-normal text-muted-foreground underline decoration-dotted underline-offset-4 hover:bg-transparent gap-1.5"
                >
                    <FlagIcon level="yellow" size={13} />
                    <FlagIcon level="red" size={13} />
                    {t("route_norms.legend.title")}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 space-y-2 text-sm">
                <p className="text-muted-foreground">
                    {t("route_norms.legend.intro")}
                </p>
                <div className="flex items-start gap-2">
                    <FlagIcon level="yellow" />
                    <span>{t("route_norms.legend.yellow", { pct: levels.yellow })}</span>
                </div>
                <div className="flex items-start gap-2">
                    <FlagIcon level="red" />
                    <span>{t("route_norms.legend.red", { pct: levels.red })}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                    {t("route_norms.legend.example")}
                </p>
            </PopoverContent>
        </Popover>
    )
}
