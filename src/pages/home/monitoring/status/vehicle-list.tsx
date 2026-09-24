import { DataTable } from "@/components/ui/datatable"
import { MONITORING_STATUS_VEHICLES } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { endOfMonth, format, startOfMonth } from "date-fns"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { type ApiStatusVehicle, type GpsSummary, type VehicleRow } from "./data"

function fmtDur(mins: number): string {
    const total = Math.round(mins)
    const h = Math.floor(total / 60)
    const m = total % 60
    if (h === 0) return `${m}m`
    return m ? `${h}s ${m}m` : `${h}s`
}

type Row = VehicleRow & { gps: GpsSummary | null }

type GpsColumn = {
    id: string
    header: string
    value: (gps: GpsSummary) => number
    format: (value: number) => string
}

export default function VehicleList({
    onSelect,
}: {
    onSelect: (v: VehicleRow) => void
}) {
    const { t } = useTranslation()
    const search = useSearch({ strict: false }) as Record<string, string>
    const q = search.q ?? ""
    const today = new Date()
    const from =
        search.from_date ? new Date(search.from_date) : startOfMonth(today)
    const to = search.to_date ? new Date(search.to_date) : endOfMonth(today)

    const { data: vehicles = [] } = useGet<ApiStatusVehicle[]>(
        MONITORING_STATUS_VEHICLES,
        {
            params: {
                from_date: format(from, "yyyy-MM-dd"),
                to_date: format(to, "yyyy-MM-dd"),
            },
        },
    )

    const rows = useMemo<Row[]>(() => {
        const s = q.trim().toLowerCase()
        return vehicles
            .map<Row>((v) => ({
                id: v.id,
                truck_number: v.truck_number,
                driver_name: v.driver_name ?? "—",
                type: v.type ?? "—",
                current_status: v.current_status,
                gps: v.gps,
            }))
            .filter(
                (v) =>
                    !s ||
                    v.truck_number.toLowerCase().includes(s) ||
                    v.driver_name.toLowerCase().includes(s),
            )
    }, [vehicles, q])

    const columns = useMemo<ColumnDef<Row>[]>(() => {
        const gpsColumns: GpsColumn[] = [
            {
                id: "distance_km",
                header: t("table.distance_km"),
                value: (gps) => gps.distance_km,
                format: (km) => `${km.toFixed(1)} km`,
            },
            {
                id: "moving_minutes",
                header: t("table.moving_time"),
                value: (gps) => gps.moving_minutes,
                format: fmtDur,
            },
            {
                id: "stop_minutes",
                header: t("table.stop_time"),
                value: (gps) => gps.stop_minutes,
                format: fmtDur,
            },
        ]
        const gpsCols: ColumnDef<Row>[] = gpsColumns.map((col) => ({
            id: col.id,
            accessorFn: (row) => (row.gps ? col.value(row.gps) : -1),
            enableSorting: true,
            header: col.header,
            cell: ({ row }) => (
                <span
                    className={cn(
                        "tabular-nums whitespace-nowrap",
                        !row.original.gps && "text-muted-foreground",
                    )}
                >
                    {row.original.gps ?
                        col.format(col.value(row.original.gps))
                    :   "—"}
                </span>
            ),
        }))
        return [
            {
                id: "truck_number",
                accessorFn: (row) => row.truck_number,
                enableSorting: true,
                header: t("form.truck"),
                cell: ({ row }) => (
                    <span className="font-medium whitespace-nowrap">
                        {row.original.truck_number}
                    </span>
                ),
            },
            {
                id: "driver_name",
                accessorFn: (row) => row.driver_name,
                enableSorting: true,
                header: t("form.driver"),
                cell: ({ row }) => (
                    <div className="whitespace-nowrap">
                        <div>{row.original.driver_name}</div>
                        <div className="text-xs text-muted-foreground">
                            {row.original.type}
                        </div>
                    </div>
                ),
            },
            ...gpsCols,
        ]
    }, [t])

    return (
        <div className="flex flex-col gap-3">
            <DataTable
                columns={columns}
                data={rows}
                numeration
                onRowClick={(v) => onSelect(v)}
            />
        </div>
    )
}
