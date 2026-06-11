import ParamDateRange from "@/components/as-params/date-picker-range"
import { DataTable } from "@/components/ui/datatable"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { eachDayOfInterval, endOfMonth, startOfMonth } from "date-fns"
import { Search } from "lucide-react"
import { useMemo, useState } from "react"
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
    const [q, setQ] = useState("")
    const search = useSearch({ strict: false }) as Record<string, string>
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
            (k) => ({
                header: () => (
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span
                            className={cn(
                                "h-2.5 w-2.5 rounded-sm",
                                STATUS_META[k].dot,
                            )}
                        />
                        {STATUS_META[k].label}
                    </div>
                ),
                accessorKey: `status_${k}`,
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
            }),
        )
        return [
            {
                header: "Mashina",
                accessorKey: "truck_number",
                cell: ({ row }) => (
                    <span className="font-medium whitespace-nowrap">
                        {row.original.truck_number}
                    </span>
                ),
            },
            {
                header: "Haydovchi",
                accessorKey: "driver_name",
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
    }, [onStatusSelect])

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative max-w-xs flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Mashina yoki haydovchi..."
                        className="pl-8"
                    />
                </div>
                <ParamDateRange
                    from="from_date"
                    to="to_date"
                    clearable={false}
                    defaultValue={{ from: startOfMonth(today), to: endOfMonth(today) }}
                    addButtonProps={{
                        className:
                            "!bg-muted/50 h-8 text-xs min-w-28 justify-start",
                    }}
                />
            </div>
            <DataTable
                columns={columns}
                data={rows}
                numeration
                onRowClick={(v) => onSelect(v)}
            />
        </div>
    )
}
