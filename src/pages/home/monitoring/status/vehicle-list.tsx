import { DataTable } from "@/components/ui/datatable"
import { cn } from "@/lib/utils"
import { useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { eachDayOfInterval, endOfMonth, startOfMonth } from "date-fns"
import { useMemo } from "react"
import {
    ACTIVE_STATUSES,
    buildMockTimeline,
    IDLE,
    MOCK_VEHICLES,
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

    const rows = useMemo<Row[]>(() => {
        const s = q.trim().toLowerCase()
        return MOCK_VEHICLES.filter(
            (v) =>
                !s ||
                v.truck_number.toLowerCase().includes(s) ||
                v.driver_name.toLowerCase().includes(s),
        ).map((v) => {
            const segments = buildMockTimeline(v.id, from, to)
            const map: Record<number, number> = {}
            for (const seg of segments) {
                const mins = (seg.end.getTime() - seg.start.getTime()) / 60000
                map[seg.status] = (map[seg.status] ?? 0) + mins
            }
            const active = Object.values(map).reduce((a, b) => a + b, 0)
            map[IDLE] = Math.max(0, dayCount * 1440 - active)
            return { ...v, totals: map }
        })
    }, [q, from.getTime(), to.getTime(), dayCount])

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
