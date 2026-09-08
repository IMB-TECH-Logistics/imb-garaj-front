import { CopyButton } from "@/lib/copy-button"
import { formatMoney } from "@/lib/format-money"
import { toNum } from "@/lib/utils"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { SortableHeader } from "../sortable-header"

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
    return useMemo<ColumnDef<ReysOrder>[]>(
        () => [
            {
                header: () => (
                    <SortableHeader field="external_id" label="Buyurtma ID" />
                ),
                accessorKey: "external_id",
                size: 140,
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
                header: () => (
                    <SortableHeader field="client_code" label="Firma kodi" />
                ),
                accessorKey: "client_code",
                size: 140,
            },
            {
                header: () => (
                    <SortableHeader field="client_name" label="Firma nomi" />
                ),
                accessorKey: "client_name",
                size: 140,
            },
            {
                header: () => (
                    <SortableHeader field="date" label="Sana" />
                ),
                accessorKey: "date",
                size: 100,
            },
            {
                header: () => (
                    <SortableHeader field="loading_name" label="Yuklash joyi" />
                ),
                accessorKey: "loading_name",
                size: 130,
            },
            {
                header: () => (
                    <SortableHeader field="unloading_name" label="Tushirish joyi" />
                ),
                accessorKey: "unloading_name",
                size: 130,
            },
            {
                header: () => (
                    <SortableHeader field="vehicle_type" label="Avto turi" />
                ),
                accessorKey: "vehicle_type",
                size: 100,
                cell: ({ row }) => (
                    <span className="uppercase">
                        {row.original.vehicle_type || "—"}
                    </span>
                ),
            },
            {
                header: () => (
                    <SortableHeader field="truck_number" label="Davlat raqami" />
                ),
                accessorKey: "truck_number",
                size: 120,
            },
            {
                header: () => (
                    <SortableHeader field="cargo_type_name" label="Yuk turi" />
                ),
                accessorKey: "cargo_type_name",
                size: 110,
            },
            {
                header: () => (
                    <SortableHeader field="summa_s_nds" label="Summa S NDS" />
                ),
                accessorKey: "summa_s_nds",
                size: 130,
                cell: ({ row }) => {
                    const v = toNum(row.original.summa_s_nds)
                    return <span className="font-medium">{formatMoney(v)}</span>
                },
            },
        ],
        [],
    )
}
