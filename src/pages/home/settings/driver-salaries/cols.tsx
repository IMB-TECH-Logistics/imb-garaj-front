import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
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

export const useDriverSalaryCols = () =>
    useMemo<ColumnDef<DriverSalaryRow>[]>(
        () => [
            {
                header: "Qaerdan",
                accessorKey: "from_region_name",
            },
            {
                header: "Qayerga",
                accessorKey: "to_region_name",
            },
            {
                header: "Joriy summa (UZS)",
                accessorKey: "current_amount",
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
                header: "Amal qila boshlagan",
                accessorKey: "valid_from",
                cell: ({ row }) => row.original.current_amount?.valid_from || "—",
            },
            {
                header: "Tariflar tarixi",
                id: "history",
                cell: ({ row }) => (
                    <span className="tabular-nums text-muted-foreground">
                        {row.original.amounts?.length ?? 0} ta
                    </span>
                ),
            },
        ],
        [],
    )
