import { MONITORING_STATUS_VEHICLES } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { DataTable } from "@/components/ui/datatable"
import { cn } from "@/lib/utils"
import { useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import {
    eachDayOfInterval,
    endOfMonth,
    format,
    startOfMonth,
} from "date-fns"
import { useMemo } from "react"
import {
    ACTIVE_STATUSES,
    type ApiStatusVehicle,
    IDLE,
    STATUS_META,
    type VehicleRow,
} from "./data"

function fmtDur(mins: number): string {
    const total = Math.round(mins)
    const h = Math.floor(total / 60)
    const m = total % 60
    if (h === 0) return `${m}m`
    return m ? `${h}s ${m}m` : `${h}s`
}

type Row = VehicleRow & { totals: Record<number, number> }

export default function VehicleList({
    onSelect,
    onStatusSelect,
}: {
    onSelect: (v: VehicleRow) => void
    onStatusSelect: (v: VehicleRow, status: number) => void
}) {
    const search = useSearch({ strict: false }) as Record<string, string>
    const q = search.q ?? ""
    const today = new Date()
    const from = search.from_date
        ? new Date(search.from_date)
        : startOfMonth(today)
    const to = search.to_date ? new Date(search.to_date) : endOfMonth(today)

    const dayCount = useMemo(() => {
        if (from > to) return 0
        return eachDayOfInterval({ start: from, end: to }).slice(0, 62).length
    }, [from.getTime(), to.getTime()])

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
            .map<Row>((v) => {
                const totals: Record<number, number> = { ...v.totals }
                const active = ACTIVE_STATUSES.reduce(
                    (a, k) => a + (totals[k] ?? 0),
                    0,
                )
                totals[IDLE] = Math.max(0, dayCount * 1440 - active)
                return {
                    id: v.id,
                    truck_number: v.truck_number,
                    driver_name: v.driver_name ?? "—",
                    type: v.type ?? "—",
                    current_status: v.current_status,
                    totals,
                }
            })
            .filter(
                (v) =>
                    !s ||
                    v.truck_number.toLowerCase().includes(s) ||
                    v.driver_name.toLowerCase().includes(s),
            )
    }, [vehicles, q, dayCount])

    const columns = useMemo<ColumnDef<Row>[]>(() => {
        const statusCols: ColumnDef<Row>[] = [...ACTIVE_STATUSES, IDLE].map(
            (k) => {
                const id = `status_${k}`
                return {
                    id,
                    accessorFn: (row) => fmtDur(row.totals[k] ?? 0),
                    enableSorting: true,
                    sortingFn: (a, b) =>
                        (a.original.totals[k] ?? 0) -
                        (b.original.totals[k] ?? 0),
                    header: () => (
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                            <span
                                className={cn(
                                    "h-2.5 w-2.5 rounded-sm",
                                    STATUS_META[k].dot,
                                )}
                            />
                            {STATUS_META[k].label}
                        </span>
                    ),
                    cell: ({ row }) => (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                onStatusSelect(row.original, k)
                            }}
                            className="tabular-nums cursor-pointer rounded px-1.5 py-0.5 hover:bg-muted hover:underline"
                        >
                            {fmtDur(row.original.totals[k] ?? 0)}
                        </button>
                    ),
                }
            },
        )
        return [
            {
                id: "truck_number",
                accessorFn: (row) => row.truck_number,
                enableSorting: true,
                header: "Mashina",
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
                header: "Haydovchi",
                cell: ({ row }) => (
                    <div className="whitespace-nowrap">
                        <div>{row.original.driver_name}</div>
                        <div className="text-xs text-muted-foreground">
                            {row.original.type}
                        </div>
                    </div>
                ),
            },
            ...statusCols,
        ]
    }, [onStatusSelect, rows])

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
