import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

const METHOD_LABELS: Record<number, string> = {
    1: "Naqd",
    2: "Plastik",
    3: "Kassa",
}

export const useColumnsPaymentTable = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<RolesType>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("form.payment_type"),
                enableSorting: true,
            },
            {
                accessorKey: "method",
                header: t("form.method"),
                enableSorting: true,
                cell: ({ row }) => {
                    const method = (row.original as any).method as number
                    return (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-muted font-medium">
                            {METHOD_LABELS[method] ?? "—"}
                        </span>
                    )
                },
            },
        ],
        [t],
    )
}
