import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

import { formatDate } from "@/lib/format-date"
import { useTranslation } from "react-i18next"


export const useTripOrdersCols = () => {
    const { t } = useTranslation()
      return useMemo<ColumnDef<TripOrdersRow>[]>(() => [
    {
      header: t("form.loading_location"),
      accessorKey: "loading_name",
      enableSorting: true,
    },

    {
      header: t("form.unloading_location"),
      accessorKey: "unloading_name",
      enableSorting: true,
    },

    {
      header: t("form.cargo_type"),
      accessorKey: "cargo_type_name",
      enableSorting: true,
      cell: ({ row }) => row.original.cargo_type_name ?? "—",
    },
    {
      header: t("table.created_at"),
      accessorKey: "date",
      enableSorting: true,
      cell: ({ getValue }) => formatDate(getValue<string>()) || "—",
    },



  ], [t])
}