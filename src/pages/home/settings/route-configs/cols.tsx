import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { Clock } from "lucide-react"
import { useMemo } from "react"

export type SelectableItem = { id: number; name: string }

export type DirectionPrice = {
    id: number
    price: string | number
    valid_from: string
    created?: string
    changed_by?: number | null
    changed_by_name?: string | null
}

export type DirectionRow = {
    id: number
    owner_name: string
    load_name: string
    unload_name: string
    cargo_type_name: string
    payment_type_name: string
    currency: 1 | 2
    current_price: DirectionPrice | null
    prices?: DirectionPrice[]
}

const formatDate = (s?: string | null) => {
    if (!s) return "—"
    const d = new Date(s)
    if (isNaN(d.getTime())) return s
    return d.toLocaleDateString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })
}

const formatDateTime = (s?: string | null) => {
    if (!s) return "—"
    const d = new Date(s)
    if (isNaN(d.getTime())) return s
    return d.toLocaleString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    })
}

const PriceHistoryPopover = ({ prices }: { prices?: DirectionPrice[] }) => {
    const sorted = [...(prices ?? [])].sort((a, b) =>
        (b.valid_from ?? "").localeCompare(a.valid_from ?? ""),
    )
    return (
        <Popover>
            <PopoverTrigger
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent"
                aria-label="Narx tarixi"
            >
                <Clock size={16} />
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="w-80 p-0"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-3 py-2 border-b text-sm font-medium">
                    Narx tarixi
                </div>
                {sorted.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground">
                        Tarix mavjud emas
                    </div>
                ) : (
                    <div className="max-h-72 overflow-y-auto divide-y">
                        {sorted.map((p) => (
                            <div key={p.id} className="px-3 py-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold tabular-nums">
                                        {formatMoney(Number(p.price ?? 0))}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(p.valid_from)} dan
                                    </span>
                                </div>
                                <div className="mt-0.5 text-xs text-muted-foreground flex items-center justify-between gap-2">
                                    <span className="truncate">
                                        {p.changed_by_name || "—"}
                                    </span>
                                    <span>{formatDateTime(p.created)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}

const CURRENCY_LABELS: Record<number, string> = {
    1: "UZS",
    2: "USD",
}


export const useDirectionColumns = () =>
    useMemo<ColumnDef<DirectionRow>[]>(
        () => [
            { accessorKey: "load_name", header: "Yuklash manzili", enableSorting: true },
            { accessorKey: "unload_name", header: "Yuk tushirish manzili", enableSorting: true },
            { accessorKey: "owner_name", header: "Yuk egasi", enableSorting: true },
            { accessorKey: "cargo_type_name", header: "Yuk turi", enableSorting: true },
            { accessorKey: "payment_type_name", header: "To'lov turi", enableSorting: true },
            {
                accessorKey: "current_price",
                header: "Summa",
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <span>
                            {formatMoney(
                                Number(row.original.current_price?.price ?? 0),
                            )}
                        </span>
                        <PriceHistoryPopover prices={row.original.prices} />
                    </div>
                ),
            },
            {
                accessorKey: "currency",
                header: "Valyuta",
                enableSorting: true,
                cell: ({ row }) =>
                    CURRENCY_LABELS[row.original.currency] ?? "-",
            },
        ],
        [],
    )
