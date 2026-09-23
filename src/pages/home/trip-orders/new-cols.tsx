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
    },

    {
      header: t("form.unloading_location"),
      accessorKey: "unloading_name",
    },

    {
      header: t("form.cargo_type"),
      cell: ({ row }) => row.original.cargo_type_name ?? "—",
    },
    {
      header: t("table.created_at"),
      accessorKey: "date",
      cell: ({ getValue }) => formatDate(getValue<string>()) || "—",
    },



  ], [t])
}