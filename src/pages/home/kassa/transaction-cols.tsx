import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { SortableHeader } from "../sortable-header"

export type Transaction = {
    id: number
    amount: string
    comment: string | null
    executor_name: string
    created: string
    type: number
    currency: number
    currency_course: string | null
    through: string | null
    driver_name: string | null
    vehicle_plate: string | null
    source: string | null
    /** KT-24: bu yozuv ustiga teskari (storno) yozuv bormi. */
    is_reversed?: boolean
    /** Bu yozuvning O'ZI kimningdir storno yozuvi bo'lsa — asl yozuv id si. */
    reversal_of?: number | null
    rejected_comment?: string | null
}

export const useTransactionCols = () => {
    return useMemo<ColumnDef<Transaction>[]>(
        () => [
            {
                header: () => <SortableHeader field="amount" label="Summa" />,
                accessorKey: "amount",
                cell: ({ row }) => (
                    <span>
                        {formatMoney(Number(row.original.amount))}
                        {row.original.currency === 2 ? " USD" : ""}
                    </span>
                ),
            },
            {
                header: "Avtomobil",
                accessorKey: "vehicle_plate",
                cell: ({ row }) => row.original.vehicle_plate || "—",
            },
            {
                header: "Haydovchi",
                accessorKey: "driver_name",
                cell: ({ row }) => row.original.driver_name || "—",
            },
            {
                header: "Manba",
                accessorKey: "source",
                cell: ({ row }) => row.original.source || "—",
            },
            {
                header: () => (
                    <SortableHeader field="executor_name" label="Ma'sul" />
                ),
                accessorKey: "executor_name",
            },
            {
                header: () => <SortableHeader field="created" label="Sana" />,
                accessorKey: "created",
                cell: ({ row }) => {
                    const d = new Date(row.original.created)
                    if (isNaN(d.getTime())) return "-"
                    return d.toLocaleString("uz-UZ", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                    })
                },
            },
            {
                header: "Izoh",
                accessorKey: "comment",
            },
            {
                header: () => <SortableHeader field="type" label="Turi" />,
                accessorKey: "type",
                cell: ({ row }) => (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                            variant={
                                row.original.type === -1
                                    ? "destructive"
                                    : "default"
                            }
                        >
                            {row.original.type === -1 ? "Chiqim" : "Tushum"}
                        </Badge>
                        {/* KT-24: so'ndirilgan va so'ndiruvchi yozuvlar ajralib tursin —
                            aks holda reyestrda ikkita bir xil summa sababsiz turgandek
                            ko'rinadi. */}
                        {row.original.is_reversed && (
                            <Badge
                                variant="outline"
                                className="text-amber-600 border-amber-500/50"
                                title={row.original.rejected_comment ?? undefined}
                            >
                                So'ndirilgan
                            </Badge>
                        )}
                        {row.original.reversal_of ? (
                            <Badge variant="outline" className="text-muted-foreground">
                                Storno #{row.original.reversal_of}
                            </Badge>
                        ) : null}
                    </div>
                ),
            },
        ],
        [],
    )
}
