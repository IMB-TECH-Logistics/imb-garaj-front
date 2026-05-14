import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import {
    DRIVERS_BALANCE,
    MANAGERS_DRIVER_SALARY,
    MANAGERS_ORDERS,
    MANAGERS_TRIPS,
    SETTINGS_DRIVERS,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { formatPhoneNumber } from "@/pages/home/settings/customers/phone-number"
import axiosInstance from "@/services/axios-instance"
import { useQueries } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { ArrowLeft, Phone } from "lucide-react"
import { useMemo } from "react"

type DriverBalance = { id: number; full_name: string; balance: string }

type OrderRow = {
    id: number
    payment_amount_uzs: string | null
    payment_amount_usd: string | null
}

type SalaryRow = {
    id: number
    trip: number | null
    amount: string
    comment: string | null
    payment_type_name: string | null
    created: string
    currency: number
    currency_course: string | null
}

type FlatSalary = SalaryRow & {
    trip_index: number
}

type AylanmaRow = ManagerTrips & {
    trip_index: number
    orders_count: number
    driver_earnings: number
}

function formatMoneyText(n: number): string {
    const negative = n < 0
    const abs = Math.abs(n)
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

function tripStatusLabel(t: ManagerTrips):
    | { label: string; variant: "default" | "secondary" | "outline" }
    | null {
    if (t.end) return { label: "Yakunlandi", variant: "default" }
    if (t.start) return { label: "Yo'lda", variant: "outline" }
    return { label: "Kutilmoqda", variant: "secondary" }
}

const useAylanmaCols = () =>
    useMemo<ColumnDef<AylanmaRow>[]>(
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
                header: "Reyslar",
                accessorKey: "orders_count",
                cell: ({ row }) => (
                    <span className="tabular-nums">
                        {row.original.orders_count}
                    </span>
                ),
            },
            {
                header: "Holat",
                id: "status",
                cell: ({ row }) => {
                    const s = tripStatusLabel(row.original)
                    return s ? (
                        <Badge variant={s.variant}>{s.label}</Badge>
                    ) : (
                        "—"
                    )
                },
            },
            {
                header: "Haydovchi daromadi",
                accessorKey: "driver_earnings",
                cell: ({ row }) => {
                    const v = row.original.driver_earnings
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

export default function HaydovchiDetail() {
    const navigate = useNavigate()
    const { id } = useParams({ strict: false }) as { id: string }
    const search = useSearch({ strict: false }) as any
    const driverId = Number(id)


    const { data: drivers } = useGet<ListResponse<DriversType>>(
        SETTINGS_DRIVERS,
        { params: { page_size: 1000 } },
    )
    const driver = useMemo(
        () => drivers?.results?.find((d) => d.id === driverId),
        [drivers, driverId],
    )

    const { data: balances } = useGet<DriverBalance[]>(DRIVERS_BALANCE)
    const apiBalance = useMemo(
        () => balances?.find((b) => b.id === driverId)?.balance ?? "0",
        [balances, driverId],
    )

    const { data: tripsData, isLoading: tripsLoading } = useGet<
        ListResponse<ManagerTrips>
    >(MANAGERS_TRIPS, {
        params: { driver_id: driverId, page_size: 1000 },
        enabled: !!driverId,
    })
    const trips = tripsData?.results ?? []

    // newest first — index 1 at the top
    const tripsSorted = useMemo(
        () =>
            [...trips].sort((a, b) =>
                (b.start || "").localeCompare(a.start || ""),
            ),
        [trips],
    )

    const orderQueries = useQueries({
        queries: tripsSorted.map((t) => ({
            queryKey: [MANAGERS_ORDERS, "reys", t.id],
            queryFn: () =>
                axiosInstance
                    .get(`/${MANAGERS_ORDERS}/`, {
                        params: { trip: t.id, page_size: 1000 },
                    })
                    .then((r) => r.data as ListResponse<OrderRow>),
            enabled: !!t.id,
            staleTime: 1000 * 60,
        })),
    })


    const { data: salaryData } = useGet<
        ListResponse<SalaryRow>
    >(MANAGERS_DRIVER_SALARY, {
        params: { trip__driver: driverId, page_size: 1000 },
        enabled: !!driverId,
    })

    const flatSalaries = useMemo<FlatSalary[]>(() => {
        const tripIndex = new Map<number, number>()
        tripsSorted.forEach((t, i) => {
            if (t.id != null) tripIndex.set(t.id, i + 1)
        })
        const rows = salaryData?.results ?? []
        return [...rows]
            .map((r) => ({
                ...r,
                trip_index: r.trip != null ? tripIndex.get(r.trip) ?? 0 : 0,
            }))
            .sort((a, b) => (b.created || "").localeCompare(a.created || ""))
    }, [tripsSorted, salaryData])

    const aylanmaRows = useMemo<AylanmaRow[]>(() => {
        const salaryByTrip = new Map<number, number>()
        ;(salaryData?.results ?? []).forEach((s) => {
            if (s.trip != null) {
                salaryByTrip.set(
                    s.trip,
                    (salaryByTrip.get(s.trip) ?? 0) +
                        (Number(s.amount) || 0),
                )
            }
        })
        return tripsSorted.map((t, i) => {
            const q = orderQueries[i]
            return {
                ...t,
                trip_index: i + 1,
                orders_count: q?.data?.results?.length ?? 0,
                driver_earnings:
                    t.id != null ? salaryByTrip.get(t.id) ?? 0 : 0,
            }
        })
    }, [
        tripsSorted,
        salaryData,
        orderQueries.map((q) => q.dataUpdatedAt).join(","),
    ])

    const aylanmaCols = useAylanmaCols()

    const handleAylanmaClick = (row: AylanmaRow) => {
        navigate({
            to: "/haydovchilar/$id/aylanma/$tripId",
            params: { id, tripId: String(row.id) },
            search: {
                name: search?.name,
                trip_index: row.trip_index ? String(row.trip_index) : undefined,
                start: row.start ?? undefined,
                end: row.end ?? undefined,
            } as any,
        })
    }

    const totals = useMemo(() => {
        const tripIncomeUzs = trips.reduce(
            (acc, t) => acc + Number(t.income_uzs ?? 0),
            0,
        )
        const salaryPaid = flatSalaries.reduce(
            (acc, s) => acc + (Number(s.amount) || 0),
            0,
        )
        return { tripIncomeUzs, salaryPaid }
    }, [flatSalaries, trips])

    const computedBalance = useMemo(
        () => totals.tripIncomeUzs - totals.salaryPaid,
        [totals.tripIncomeUzs, totals.salaryPaid],
    )

    const fullName =
        search?.name ||
        (driver
            ? `${driver.first_name ?? ""} ${driver.last_name ?? ""}`.trim()
            : "")

    const balanceNum = Number.isFinite(computedBalance)
        ? computedBalance
        : Number(apiBalance ?? 0)
    const balanceColor =
        balanceNum < 0
            ? "text-red-500"
            : balanceNum > 0
              ? "text-green-500"
              : "text-muted-foreground"

    return (
        <div className="space-y-4 pb-6">
            {/* Header */}
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
                    {driver?.driver?.phone && (
                        <a
                            href={`tel:${driver.driver.phone}`}
                            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 mt-0.5"
                        >
                            <Phone size={12} />
                            {formatPhoneNumber(driver.driver.phone)}
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
                        {formatMoneyText(balanceNum)}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                            UZS
                        </span>
                    </div>
                </div>
            </div>

            {/* Aylanmalar table */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-medium">Aylanmalar ro'yxati</h3>
                        <Badge>{aylanmaRows.length}</Badge>
                    </div>
                    <DataTable
                        loading={tripsLoading}
                        columns={aylanmaCols}
                        data={aylanmaRows}
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
