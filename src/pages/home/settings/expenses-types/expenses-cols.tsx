import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import {
    EXPENSE_FLOW_OPTIONS,
    EXPENSE_TYPE_OPTIONS,
    type ExpenseCategoryType,
} from "./add-expenses"

export const useColumnsExpensesTable = () => {
    return useMemo<ColumnDef<ExpenseCategoryType>[]>(
        () => [
            {
                accessorKey: "name",
                header: "Xarajat nomi",
                enableSorting: true,
            },
            {
                accessorKey: "type",
                header: "Xarajat turi",
                enableSorting: true,
                cell: ({ row }) => {
                    const typeValue = Number(row.original.type)

                    const typeOption = EXPENSE_TYPE_OPTIONS.find(
                        (option) => option.value === typeValue,
                    )

                    return (
                        <span>
                            {typeOption ? typeOption.label : "Noma'lum"}
                        </span>
                    )
                },
            },
            {
                accessorKey: "flow_type",
                header: "Yo'nalishi",
                enableSorting: true,
                cell: ({ row }) => {
                    const flowValue = Number(row.original.flow_type)

                    const flowOption = EXPENSE_FLOW_OPTIONS.find(
                        (option) => option.value === flowValue,
                    )

                    return (
                        <span
                            className={
                                flowOption?.value === 1 ?
                                    "text-emerald-500"
                                :   "text-muted-foreground"
                            }
                        >
                            {flowOption ? flowOption.label : "—"}
                        </span>
                    )
                },
            },
        ],
        [],
    )
}
