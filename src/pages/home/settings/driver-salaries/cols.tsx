import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { Clock } from "lucide-react"
import { useMemo } from "react"

export type SalaryAmount = {
    id: number
    amount: string | number
    valid_from: string
    changed_by_full_name?: string | null
    created: string
}

export type DriverSalaryRow = {
    id: number
    from_region: number
    from_region_name: string
    to_region: number
    to_region_name: string
    current_amount: SalaryAmount | null
    amounts: SalaryAmount[]
    created: string
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

export const SalaryHistoryPopover = ({ amounts }: { amounts?: SalaryAmount[] }) => {
    const sorted = [...(amounts ?? [])].sort((a, b) =>
        (b.valid_from ?? "").localeCompare(a.valid_from ?? ""),
    )
    return (
        <Popover>
            <PopoverTrigger
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent"
                aria-label="Tariflar tarixi"
            >
                <Clock size={16} />
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="w-80 p-0"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-3 py-2 border-b text-sm font-medium">
                    Tariflar tarixi
                </div>
                {sorted.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground">
                        Tarix mavjud emas
                    </div>
                ) : (
                    <div className="max-h-72 overflow-y-auto divide-y">
                        {sorted.map((a) => (
                            <div key={a.id} className="px-3 py-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold tabular-nums">
                                        {formatMoney(Number(a.amount ?? 0))}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(a.valid_from)} dan
                                    </span>
                                </div>
                                <div className="mt-0.5 text-xs text-muted-foreground flex items-center justify-between gap-2">
                                    <span className="truncate">
                                        {a.changed_by_full_name || "—"}
                                    </span>
                                    <span>{formatDateTime(a.created)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}

export const useDriverSalaryCols = () =>
    useMemo<ColumnDef<DriverSalaryRow>[]>(
        () => [
            {
                header: "Qayerdan",
                accessorKey: "from_region_name",
                enableSorting: true,
            },
            {
                header: "Qayerga",
                accessorKey: "to_region_name",
                enableSorting: true,
            },
            {
                header: "Joriy summa (UZS)",
                accessorKey: "current_amount",
                enableSorting: true,
                cell: ({ row }) => {
                    const a = row.original.current_amount
                    if (!a) return <span className="text-muted-foreground">—</span>
                    return (
                        <span className="tabular-nums font-medium">
                            {formatMoney(Number(a.amount))}
                        </span>
                    )
                },
            },
            {
                header: "Boshlanish sanasi",
                accessorKey: "valid_from",
                enableSorting: true,
                cell: ({ row }) => row.original.current_amount?.valid_from || "—",
            },
        ],
        [],
    )
