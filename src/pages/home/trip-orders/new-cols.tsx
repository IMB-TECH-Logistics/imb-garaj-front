import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { useMemo } from "react"


type Props = {
  page: number
  pageSize?: number
  expandedOrderId: number | null
  toggleExpand: (id: number) => void
  handleEdit: (row: TripOrdersRow, e: React.MouseEvent) => void
  handleDelete: (row: TripOrdersRow, e: React.MouseEvent) => void
}

export const useTripOrdersCols = () => {
      return useMemo<ColumnDef<TripOrdersRow>[]>(() => [
    {
      header: "Yuklash joyi",
      accessorKey: "loading_name",
    },

    {
      header: "Tushirish joyi",
      accessorKey: "unloading_name",
    },

    {
      header: "Yuk turi",
      cell: ({ row }) => row.original.cargo_type_name ?? "—",
    },
    {
      header: "Yaratilgan sana",
      accessorKey: "created",
      cell: ({ getValue }) =>
        getValue<string>()
          ? format(new Date(getValue<string>()), "dd.MM.yyyy HH:mm")
          : "—",
    },


    
  ],)
}