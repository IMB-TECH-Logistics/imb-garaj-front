import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

const toNum = (v: string | number | null | undefined): number =>
    Number(v ?? 0) || 0

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
}

export const useAccountingCols = () => {
    return useMemo<ColumnDef<ReysOrder>[]>(
        () => [
            {
                header: "Firma kodi",
                accessorKey: "client_code",
                size: 80,
                enableSorting: true,
            },
            {
                header: "Firma nomi",
                accessorKey: "client_name",
                size: 140,
                enableSorting: true,
            },
            {
                header: "Sana",
                accessorKey: "date",
                size: 100,
                enableSorting: true,
            },
            {
                header: "Yuklash joyi",
                accessorKey: "loading_name",
                size: 130,
                enableSorting: true,
            },
            {
                header: "Tushirish joyi",
                accessorKey: "unloading_name",
                size: 130,
                enableSorting: true,
            },
            {
                header: "Avto turi",
                accessorKey: "vehicle_type",
                size: 100,
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="uppercase">{row.original.vehicle_type || "—"}</span>
                ),
            },
            {
                header: "Davlat raqami",
                accessorKey: "truck_number",
                size: 120,
                enableSorting: true,
            },
            {
                header: "Yuk turi",
                accessorKey: "cargo_type_name",
                size: 110,
                enableSorting: true,
            },
            {
                header: "Summa S NDS",
                accessorKey: "summa_s_nds",
                size: 130,
                enableSorting: true,
                cell: ({ row }) => {
                    const v = toNum(row.original.summa_s_nds)
                    return <span className="font-medium">{formatMoney(v)}</span>
                },
            },
            {
                header: "%",
                accessorKey: "pct",
                size: 60,
                enableSorting: true,
                cell: ({ row }) => <span>{row.original.pct}%</span>,
            },
            {
                header: "Naqd",
                accessorKey: "naqd_amount",
                size: 120,
                enableSorting: true,
                cell: ({ row }) => {
                    const v = toNum(row.original.naqd_amount)
                    return <span className="font-medium text-green-600">{formatMoney(v)}</span>
                },
            },
        ],
        [],
    )
}
