import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

export const  useColumnDestricts = () => {
    return useMemo<ColumnDef<SettingsDistrictType>[]>(
        () => [
            {
                accessorKey: "name",
                header: "Tuman nomi",
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="truncate">
                        {row.original.name || "-"}
                    </div>
                ),
            },
        ],
        [],
    )
}
