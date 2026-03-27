import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

const METHOD_LABELS: Record<number, string> = {
    1: "Naqd",
    2: "Plastik",
    3: "Bank",
}

export const useColumnsPaymentTable = () => {
    return useMemo<ColumnDef<RolesType>[]>(
        () => [
            {
                accessorKey: "name",
                header: "To'lov turi",
                enableSorting: true,
            },
            {
                accessorKey: "method",
                header: "Usul",
                enableSorting: true,
                cell: ({ row }) => {
                    const method = (row.original as any).method as number
                    return (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-muted font-medium">
                            {METHOD_LABELS[method] ?? "—"}
                        </span>
                    )
                },
            },
        ],
        [],
    )
}
