import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

export const useColumnsRegionsTable = () => {
    return useMemo<ColumnDef<RegionsType>[]>(
        () => [
            {
                accessorKey: "name",
                header: "Viloyat nomi",
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="">
                        {row.original.name || "-"}
                    </div>
                ),
            },
        ],
        [],
    )
}
