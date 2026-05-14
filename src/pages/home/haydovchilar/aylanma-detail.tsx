import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { MANAGERS_ORDERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { useMemo, useState } from "react"

type OrderRow = {
    id: number
    loading_name: string
    unloading_name: string
    cargo_type_name: string
    date: string
    status: number
    payment_amount_uzs: string | null
    payment_amount_usd: string | null
}

const ORDER_STATUS_LABEL: Record<
    number,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
    0: { label: "Kutilmoqda", variant: "secondary" },
    1: { label: "Boshlandi", variant: "outline" },
    2: { label: "Yo'lda", variant: "outline" },
    3: { label: "Yakunlandi", variant: "default" },
    4: { label: "Bekor qilindi", variant: "destructive" },
}

function formatDate(s?: string | null) {
    if (!s) return "—"
    const d = new Date(s)
    if (isNaN(d.getTime())) return s
    return d.toLocaleDateString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })
}

const useOrderCols = (givenSalaries: Set<number>) =>
    useMemo<ColumnDef<OrderRow>[]>(
        () => [
            {
                header: "Yo'nalish",
                id: "route",
                cell: ({ row }) => (
                    <span className="block break-words">
                        {row.original.loading_name || "—"} →{" "}
                        {row.original.unloading_name || "—"}
                    </span>
                ),
            },
            {
                header: "Sana",
                accessorKey: "date",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatDate(row.original.date)}
                    </span>
                ),
            },
            {
                header: "Yuk turi",
                accessorKey: "cargo_type_name",
                cell: ({ row }) => row.original.cargo_type_name || "—",
            },
            {
                header: "Status",
                accessorKey: "status",
                cell: ({ row }) => {
                    const s = ORDER_STATUS_LABEL[row.original.status]
                    return s ? (
                        <Badge variant={s.variant}>{s.label}</Badge>
                    ) : (
                        "—"
                    )
                },
            },
            {
                header: "Summa (UZS)",
                accessorKey: "payment_amount_uzs",
                cell: ({ row }) => {
                    const v = Number(row.original.payment_amount_uzs ?? 0)
                    return v > 0 ? (
                        <span className="text-green-500 font-medium whitespace-nowrap">
                            {formatMoney(v)}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    )
                },
            },
            {
                header: "Summa (USD)",
                accessorKey: "payment_amount_usd",
                cell: ({ row }) => {
                    const v = Number(row.original.payment_amount_usd ?? 0)
                    return v > 0 ? (
                        <span className="text-green-500 font-medium whitespace-nowrap">
                            {formatMoney(v)}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    )
                },
            },
            {
                header: "Oylik",
                id: "salary_status",
                cell: ({ row }) =>
                    givenSalaries.has(row.original.id) ? (
                        <Badge className="bg-green-500/15 text-green-500 hover:bg-green-500/20">
                            Berildi
                        </Badge>
                    ) : (
                        <Badge className="bg-amber-500/15 text-amber-500 hover:bg-amber-500/20">
                            Berilmadi
                        </Badge>
                    ),
            },
        ],
        [givenSalaries],
    )

export default function AylanmaDetail() {
    const navigate = useNavigate()
    const { id, tripId } = useParams({ strict: false }) as {
        id: string
        tripId: string
    }
    const search = useSearch({ strict: false }) as {
        name?: string
        trip_index?: string
        start?: string
        end?: string
    }

    // Mock state — backend endpoint TBD
    const [givenSalaries, setGivenSalaries] = useState<Set<number>>(new Set())
    const [selectedRows, setSelectedRows] = useState<OrderRow[]>([])

    const { data, isLoading } = useGet<ListResponse<OrderRow>>(MANAGERS_ORDERS, {
        params: { trip: tripId, page_size: 1000 },
        enabled: !!tripId,
    })
    const orders = data?.results ?? []

    const orderCols = useOrderCols(givenSalaries)

    const pendingSelected = selectedRows.filter(
        (r) => !givenSalaries.has(r.id),
    )

    const handleGiveSalary = () => {
        if (pendingSelected.length === 0) return
        setGivenSalaries((prev) => {
            const next = new Set(prev)
            pendingSelected.forEach((r) => next.add(r.id))
            return next
        })
        setSelectedRows([])
    }

    const driverName = search?.name?.trim()
    const dateRange =
        search?.start || search?.end
            ? `${formatDate(search?.start)} → ${formatDate(search?.end)}`
            : null

    return (
        <div className="space-y-4 pb-6">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                        navigate({
                            to: "/haydovchilar/$id",
                            params: { id },
                            search: driverName
                                ? ({ name: driverName } as any)
                                : undefined,
                        })
                    }
                    className="shrink-0"
                >
                    <ArrowLeft size={18} />
                </Button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-semibold leading-tight">
                        Aylanma{" "}
                        {search?.trip_index ? `#${search.trip_index} ` : ""}
                        (ID:{tripId})
                    </h1>
                    <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                        {driverName && <span>{driverName}</span>}
                        {driverName && dateRange && <span>·</span>}
                        {dateRange && (
                            <span className="tabular-nums">{dateRange}</span>
                        )}
                    </div>
                </div>
            </div>

            <DataTable
                loading={isLoading}
                columns={orderCols}
                data={orders}
                numeration
                viewAll
                selecteds_row
                onSelectedRowsChange={setSelectedRows}
                head={
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium">Reyslar</h3>
                            <Badge>{orders.length}</Badge>
                        </div>
                        <Button
                            size="sm"
                            disabled={pendingSelected.length === 0}
                            onClick={handleGiveSalary}
                        >
                            Oylik berish
                            {pendingSelected.length > 0 &&
                                ` (${pendingSelected.length})`}
                        </Button>
                    </div>
                }
            />
        </div>
    )
}
