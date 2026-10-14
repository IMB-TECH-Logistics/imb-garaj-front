import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_PETROL_STATIONS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatDate } from "@/lib/format-date"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { useNavigate, useSearch } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import TableHeader from "../table-header"
import { formatQuantity } from "./cashflow-cols"
import type { FuelType } from "./cols"

export const VEHICLE_FUEL = `${SETTINGS_PETROL_STATIONS}/vehicle-fuel`

type VehicleFuelRow = {
    vehicle_plate: string
    fuel_type: FuelType | null
    fills: number
    stations: number
    quantity: string
    amount: string
    last_date: string
}

const FUEL_CLASS: Record<FuelType, string> = {
    methane: "bg-sky-500/10 text-sky-600 border-transparent",
    diesel: "bg-amber-500/10 text-amber-600 border-transparent",
}

export const unitOf = (fuel: FuelType | null) => (fuel === "diesel" ? "liter" : "m3")

export const FuelBadge = ({ fuel }: { fuel: FuelType | null }) => {
    const { t } = useTranslation()
    if (!fuel) return <>—</>
    return (
        <Badge variant="outline" className={cn(FUEL_CLASS[fuel])}>
            {fuel === "diesel" ? t("settings.petrol.tab_diesel") : t("settings.petrol.tab_methane")}
        </Badge>
    )
}

const VehicleFuelTable = () => {
    const { t } = useTranslation()
    const search = useSearch({ strict: false }) as Record<string, any>
    const navigate = useNavigate()

    const { data, isLoading } = useGet<ListResponse<VehicleFuelRow>>(VEHICLE_FUEL, {
        params: {
            search: search.petrol_search,
            page: search.page,
            page_size: search.page_size,
            ordering: search.ordering,
            from_date: search.from_date,
            to_date: search.to_date,
        },
    })

    const columns = useMemo<ColumnDef<VehicleFuelRow>[]>(
        () => [
            {
                accessorKey: "vehicle_plate",
                header: t("form.truck"),
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-medium whitespace-nowrap">{row.original.vehicle_plate}</span>
                ),
            },
            {
                accessorKey: "fuel_type",
                header: t("form.fuel_type"),
                cell: ({ row }) => <FuelBadge fuel={row.original.fuel_type} />,
            },
            {
                accessorKey: "fills",
                header: t("settings.petrol.fills"),
                enableSorting: true,
            },
            {
                accessorKey: "quantity",
                header: t("form.quantity"),
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums whitespace-nowrap text-amber-600">
                        {formatQuantity(Number(row.original.quantity), unitOf(row.original.fuel_type))}
                    </span>
                ),
            },
            {
                accessorKey: "amount",
                header: t("form.amount"),
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums whitespace-nowrap font-medium">
                        {formatMoney(Number(row.original.amount))}
                    </span>
                ),
            },
            {
                accessorKey: "stations",
                header: t("nav.petrol"),
                enableSorting: true,
            },
            {
                accessorKey: "last_date",
                header: t("settings.petrol.last_fill"),
                enableSorting: true,
                cell: ({ row }) => formatDate(row.original.last_date),
            },
        ],
        [t],
    )

    return (
        <>
            <DataTable
                loading={isLoading}
                manualSorting
                columns={columns}
                data={data?.results}
                numeration
                onRowClick={(row) =>
                    navigate({
                        to: "/petrol-stations/vehicle/$plate",
                        params: { plate: row.vehicle_plate },
                        search: { from_date: search.from_date, to_date: search.to_date },
                    } as never)
                }
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                head={
                    <TableHeader
                        fileName={t("settings.petrol.tab_vehicles")}
                        url="excel"
                        searchKey="petrol_search"
                        pageKey="page"
                        count={data?.count}
                    />
                }
            />
        </>
    )
}

export default VehicleFuelTable
