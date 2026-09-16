import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

import { formatDate } from "@/lib/format-date"


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
      accessorKey: "date",
      cell: ({ getValue }) => formatDate(getValue<string>()) || "—",
    },


    
  ], [])
}