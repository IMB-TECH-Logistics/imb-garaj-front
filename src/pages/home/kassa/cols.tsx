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
                    const value = getValue<string>()
                    if (!value) return <span className="">—</span>

                    const num = Number(value)
                    if (isNaN(num)) return <span className="">{value}</span>

                    return (
                        <div className="min-w-[100px]">
                            {num.toLocaleString("uz-UZ").replace(/,/g, " ")}
                        </div>
                    )
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


