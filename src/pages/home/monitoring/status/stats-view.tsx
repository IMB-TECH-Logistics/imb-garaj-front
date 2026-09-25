import { DataTable } from "@/components/ui/datatable"
import { MONITORING_LOGISTICS_STATS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns"
import { useMemo, useState } from "react"
import { clock, minutes, orderStatusMeta } from "../order-card"
import { IDLE, type VehicleRow } from "./data"

type StatsVehicle = {
    id: number
    truck_number: string
    driver: string | null
    has_gps: boolean
    orders: number
    finished: number
    order_km: number | null
    free_km: number | null
    total_km: number | null
    moving_minutes: number | null
    stop_minutes: number | null
    avg_spent_minutes: number | null
    loaded_known: number
}

type StatsOrder = {
    id: string
    external_id: string
    vehicle: number | null
    truck_number: string | null
    from: string | null
    to: string | null
    status: number
    garage_status: number | null
    started_at: string | null
    loaded_at: string | null
    loaded_at_reliable: boolean | null
    spent_minutes: number | null
    distance_km: number | null
    stop_minutes: number | null
}

type StatsResponse = {
    available: boolean
    synced_at: string | null
    vehicles: StatsVehicle[]
    orders: Omit<StatsOrder, "id">[]
}

const km = (value: number | null) => (value == null ? "—" : `${Math.round(value).toLocaleString("ru-RU")} km`)
const none = <span className="text-muted-foreground">—</span>

function Truck({ value }: { value: string | null }) {
    return <span className="whitespace-nowrap font-mono text-base font-bold tracking-wider">{value ?? "—"}</span>
}

export default function StatsView({ onSelect }: { onSelect: (v: VehicleRow) => void }) {
    const search = useSearch({ strict: false }) as Record<string, string>
    const q = (search.q ?? "").trim().toLowerCase()
    const today = new Date()
    const from = search.from_date ? new Date(search.from_date) : startOfMonth(today)
    const to = search.to_date ? new Date(search.to_date) : endOfMonth(today)
    const [selected, setSelected] = useState<number[]>([])

    const { data, isLoading } = useGet<StatsResponse>(MONITORING_LOGISTICS_STATS, {
        params: { from_date: format(from, "yyyy-MM-dd"), to_date: format(to, "yyyy-MM-dd") },
        options: { staleTime: 60 * 1000 },
    })

    const allVehicles = data?.vehicles ?? []
    const matches = (truck: string | null) => !q || (truck ?? "").toLowerCase().includes(q)
    const vehicles = allVehicles.filter(
        (v) => (!selected.length || selected.includes(v.id)) && (matches(v.truck_number) || (v.driver ?? "").toLowerCase().includes(q)),
    )
    const orders = (data?.orders ?? []).map((o) => ({ ...o, id: o.external_id })).filter(
        (o) => (!selected.length || (o.vehicle != null && selected.includes(o.vehicle))) && matches(o.truck_number),
    )

    const toggle = (id: number) =>
        setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

    const vehicleColumns = useMemo<ColumnDef<StatsVehicle>[]>(
        () => [
            {
                id: "truck_number",
                accessorKey: "truck_number",
                header: "Mashina",
                cell: ({ row }) => (
                    <div>
                        <Truck value={row.original.truck_number} />
                        <div className="text-xs text-muted-foreground">{row.original.driver ?? "—"}</div>
                    </div>
                ),
            },
            { id: "orders", accessorKey: "orders", header: "Buyurtmalar" },
            { id: "order_km", accessorFn: (r) => r.order_km ?? -1, header: "Buyurtmada", cell: ({ row }) => (row.original.has_gps ? km(row.original.order_km) : none) },
            { id: "free_km", accessorFn: (r) => r.free_km ?? -1, header: "Buyurtmasiz", cell: ({ row }) => (row.original.has_gps ? km(row.original.free_km) : none) },
            { id: "moving", accessorFn: (r) => r.moving_minutes ?? -1, header: "Harakatda", cell: ({ row }) => (row.original.has_gps ? minutes(row.original.moving_minutes) : none) },
            { id: "stop", accessorFn: (r) => r.stop_minutes ?? -1, header: "To'xtab turgan", cell: ({ row }) => (row.original.has_gps ? minutes(row.original.stop_minutes) : none) },
            { id: "avg", accessorFn: (r) => r.avg_spent_minutes ?? -1, header: "O'rtacha buyurtma", cell: ({ row }) => minutes(row.original.avg_spent_minutes) },
            { id: "loaded", accessorKey: "loaded_known", header: "Yuklangan vaqti bor", cell: ({ row }) => `${row.original.loaded_known} / ${row.original.orders}` },
        ],
        [],
    )

    const orderColumns = useMemo<ColumnDef<StatsOrder>[]>(
        () => [
            { id: "started_at", accessorFn: (r) => r.started_at ?? "", header: "Sana", cell: ({ row }) => (row.original.started_at ? format(parseISO(row.original.started_at), "dd.MM.yyyy") : "—") },
            { id: "truck", accessorFn: (r) => r.truck_number ?? "", header: "Mashina", cell: ({ row }) => <Truck value={row.original.truck_number} /> },
            { id: "route", accessorFn: (r) => `${r.from ?? ""} ${r.to ?? ""}`, header: "Yo'nalish", cell: ({ row }) => (row.original.from && row.original.to ? `${row.original.from} → ${row.original.to}` : none) },
            { id: "code", accessorKey: "external_id", header: "Kod", cell: ({ row }) => <span className="font-mono text-muted-foreground">#{row.original.external_id}</span> },
            {
                id: "status",
                accessorKey: "status",
                header: "Holat",
                cell: ({ row }) => {
                    const meta = orderStatusMeta(row.original.garage_status)
                    return (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold" style={{ color: meta.color }}>
                            <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                            {meta.label}
                        </span>
                    )
                },
            },
            {
                id: "loaded_at",
                accessorFn: (r) => r.loaded_at ?? "",
                header: "Yuklangan",
                cell: ({ row }) => (
                    <span className={cn("whitespace-nowrap", row.original.loaded_at_reliable === false && "text-amber-500")} title={row.original.loaded_at_reliable === false ? "Holatlar ketma-ket belgilangan, vaqt aniq emas" : undefined}>
                        {clock(row.original.loaded_at)}
                    </span>
                ),
            },
            { id: "spent", accessorFn: (r) => r.spent_minutes ?? -1, header: "Sarflangan vaqt", cell: ({ row }) => minutes(row.original.spent_minutes) },
            { id: "distance", accessorFn: (r) => r.distance_km ?? -1, header: "Masofa", cell: ({ row }) => (row.original.distance_km != null ? `${row.original.distance_km.toFixed(1)} km` : none) },
            { id: "stop", accessorFn: (r) => r.stop_minutes ?? -1, header: "To'xtab turgan", cell: ({ row }) => minutes(row.original.stop_minutes) },
        ],
        [],
    )

    if (data && !data.available) {
        return <p className="py-10 text-center text-sm text-muted-foreground">Bu kompaniya Logistika bilan bog'lanmagan.</p>
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Mashina bo'yicha">
                <span className="mr-1 text-xs text-muted-foreground">Mashina:</span>
                <button
                    type="button"
                    onClick={() => setSelected([])}
                    className={cn(
                        "h-8 rounded-full border px-3 text-xs font-semibold transition",
                        !selected.length ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
                    )}
                >
                    Hammasi
                </button>
                {allVehicles.map((v) => (
                    <button
                        key={v.id}
                        type="button"
                        aria-pressed={selected.includes(v.id)}
                        onClick={() => toggle(v.id)}
                        className={cn(
                            "h-8 rounded-full border px-3 font-mono text-xs font-bold tracking-wider transition",
                            selected.includes(v.id) ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
                        )}
                    >
                        {v.truck_number}
                    </button>
                ))}
                {data?.synced_at && (
                    <span className="ml-auto text-[11px] text-muted-foreground">
                        Logistika bilan sinxron: {format(parseISO(data.synced_at), "dd.MM HH:mm")}
                    </span>
                )}
            </div>

            <section className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Mashinalar bo'yicha</h3>
                <DataTable
                    columns={vehicleColumns}
                    data={vehicles}
                    loading={isLoading}
                    numeration
                    onRowClick={(v) =>
                        onSelect({ id: v.id, truck_number: v.truck_number, driver_name: v.driver ?? "—", type: "—", current_status: IDLE })
                    }
                />
            </section>

            <section className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Buyurtmalar tarixi · {orders.length}</h3>
                <DataTable columns={orderColumns} data={orders} loading={isLoading} numeration />
            </section>
        </div>
    )
}
