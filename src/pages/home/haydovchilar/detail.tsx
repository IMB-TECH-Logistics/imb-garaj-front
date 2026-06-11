import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import {
    DRIVERS_OVERVIEW,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { formatPhoneNumber } from "@/pages/home/settings/customers/phone-number"
import { ColumnDef } from "@tanstack/react-table"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { ArrowLeft, Phone } from "lucide-react"
import { useMemo } from "react"

type DriverOverview = {
    id: number
    full_name: string
    first_name: string
    last_name: string
    phone: string | null
    passport_serial: string | null
    pinfl: string | null
    driver_license: string | null
    driver_license_date: string | null
    experience: number
    completed_trips: number
    total_trips: number
    ongoing_trips: number
    completed_orders: number
    total_orders: number
    revenue_uzs: string | number
    revenue_usd: string | number
    salary_paid_uzs: string | number
    computed_balance_uzs: string | number
    total_distance_km: string | number
    total_fuel_liters: string | number
    fuel_per_100km: string | number
    coverage: number
    last_trip: null | {
        id: number
        start: string | null
        end: string | null
        vehicle_plate: string | null
        income_uzs: string | number
        income_usd: string | number
        expense_uzs: string | number
        orders_count: number
    }
}

type DriverTripRow = {
    id: number
    start: string | null
    end: string | null
    loading: string | null
    unloading: string | null
    vehicle_plate: string | null
    start_mileage: number
    end_mileage: number
    orders_count: number
    income_uzs: string | number
    income_usd: string | number
    expense_uzs: string | number
    driver_earnings: string | number
    status: "completed" | "ongoing" | "pending"
}

const num = (v: unknown) => Number(v ?? 0) || 0

function formatMoneyText(n: number): string {
    const negative = n < 0
    // Round doubles to at most two figures after the comma.
    const abs = Math.round(Math.abs(n) * 100) / 100
    const [int, dec] = abs.toString().split(".")
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    return (negative ? "-" : "") + grouped + (dec && Number(dec) > 0 ? `.${dec}` : "")
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

function statusBadge(s: DriverTripRow["status"]) {
    if (s === "completed") return { label: "Yakunlandi", variant: "default" as const }
    if (s === "ongoing") return { label: "Yo'lda", variant: "outline" as const }
    return { label: "Kutilmoqda", variant: "secondary" as const }
}

const useAylanmaCols = () =>
    useMemo<ColumnDef<DriverTripRow>[]>(
        () => [
            {
                header: "Aylanma",
                id: "trip_range",
                cell: ({ row }) => {
                    const s = row.original.start
                    const e = row.original.end
                    if (!s && !e)
                        return <span className="text-muted-foreground">—</span>
                    return (
                        <span className="whitespace-nowrap tabular-nums">
                            {formatDate(s)} → {formatDate(e)}
                        </span>
                    )
                },
            },
            {
                header: "Yo'nalish",
                id: "route",
                cell: ({ row }) => (
                    <span className="block break-words">
                        {row.original.loading || "—"} →{" "}
                        {row.original.unloading || "—"}
                    </span>
                ),
            },
            {
                header: "Avto",
                accessorKey: "vehicle_plate",
                cell: ({ row }) =>
                    row.original.vehicle_plate || (
                        <span className="text-muted-foreground">—</span>
                    ),
            },
            {
                header: "Reyslar",
                accessorKey: "orders_count",
                cell: ({ row }) => (
                    <span className="tabular-nums">
                        {row.original.orders_count}
                    </span>
                ),
            },
            {
                header: "Kirim (UZS)",
                accessorKey: "income_uzs",
                cell: ({ row }) => (
                    <span className="tabular-nums text-green-600">
                        {formatMoney(num(row.original.income_uzs))}
                    </span>
                ),
            },
            {
                header: "Holat",
                id: "status",
                cell: ({ row }) => {
                    const s = statusBadge(row.original.status)
                    return <Badge variant={s.variant}>{s.label}</Badge>
                },
            },
            {
                header: "Haydovchi daromadi",
                accessorKey: "driver_earnings",
                cell: ({ row }) => {
                    const v = num(row.original.driver_earnings)
                    return v > 0 ? (
                        <span className="text-green-500 font-medium whitespace-nowrap">
                            {formatMoney(v)} UZS
                        </span>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    )
                },
            },
        ],
        [],
    )

const StatCard = ({
    label,
    value,
    accent,
}: {
    label: string
    value: React.ReactNode
    accent?: string
}) => (
    <Card>
        <CardContent className="p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {label}
            </div>
            <div className={`text-lg font-semibold tabular-nums ${accent || ""}`}>
                {value}
            </div>
        </CardContent>
    </Card>
)

export default function HaydovchiDetail() {
    const navigate = useNavigate()
    const { id } = useParams({ strict: false }) as { id: string }
    const search = useSearch({ strict: false }) as any
    const driverId = Number(id)

    const { data: overview } = useGet<DriverOverview>(
        `${DRIVERS_OVERVIEW}/${driverId}/overview`,
        { enabled: !!driverId },
    )

    const { data: trips, isLoading: tripsLoading } = useGet<DriverTripRow[]>(
        `${DRIVERS_OVERVIEW}/${driverId}/trips`,
        { enabled: !!driverId },
    )

    const aylanmaCols = useAylanmaCols()

    const handleAylanmaClick = (row: DriverTripRow) => {
        navigate({
            to: "/haydovchilar/$id/aylanma/$tripId",
            params: { id, tripId: String(row.id) },
            search: {
                name: search?.name,
                start: row.start ?? undefined,
                end: row.end ?? undefined,
            } as any,
        })
    }

    const fullName =
        search?.name ||
        (overview ? overview.full_name : "")

    const balance = num(overview?.computed_balance_uzs)
    const balanceColor =
        balance < 0
            ? "text-red-500"
            : balance > 0
              ? "text-green-500"
              : "text-muted-foreground"

    return (
        <div className="space-y-4 pb-6">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate({ to: "/haydovchilar" })}
                    className="shrink-0"
                >
                    <ArrowLeft size={18} />
                </Button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-semibold leading-tight">
                        {fullName || "Haydovchi"}
                    </h1>
                    {overview?.phone && (
                        <a
                            href={`tel:${overview.phone}`}
                            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 mt-0.5"
                        >
                            <Phone size={12} />
                            {formatPhoneNumber(overview.phone)}
                        </a>
                    )}
                </div>
                <div className="text-right shrink-0">
                    <div className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                        Balans
                    </div>
                    <div
                        className={`text-lg font-semibold tabular-nums ${balanceColor}`}
                    >
                        {formatMoneyText(balance)}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                            UZS
                        </span>
                    </div>
                </div>
            </div>

            {overview && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Card>
                        <CardContent className="p-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                                        Aylanmalar
                                    </div>
                                    <div className="text-lg font-semibold tabular-nums">
                                        {`${overview.completed_trips}/${overview.total_trips}`}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                                        Reyslar
                                    </div>
                                    <div className="text-lg font-semibold tabular-nums">
                                        {`${overview.completed_orders}/${overview.total_orders}`}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <StatCard
                        label="Olib kelgan (UZS)"
                        value={formatMoneyText(num(overview.revenue_uzs))}
                        accent="text-green-600"
                    />
                    <StatCard
                        label="Oylik berildi (UZS)"
                        value={formatMoneyText(num(overview.salary_paid_uzs))}
                        accent="text-rose-600"
                    />
                    <StatCard
                        label="Yoqilg'i"
                        value={`${num(overview.fuel_per_100km).toFixed(1)} l/100km`}
                    />
                </div>
            )}

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-medium">Aylanmalar ro'yxati</h3>
                        <Badge>{trips?.length ?? 0}</Badge>
                    </div>
                    <DataTable
                        loading={tripsLoading}
                        columns={aylanmaCols}
                        data={trips ?? []}
                        numeration
                        viewAll
                        onRowClick={handleAylanmaClick}
                        wrapperClassName="p-0 bg-transparent"
                    />
                </CardContent>
            </Card>
        </div>
    )
}
