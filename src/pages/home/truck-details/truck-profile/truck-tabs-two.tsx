import ParamTabs from "@/components/as-params/tabs"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"

type TruckStats = {
    zapchast: number
    oil_change: number
    tire_change: number
    repair_cost: number
    other_expenses: number
    payment_type: "Naqt" | "Plastik" | "Perechislenie"
}

export const TruckTabsTwo = () => {
    const { t } = useTranslation()
    const options = [
        { value: "Zapchast", label: t("fleet.tabs.cat_spare") },
        { value: "Moy almashtirish", label: t("fleet.tabs.cat_oil") },
        { value: "Balon almashtirish", label: t("fleet.tabs.cat_tire") },
        { value: "Ta'mirlash (usluga)", label: t("fleet.tabs.cat_repair") },
        { value: "Boshqa xarajatlar", label: t("fleet.tabs.cat_other") },
    ]
    const data: TruckStats[] = [
        {
            zapchast: 450_000,
            oil_change: 300_000,
            tire_change: 700_000,
            repair_cost: 250_000,
            other_expenses: 150_000,
            payment_type: "Naqt",
        },
        {
            zapchast: 500_000,
            oil_change: 280_000,
            tire_change: 800_000,
            repair_cost: 300_000,
            other_expenses: 100_000,
            payment_type: "Perechislenie",
        },
        {
            zapchast: 300_000,
            oil_change: 250_000,
            tire_change: 600_000,
            repair_cost: 200_000,
            other_expenses: 120_000,
            payment_type: "Plastik",
        },
    ]

    const allData = Array.from({ length: 25 }, (_, i) => ({
        ...data[i % data.length],
    }))

    return (
        <div>
            <DataTable
                numeration
                columns={cols(t)}
                data={allData}
                head={
                    <div className="mb-3">
                        <div className="flex items-center gap-3 ">
                            <h1 className="text-xl font-semibold">
                                {t("page.trip_list")}
                            </h1>
                            <Badge className="text-sm">25</Badge>
                        </div>
                        <ParamTabs
                            options={options}
                            paramName="tabs"
                            className="gap-1 mt-2"
                        />
                    </div>
                }
                paginationProps={{
                    totalPages: 3,
                }}
            />
        </div>
    )
}

const cols = (t: TFunction) => {
    return useMemo<ColumnDef<TruckStats>[]>(
        () => [
            {
                header: t("form.date"),
                accessorKey: "zapchast",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatMoney(row.original.zapchast)} {t("page.som")}
                    </span>
                ),
            },
            {
                header: t("table.mileage_km"),
                accessorKey: "oil_change",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatMoney(row.original.oil_change)} {t("page.som")}
                    </span>
                ),
            },
            {
                header: t("form.driver"),
                accessorKey: "tire_change",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatMoney(row.original.tire_change)} {t("page.som")}
                    </span>
                ),
            },
            {
                header: t("form.name"),
                accessorKey: "repair_cost",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatMoney(row.original.repair_cost)} {t("page.som")}
                    </span>
                ),
            },
            {
                header: t("form.license_expiry"),
                accessorKey: "other_expenses",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatMoney(row.original.other_expenses)} {t("page.som")}
                    </span>
                ),
            },

            {
                header: t("form.source"),
                accessorKey: "other_expenses",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatMoney(row.original.other_expenses)} {t("page.som")}
                    </span>
                ),
            },
            {
                header: t("form.unloading_location"),
                accessorKey: "other_expenses",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatMoney(row.original.other_expenses)} {t("page.som")}
                    </span>
                ),
            },
            {
                header: t("form.loading_location"),
                accessorKey: "other_expenses",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatMoney(row.original.other_expenses)}
                    </span>
                ),
            },
            {
                header: t("form.payment_type"),
                accessorKey: "other_expenses",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatMoney(row.original.other_expenses)} {t("page.som")}
                    </span>
                ),
            },
            {
                header: t("form.unit_price"),
                accessorKey: "other_expenses",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatMoney(row.original.other_expenses)} {t("page.som")}
                    </span>
                ),
            },
            {
                header: t("form.quantity"),
                accessorKey: "other_expenses",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatMoney(row.original.other_expenses)} {t("page.som")}
                    </span>
                ),
            },
            {
                header: t("form.total_amount"),
                accessorKey: "other_expenses",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatMoney(row.original.other_expenses)} {t("page.som")}
                    </span>
                ),
            },

            {
                header: t("form.description"),
                accessorKey: "other_expenses",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatMoney(row.original.other_expenses)} {t("page.som")}
                    </span>
                ),
            },
        ],
        [t],
    )
}
