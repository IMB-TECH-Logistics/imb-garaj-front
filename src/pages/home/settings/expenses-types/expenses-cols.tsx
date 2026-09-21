import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { EXPENSE_TYPE_OPTIONS, FLOW_TYPE_OPTIONS } from "./add-expenses"

export const useColumnsExpensesTable = () => {
    return useMemo<ColumnDef<VehicleRoleType>[]>(
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
                    const typeValue = row.original.type

                    const typeOption = EXPENSE_TYPE_OPTIONS.find(
                        (option: { value: any }) => option.value === typeValue,
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
                cell: ({ row }) =>
                    FLOW_TYPE_OPTIONS.find(
                        (option) => option.value === row.original.flow_type,
                    )?.label ?? "—",
            },
        ],
        [],
    )
}
