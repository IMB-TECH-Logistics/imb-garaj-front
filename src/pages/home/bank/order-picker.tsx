import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ChevronsUpDown, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

export const BANK_ORDERS = "checkout/bank/orders"

export type BankOrderOption = {
    id: number
    label: string
    date: string | null
    vehicle: string | null
    client: string | null
    income: string | number
    received: string | number
}

export type PickedOrder = { id: number; label: string }

const useDebounced = (value: string, ms = 300) => {
    const [v, setV] = useState(value)
    useEffect(() => {
        const timer = setTimeout(() => setV(value), ms)
        return () => clearTimeout(timer)
    }, [value, ms])
    return v
}

const OrderPicker = ({
    value,
    onChange,
    compact = false,
}: {
    value: PickedOrder | null
    onChange: (next: PickedOrder | null) => void
    compact?: boolean
}) => {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const search = useDebounced(query)
    const { data, isLoading } = useGet<BankOrderOption[]>(BANK_ORDERS, {
        params: { search: search || undefined },
        enabled: open,
    })

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md border bg-background px-2 text-left",
                        compact ? "h-8 text-sm" : "h-10",
                    )}
                >
                    <span className={cn("truncate", !value && "text-muted-foreground")}>
                        {value ? value.label : t("bank_page.order_pick")}
                    </span>
                    {value ?
                        <X
                            size={14}
                            className="shrink-0 opacity-60 hover:opacity-100"
                            onClick={(e) => {
                                e.stopPropagation()
                                onChange(null)
                            }}
                        />
                    :   <ChevronsUpDown size={14} className="shrink-0 opacity-50" />}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px] p-2" align="start">
                <input
                    autoFocus
                    className="mb-2 h-9 w-full rounded-md border bg-background px-2 text-sm"
                    placeholder={t("bank_page.order_search")}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <div className="max-h-72 overflow-auto">
                    {isLoading && <div className="p-2 text-sm text-muted-foreground">…</div>}
                    {!isLoading && !data?.length && (
                        <div className="p-2 text-sm text-muted-foreground">{t("bank_page.order_none")}</div>
                    )}
                    {data?.map((o) => (
                        <button
                            key={o.id}
                            type="button"
                            className={cn(
                                "flex w-full flex-col items-start rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                                value?.id === o.id && "bg-muted",
                            )}
                            onClick={() => {
                                onChange({ id: o.id, label: o.label })
                                setOpen(false)
                            }}
                        >
                            <span className="font-medium">{o.label}</span>
                            <span className="text-xs text-muted-foreground">
                                {[o.date ? format(new Date(o.date), "dd.MM.yyyy") : null, o.vehicle, o.client]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </span>
                            <span className="text-xs tabular-nums">
                                {t("bank_page.order_income")}: {formatMoney(Number(o.income))}
                                {Number(o.received) > 0 && (
                                    <span className="text-emerald-600">
                                        {" "}· {t("bank_page.order_received")}: {formatMoney(Number(o.received))}
                                    </span>
                                )}
                            </span>
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default OrderPicker
