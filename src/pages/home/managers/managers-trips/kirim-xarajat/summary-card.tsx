import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"

// ──── Summary card ────

export function SummaryCard({
    label,
    amountUzs,
    variant,
    unitUzs = "UZS",
    active,
    onClick,
    sub,
    hideAmount,
}: {
    sub?: React.ReactNode
    hideAmount?: boolean
    label: string
    amountUzs: number
    variant: "income" | "expense" | "balance" | "advance"
    unitUzs?: string
    active?: boolean
    onClick?: () => void
}) {
    return (
        <div
            onClick={onClick}
            role={onClick ? "button" : undefined}
            className={cn(
                "px-4 py-3 rounded-md border min-w-36 text-center",
                onClick && "cursor-pointer transition hover:brightness-110",
                active && "ring-2 ring-inset ring-primary",
                variant === "income" && "bg-green-500/10 border-transparent",
                variant === "expense" && "bg-red-600/10 border-transparent",
                variant === "balance" && "bg-primary/10 border-transparent",
                variant === "advance" && "bg-amber-500/10 border-transparent",
            )}
        >
            <p className="text-sm text-muted-foreground">{label}</p>
            <p
                className={cn(
                    "font-semibold text-lg",
                    variant === "income" && "text-green-600",
                    variant === "expense" && "text-red-600",
                    variant === "balance" && "text-primary",
                    variant === "advance" && "text-amber-600",
                )}
            >
                {hideAmount ?
                    <span className="whitespace-nowrap">{sub ?? "—"}</span>
                :   <>
                        {formatMoney(amountUzs)}{unitUzs && <> <span className="text-xs text-muted-foreground">{unitUzs}</span></>}
                        {sub && <span className="whitespace-nowrap"> · {sub}</span>}
                    </>
                }
            </p>
        </div>
    )
}
