import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { CopyButton } from "@/lib/copy-button"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"

type TruckStats = {
    order_id: string
    truck_number: string
    trailer_number: string
    driver_name: string
    distance_km: number
    fuel_per_100km: number
    avg_speed: number
    idle_hours: number
    idle_fuel: number
}



export const TruckTabsFour = () => {
    const { t } = useTranslation()
    const data: TruckStats[] = [
        {
            order_id: "277AH",
            truck_number: "01 369 JKA",
            trailer_number: "40 3994 BA",
            driver_name: "Jahongir Karimov",
            distance_km: 820,
            fuel_per_100km: 28,
            avg_speed: 75,
            idle_hours: 1.5,
            idle_fuel: 9,
        },
        {
            order_id: "912BX",
            truck_number: "10 554 KAA",
            trailer_number: "60 2222 TT",
            driver_name: "Azizbek Sattorov",
            distance_km: 940,
            fuel_per_100km: 30,
            avg_speed: 82,
            idle_hours: 2.1,
            idle_fuel: 11,
        },
        {
            order_id: "523CY",
            truck_number: "25 777 ZAA",
            trailer_number: "40 8888 FA",
            driver_name: "Sardor Akmalov",
            distance_km: 1050,
            fuel_per_100km: 27,
            avg_speed: 78,
            idle_hours: 1.2,
            idle_fuel: 8,
        },
        {
            order_id: "118DF",
            truck_number: "90 123 QAA",
            trailer_number: "70 9999 HA",
            driver_name: "Oybek Normurodov",
            distance_km: 760,
            fuel_per_100km: 29,
            avg_speed: 70,
            idle_hours: 2.8,
            idle_fuel: 13,
        },
        {
            order_id: "879EG",
            truck_number: "80 654 MAA",
            trailer_number: "50 3333 LA",
            driver_name: "Dilmurod Abdug‘afforov",
            distance_km: 980,
            fuel_per_100km: 26,
            avg_speed: 80,
            idle_hours: 1.7,
            idle_fuel: 10,
        },
    ]

    // 25 ta satr yaratamiz
    const allData = Array.from({ length: 25 }, (_, i) => ({
        ...data[i % data.length],
        order_id: data[i % data.length].order_id + "-" + (i + 1),
    }))

    // Umumiy ko‘rsatkichlar
    const totalDistance = allData.reduce((sum, d) => sum + d.distance_km, 0)
    const totalFuel = allData.reduce((sum, d) => sum + d.fuel_per_100km, 0)
    const totalIdleHours = allData.reduce((sum, d) => sum + d.idle_hours, 0)
    const totalIdleFuel = allData.reduce((sum, d) => sum + d.idle_fuel, 0)

    return (
        <div>
            <DataTable
                numeration
                columns={cols(t)}
                data={allData}
                head={
                    <div className="flex items-center gap-3 mb-3">
                        <h1 className="text-xl font-semibold">
                            {t("page.trip_list")}
                        </h1>
                        <Badge className="text-sm">
                            {`${totalDistance} km umumiy masofa`}
                        </Badge>
                    </div>
                }
                paginationProps={{
                    totalPages: 3,
                }}
            />

            <div className="mt-4 bg-muted p-4 rounded-lg text-sm">
                <p>
                    <strong>Umumiy masofa:</strong> {totalDistance} km
                </p>
                <p>
                    <strong>O‘rtacha 100 km uchun sarf:</strong>{" "}
                    {Math.round(totalFuel / allData.length)} litr
                </p>
                <p>
                    <strong>Umumiy zavat holati:</strong>{" "}
                    {totalIdleHours.toFixed(1)} soat
                </p>
                <p>
                    <strong>Zavat paytidagi yoqilg‘i sarfi:</strong>{" "}
                    {formatMoney(totalIdleFuel)} litr
                </p>
            </div>
        </div>
    )
}

const cols = (t: TFunction) => {
    return useMemo<ColumnDef<TruckStats>[]>(
        () => [
            {
                header: t("table.order_id"),
                accessorKey: "order_id",
                enableSorting: true,
                cell: ({ row }) => (
                    <span>{CopyButton(row.original.order_id)}</span>
                ),
            },
            {
                header: t("table.truck_number"),
                accessorKey: "truck_number",
                enableSorting: true,
                cell: ({ row }) => <span>{row.original.truck_number}</span>,
            },
            {
                header: t("form.trailer_number"),
                accessorKey: "trailer_number",
                enableSorting: true,
                cell: ({ row }) => <span>{row.original.trailer_number}</span>,
            },
            {
                header: t("form.driver"),
                accessorKey: "driver_name",
                enableSorting: true,
                cell: ({ row }) => <span>{row.original.driver_name}</span>,
            },
             {
                header: t("form.date"),
                accessorKey: "driver_name",
                enableSorting: true,
                cell: ({ row }) => <span className="whitespace-nowrap">{"2025-14-10"}</span>,
            },
            {
                header: t("table.distance_km"),
                accessorKey: "distance_km",
                cell: ({ row }) => <span>{row.original.distance_km} km</span>,
            },
            {
                header: t("table.fuel_per_km"),
                accessorKey: "fuel_per_100km",
                cell: ({ row }) => (
                    <span>{row.original.fuel_per_100km} litr</span>
                ),
            },
            {
                header: t("table.mileage_km"),
                accessorKey: "avg_speed",
                cell: ({ row }) => (
                    <span>{row.original.avg_speed} km/soat</span>
                ),
            },
            {
                header: t("table.duration"),
                accessorKey: "idle_hours",
                cell: ({ row }) => <span>{row.original.idle_hours} soat</span>,
            },
            {
                header: t("table.fuel_consumption"),
                accessorKey: "idle_fuel",
                cell: ({ row }) => (
                    <span>
                        {row.original.idle_hours} soat /{" "}
                        {row.original.idle_fuel} litr
                    </span>
                ),
            },
        ],
        [t],
    )
}
