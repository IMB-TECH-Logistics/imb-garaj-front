import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowRight } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

const ACTIVITY_LABELS: Record<number, string> = {
    1: "Reysda",
    2: "Garajda",
    3: "Ta'mirda",
    4: "Bekor turish",
    5: "Navbatda",
}

const ACTIVITY_COLORS: Record<number, string> = {
    1: "bg-green-500/10 text-green-600 border-transparent",
    2: "bg-blue-500/10 text-blue-600 border-transparent",
    3: "bg-orange-500/10 text-orange-600 border-transparent",
    4: "bg-red-500/10 text-red-600 border-transparent",
    5: "bg-yellow-500/10 text-yellow-600 border-transparent",
}

const EMPTY_RUN_COLOR = "bg-slate-500/10 text-slate-600 border-transparent dark:text-slate-300"

const REYS_STAGES: Record<number, { label: string; color: string }> = {
    0: { label: "Reys kutilmoqda", color: "bg-gray-500/10 text-gray-500 border-transparent" },
    1: { label: "Yuklashga ketmoqda", color: "bg-sky-500/10 text-sky-600 border-transparent" },
    5: { label: "Yuklashda", color: "bg-amber-500/10 text-amber-600 border-transparent" },
    6: { label: "Yo'lda", color: "bg-green-500/10 text-green-600 border-transparent" },
    7: { label: "Yuk tushirishda", color: "bg-violet-500/10 text-violet-600 border-transparent" },
    2: { label: "Bo'sh", color: "bg-gray-500/10 text-gray-500 border-transparent" },
    3: { label: "Bo'sh", color: "bg-gray-500/10 text-gray-500 border-transparent" },
}

const pad = (n: number) => String(n).padStart(2, "0")

const formatEta = (d: Date) =>
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`

const ACTIVE_ORDER_STATUSES = [1, 5, 6, 7]

const mockEta = (v: ManagerVehicles) => {
    if (v.order_activity !== 1 || !ACTIVE_ORDER_STATUSES.includes(v.order_status)) return null
    const d = new Date()
    d.setMinutes(0, 0, 0)
    d.setHours(d.getHours() + 4 + ((v.id * 7) % 44))
    return d
}

const MOCK_CITIES = ["Toshkent", "Samarqand", "Buxoro", "Farg'ona", "Andijon", "Navoiy", "Qarshi", "Jizzax", "Namangan", "Termiz"]

const mockPending = (v: ManagerVehicles) => {
    if (v.pending_orders) {
        return { from: v.next_loading_name, to: v.next_unloading_name, count: v.pending_orders }
    }
    if (v.id % 3 === 0) return null
    const from = MOCK_CITIES[v.id % MOCK_CITIES.length]
    const to = MOCK_CITIES[(v.id * 3 + 1) % MOCK_CITIES.length]
    return { from, to: to === from ? MOCK_CITIES[(v.id + 5) % MOCK_CITIES.length] : to, count: (v.id % 4) + 1 }
}

export const useColumnsManagersVehicles = () => {
    const { t } = useTranslation()

    return useMemo<ColumnDef<ManagerVehicles>[]>(
        () => [
            {
                accessorKey: "truck_number",
                header: t("table.truck_number"),
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{row.original.truck_number || "-"}</div>
                ),
            },
            {
                accessorKey: "driver_name",
                header: t("table.driver"),
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{row.original.driver_name || "-"}</div>
                ),
            },
            {
                accessorKey: "order_activity",
                header: t("table.truck_status"),
                enableSorting: true,
                cell: ({ row }) => {
                    const { order_activity: activity, order_type: type, order_status: status } = row.original
                    if (!activity) return <span className="text-muted-foreground">-</span>
                    if (activity === 1) {
                        const stage = REYS_STAGES[status]
                        const emptyRun = type === 2 && ACTIVE_ORDER_STATUSES.includes(status)
                        return (
                            <Badge
                                variant="outline"
                                className={`whitespace-nowrap ${emptyRun ? EMPTY_RUN_COLOR : stage?.color || ""}`}
                            >
                                {emptyRun ? "Bo'sh yurish" : stage?.label || "-"}
                            </Badge>
                        )
                    }
                    return (
                        <Badge variant="outline" className={`whitespace-nowrap ${ACTIVITY_COLORS[activity] || ""}`}>
                            {ACTIVITY_LABELS[activity] || "-"}
                        </Badge>
                    )
                },
            },
            {
                accessorKey: "loading_name",
                header: "Yo'nalish/Joylashuv",
                enableSorting: false,
                cell: ({ row }) => {
                    const { loading_name, unloading_name } = row.original

                    if (loading_name && unloading_name) {
                        return (
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <span>{loading_name}</span>
                                <ArrowRight size={14} className="text-muted-foreground" />
                                <span>{unloading_name}</span>
                            </div>
                        )
                    }

                    return <span className="text-muted-foreground">{loading_name || unloading_name || "-"}</span>
                },
            },
            {
                accessorKey: "eta",
                header: "Taxminiy tugash",
                enableSorting: false,
                cell: ({ row }) => {
                    const d = mockEta(row.original)
                    if (!d) return <span className="text-muted-foreground">-</span>
                    const late = d.getTime() < Date.now()
                    return (
                        <span className={`whitespace-nowrap tabular-nums ${late ? "text-destructive" : ""}`}>
                            ~ {formatEta(d)}
                        </span>
                    )
                },
            },
            {
                accessorKey: "pending_orders",
                header: t("table.pending_trips"),
                enableSorting: true,
                cell: ({ row }) => {
                    const next = mockPending(row.original)
                    if (!next) return <span className="text-muted-foreground">-</span>
                    return (
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span>{next.from || "-"}</span>
                            <ArrowRight size={14} className="text-muted-foreground" />
                            <span>{next.to || "-"}</span>
                            {next.count > 1 && (
                                <Badge variant="outline" className="border-transparent bg-muted text-muted-foreground">
                                    +{next.count - 1}
                                </Badge>
                            )}
                        </div>
                    )
                },
            },
        ],
        [t],
    )
}
