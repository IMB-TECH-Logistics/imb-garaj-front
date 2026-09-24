import { CopyButton } from "@/lib/copy-button"
import { formatMoney } from "@/lib/format-money"
import { toNum } from "@/lib/utils"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export interface ReysOrder {
    id: number
    trip: number
    client: number
    status: number
    type: number
    date: string
    vehicle_type: string | null
    truck_number: string | null
    driver_name: string | null
    loading: number
    unloading: number
    loading_name: string | null
    unloading_name: string | null
    cargo_type: number
    cargo_type_name: string | null
    client_name: string | null
    client_code: string | null
    summa_s_nds: string | number
    naqd_amount: string | number
    pct: number
    our_share: string | number
    external_id: string | number
}

export const useFlightsColumns = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<ReysOrder>[]>(
        () => [
            {
                header: t("table.order_id"),
                accessorKey: "external_id",
                size: 140,
                enableSorting: true,
                cell({ row: { original } }) {
                    return (
                        <div>
                            {original?.external_id ?
                                CopyButton(original?.external_id)
                            :   "-"}
                        </div>
                    )
                },
            },
            {
                header: t("form.company_code"),
                accessorKey: "client_code",
                size: 140,
                enableSorting: true,
            },
            {
                header: t("form.company_name"),
                accessorKey: "client_name",
                size: 140,
                enableSorting: true,
            },
            {
                header: t("form.date"),
                accessorKey: "date",
                size: 100,
                enableSorting: true,
            },
            {
                header: t("form.loading_location"),
                accessorKey: "loading_name",
                size: 130,
                enableSorting: true,
            },
            {
                header: t("form.unloading_location"),
                accessorKey: "unloading_name",
                size: 130,
                enableSorting: true,
            },
            {
                header: t("form.vehicle_type"),
                accessorKey: "vehicle_type",
                size: 100,
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="uppercase">
                        {row.original.vehicle_type || "—"}
                    </span>
                ),
            },
            {
                header: t("table.truck_number"),
                accessorKey: "truck_number",
                size: 120,
                enableSorting: true,
            },
            {
                header: t("form.cargo_type"),
                accessorKey: "cargo_type_name",
                size: 110,
                enableSorting: true,
            },
            {
                header: t("form.amount_with_nds"),
                accessorKey: "summa_s_nds",
                size: 130,
                enableSorting: true,
                cell: ({ row }) => {
                    const v = toNum(row.original.summa_s_nds)
                    return <span className="font-medium">{formatMoney(v)}</span>
                },
            },
        ],
        [t],
    )
}
