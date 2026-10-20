import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Category } from "./types"

// ──── Category tabs component ────

export function CategoryTabs({
    categories,
    selectedId,
    onSelect,
    onAdd,
    prefix = "cat",
}: {
    categories: Category[]
    selectedId: number | null
    onSelect: (cat: Category) => void
    onAdd: () => void
    prefix?: string
}) {
    const { t } = useTranslation()
    return (
        <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar">
            {categories.map((cat, idx) => {
                const isActive = selectedId != null && selectedId === cat.id
                return (
                    <div
                        key={`${prefix}-${cat.id ?? idx}`}
                        onClick={() => onSelect(cat)}
                        className={cn(
                            "px-4 py-3 min-w-36 rounded-md text-center cursor-pointer transition-colors shrink-0",
                            isActive
                                ? "border-2 border-primary bg-primary/5"
                                : "border border-border hover:border-primary",
                        )}
                    >
                        <p className="text-sm">{cat.name}</p>
                        {cat.total_amount_uzs != null ? (
                            <div>
                                <p className="font-semibold">{formatMoney(cat.total_amount_uzs)} <span className="text-xs text-muted-foreground">UZS</span></p>
                            </div>
                        ) : (
                            <p className="font-semibold">{formatMoney(cat.total_amount ?? cat.amount ?? 0)}</p>
                        )}
                    </div>
                )
            })}
            <div
                onClick={onAdd}
                className={cn(
                    "px-2 py-3 min-w-20 border border-dashed border-primary rounded-md text-sm flex items-center justify-center cursor-pointer hover:bg-secondary shrink-0",
                )}
            >
                <Plus className="text-primary size-8" />
            </div>
        </div>
    )
}
