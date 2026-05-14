import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { ColumnDef } from "@tanstack/react-table"
import {
    AlertTriangle,
    PackageMinus,
    SquarePen,
    Trash2,
} from "lucide-react"
import { useMemo } from "react"

export type ExpiryStatus = "none" | "ok" | "soon" | "expired"

export interface OmborProduct {
    id: number
    name: string
    unit: string
    unit_display: string
    unit_price: string | number
    quantity: string | number
    expiry_date: string | null
    days_to_expiry: number | null
    expiry_status: ExpiryStatus
    total?: string | number
    created?: string
    updated?: string
}

export const UNIT_OPTIONS = [
    { id: "piece", name: "Dona" },
    { id: "liter", name: "Litr" },
    { id: "canister", name: "Balon" },
    { id: "kilogram", name: "Kilogramm" },
    { id: "meter", name: "Metr" },
    { id: "box", name: "Quti" },
    { id: "set", name: "To'plam" },
    { id: "pack", name: "Paket" },
]

export const expiryRowClass = (status: ExpiryStatus) => {
    if (status === "expired")
        return "bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50"
    if (status === "soon")
        return "bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50"
    return ""
}

const ExpiryBadge = ({ p }: { p: OmborProduct }) => {
    if (p.expiry_status === "none" || p.days_to_expiry == null) return null
    const isExpired = p.expiry_status === "expired"
    const isSoon = p.expiry_status === "soon"
    if (!isExpired && !isSoon) return null
    const days = p.days_to_expiry
    const text = isExpired
        ? `Eskirgan: ${Math.abs(days)} kun oldin`
        : `Eskirishga ${days} kun qoldi`
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span
                    className={cn(
                        "inline-flex items-center justify-center w-5 h-5 rounded-full",
                        isExpired
                            ? "text-rose-600 bg-rose-100 dark:bg-rose-900/40"
                            : "text-amber-600 bg-amber-100 dark:bg-amber-900/40",
                    )}
                >
                    <AlertTriangle size={12} />
                </span>
            </TooltipTrigger>
            <TooltipContent>{text}</TooltipContent>
        </Tooltip>
    )
}

export const useOmborCols = (opts: {
    onEdit: (item: OmborProduct) => void
    onDelete: (item: OmborProduct) => void
    onWithdraw: (item: OmborProduct) => void
}) => {
    const { onEdit, onDelete, onWithdraw } = opts
    return useMemo<ColumnDef<OmborProduct>[]>(
        () => [
            {
                header: "Nomi",
                accessorKey: "name",
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <ExpiryBadge p={row.original} />
                        <span>{row.original.name}</span>
                    </div>
                ),
            },
            {
                header: "Birlik",
                accessorKey: "unit_display",
                enableSorting: true,
            },
            {
                header: "Birlik narxi",
                accessorKey: "unit_price",
                enableSorting: true,
                cell: ({ row }) => (
                    <span>{formatMoney(Number(row.original.unit_price))} so'm</span>
                ),
            },
            {
                header: "Miqdori",
                accessorKey: "quantity",
                enableSorting: true,
                cell: ({ row }) => (
                    <span>
                        {formatMoney(Number(row.original.quantity))}{" "}
                        {row.original.unit_display}
                    </span>
                ),
            },
            {
                id: "total",
                header: "Jami summa",
                enableSorting: true,
                accessorFn: (row) =>
                    Number(row.unit_price) * Number(row.quantity),
                cell: ({ row }) => (
                    <span className="font-medium">
                        {formatMoney(
                            Number(row.original.unit_price) *
                                Number(row.original.quantity),
                        )}{" "}
                        so'm
                    </span>
                ),
            },
            {
                header: "Eskirish",
                accessorKey: "expiry_date",
                enableSorting: true,
                cell: ({ row }) => {
                    const d = row.original.expiry_date
                    if (!d) return <span className="text-muted-foreground">—</span>
                    const days = row.original.days_to_expiry
                    return (
                        <div className="flex flex-col">
                            <span>{d}</span>
                            {days != null && (
                                <span
                                    className={cn(
                                        "text-[11px]",
                                        row.original.expiry_status === "expired"
                                            ? "text-rose-600"
                                            : row.original.expiry_status ===
                                                "soon"
                                              ? "text-amber-600"
                                              : "text-muted-foreground",
                                    )}
                                >
                                    {days < 0
                                        ? `${Math.abs(days)} kun o'tdi`
                                        : `${days} kun qoldi`}
                                </span>
                            )}
                        </div>
                    )
                },
            },
            {
                id: "actions",
                header: " ",
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1">
                        <Button
                            icon={
                                <PackageMinus
                                    className="text-orange-600"
                                    size={16}
                                />
                            }
                            size="sm"
                            variant="ghost"
                            className="p-0 h-3"
                            title="Ombordan chiqarish"
                            onClick={(e) => {
                                e.stopPropagation()
                                onWithdraw(row.original)
                            }}
                        />
                        <Button
                            icon={<SquarePen className="text-primary" size={16} />}
                            size="sm"
                            variant="ghost"
                            className="p-0 h-3"
                            onClick={(e) => {
                                e.stopPropagation()
                                onEdit(row.original)
                            }}
                        />
                        <Button
                            icon={<Trash2 className="text-red-500" size={16} />}
                            size="sm"
                            variant="ghost"
                            className="p-0 h-3"
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete(row.original)
                            }}
                        />
                    </div>
                ),
            },
        ],
        [onEdit, onDelete, onWithdraw],
    )
}
