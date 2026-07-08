import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { useMemo } from "react"

export const useCostCols = () => {
    return useMemo<ColumnDef<any>[]>(
        () => [
               {
                header: "Summa",
                accessorKey: "amount",
                cell: ({ getValue }) => {
                    const v = Number(getValue<string>() ?? 0) || 0
                    return <span>{formatMoney(v)}</span>
                },
            },
              {
                header: "Ma'sul",
                accessorKey: "owner",
                cell: ({ getValue }) => <span>{getValue<number>()}</span>,
            },
      
         {
                header: "Sana",
                accessorKey: "created",
                enableSorting: true,
                cell: ({ getValue }) => (
                    <span>
                        {getValue<string>() ?
                            format(
                                new Date(getValue<string>()),
                                "dd.MM.yyyy HH:mm",
                            )
                        :   "—"}
                    </span>
                ),
            },
          
         

            {
                header: "Izoh",
                accessorKey: "desc",
                cell: ({ getValue }) => <span>{getValue<number>()}</span>,
            },
      
          
        ],
        [],
    )
}


