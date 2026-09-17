import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

export const useColumnsRolesTable = () => {
    return useMemo<ColumnDef<RolesType>[]>(
        () => [
            {
                accessorKey: "name",
                header: "Rol turi",
                enableSorting: true,
            },
            {
                id: "actions_count",
                header: "Ruxsatlar",
                enableSorting: false,
                cell: ({ row }) => {
                    const count = row.original.actions?.length ?? 0
                    if (!count) {
                        return (
                            <span className="text-muted-foreground">
                                Ruxsat berilmagan
                            </span>
                        )
                    }
                    return (
                        <span className="tabular-nums font-medium">
                            {count} ta
                        </span>
                    )
                },
            },
        ],
        [],
    )
}
