import Modal from "@/components/custom/modal"
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
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { formatPhoneNumber } from "@/pages/home/settings/customers/phone-number"
import axiosInstance from "@/services/axios-instance"
import { useQueries } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import {
    ArrowLeft,
    Info,
    Phone,
    TrendingDown,
    TrendingUp,
} from "lucide-react"
import { useMemo, useState } from "react"

type DriverBalance = { id: number; full_name: string; balance: string }

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

const useOrderCols = () =>
    useMemo<ColumnDef<OrderRow>[]>(
        () => [
            {
                header: "Yo'nalish",
                id: "route",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {row.original.loading_name || "—"} →{" "}
                        {row.original.unloading_name || "—"}
                    </span>
                ),
            },
            {
                header: "Sana",
                accessorKey: "date",
                cell: ({ row }) => formatDate(row.original.date),
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
        ],
        [],
    )

type LedgerEntry = {
    id: string
    kind: "income" | "salary"
    date: string
    trip_index: number | null
    amount: number
    comment?: string | null
    running: number
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
                    <span className="whitespace-nowrap">
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

const useLedgerCols = () =>
    useMemo<ColumnDef<LedgerEntry>[]>(
        () => [
            {
                header: "Sana",
                accessorKey: "date",
                cell: ({ row }) => (
                    <span className="text-muted-foreground whitespace-nowrap">
                        {formatDate(row.original.date)}
                    </span>
                ),
            },
            {
                header: "Aylanma",
                accessorKey: "trip_index",
                cell: ({ row }) =>
                    row.original.trip_index ? (
                        <Badge variant="outline" className="font-mono text-xs">
                            #{row.original.trip_index}
                        </Badge>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    ),
            },
            {
                header: "Operatsiya",
                id: "operation",
                cell: ({ row }) => {
                    const e = row.original
                    return e.kind === "income" ? (
                        <span className="inline-flex items-center gap-1.5">
                            <span className="size-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                                <TrendingUp size={12} />
                            </span>
                            <span className="font-medium">Reys daromadi</span>
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5">
                            <span className="size-6 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                                <TrendingDown size={12} />
                            </span>
                            <span className="font-medium">Oylik</span>
                            {e.comment && (
                                <span className="text-muted-foreground text-xs">
                                    · {e.comment}
                                </span>
                            )}
                        </span>
                    )
                },
            },
            {
                header: "Summa",
                accessorKey: "amount",
                cell: ({ row }) => {
                    const a = row.original.amount
                    return (
                        <span
                            className={
                                "tabular-nums whitespace-nowrap font-semibold " +
                                (a >= 0 ? "text-green-500" : "text-red-500")
                            }
                        >
                            {a >= 0 ? "+" : ""}
                            {formatMoneyText(a)}
                        </span>
                    )
                },
            },
            {
                header: "Balans",
                accessorKey: "running",
                cell: ({ row }) => {
                    const r = row.original.running
                    return (
                        <span
                            className={
                                "tabular-nums whitespace-nowrap font-bold " +
                                (r < 0
                                    ? "text-red-500"
                                    : r > 0
                                      ? "text-foreground"
                                      : "text-muted-foreground")
                            }
                        >
                            {formatMoneyText(r)}
                        </span>
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

    const { openModal: openSalaryModal } = useModal("driver-salary-history")
    const { openModal: openOrdersModal } = useModal("aylanma-orders")
    const [selectedTripIdx, setSelectedTripIdx] = useState<number | null>(null)

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

    const ordersLoading = orderQueries.some((q) => q.isLoading)

    const { data: salaryData, isLoading: salaryLoading } = useGet<
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
    const ledgerCols = useLedgerCols()
    const orderCols = useOrderCols()

    const selectedTrip =
        selectedTripIdx != null ? aylanmaRows[selectedTripIdx] : null
    const selectedOrders =
        selectedTripIdx != null
            ? orderQueries[selectedTripIdx]?.data?.results ?? []
            : []
    const selectedOrdersLoading =
        selectedTripIdx != null
            ? orderQueries[selectedTripIdx]?.isLoading ?? false
            : false

    const handleAylanmaClick = (row: AylanmaRow) => {
        const idx = aylanmaRows.findIndex((r) => r.id === row.id)
        if (idx >= 0) {
            setSelectedTripIdx(idx)
            openOrdersModal()
        }
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

    // Reys daromadi va oyliklarni xronologik tartibda birlashtirib, har bir
    // qadamdan keyingi balansni hisoblaymiz. Balans = jami daromad − jami oylik.
    const ledger = useMemo<LedgerEntry[]>(() => {
        const events: Omit<LedgerEntry, "running">[] = []
        tripsSorted.forEach((t, i) => {
            const incomeUzs = Number(t.income_uzs ?? 0) || 0
            if (incomeUzs > 0) {
                events.push({
                    id: `trip-${t.id}`,
                    kind: "income",
                    date: t.end || t.start || "",
                    trip_index: i + 1,
                    amount: incomeUzs,
                    comment: "Reys daromadi",
                })
            }
        })
        flatSalaries.forEach((s) => {
            events.push({
                id: `salary-${s.id}`,
                kind: "salary",
                date: s.created || "",
                trip_index: s.trip_index,
                amount: -(Number(s.amount) || 0),
                comment: s.comment,
            })
        })
        events.sort((a, b) => (a.date || "").localeCompare(b.date || ""))
        let running = 0
        const withRunning: LedgerEntry[] = events.map((e) => {
            running += e.amount
            return { ...e, running }
        })
        return withRunning.reverse()
    }, [tripsSorted, flatSalaries])

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

    const lastTrip = tripsSorted[0]
    const lastStatus = lastTrip ? tripStatusLabel(lastTrip) : null
    const lastDate = lastTrip?.end || lastTrip?.start || null

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
                <div>
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
            </div>

            {/* Top cards: Balans + Ohirgi holati */}
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                <Card className="relative overflow-hidden">
                    <button
                        type="button"
                        onClick={() => openSalaryModal()}
                        className="absolute top-2 right-2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
                        aria-label="Oyliklar tarixi"
                        title="Oyliklar tarixi"
                    >
                        <Info size={14} />
                    </button>
                    <CardContent className="p-4">
                        <div className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                            Haydovchi balansi
                        </div>
                        <div
                            className={`mt-2 text-2xl font-bold tabular-nums ${balanceColor}`}
                        >
                            {formatMoneyText(balanceNum)}
                            <span className="text-sm font-normal text-muted-foreground ml-1.5">
                                UZS
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <CardContent className="p-4">
                        <div className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                            Ohirgi holati
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            {lastStatus ? (
                                <Badge variant={lastStatus.variant}>
                                    {lastStatus.label}
                                </Badge>
                            ) : (
                                <span className="text-muted-foreground">
                                    Aylanmalar yo'q
                                </span>
                            )}
                            {lastDate && (
                                <span className="text-sm text-muted-foreground tabular-nums">
                                    {formatDate(lastDate)}
                                </span>
                            )}
                        </div>
                        {lastTrip && (lastTrip.loading || lastTrip.unloading) && (
                            <div className="mt-1 text-sm text-muted-foreground whitespace-nowrap truncate">
                                {lastTrip.loading || "—"} →{" "}
                                {lastTrip.unloading || "—"}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Aylanmalar table */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">Aylanmalar ro'yxati</h3>
                        <span className="text-sm font-normal text-muted-foreground">
                            Jami daromad:{" "}
                            <span className="text-green-600 font-semibold">
                                {formatMoney(totals.tripIncomeUzs)} UZS
                            </span>
                        </span>
                    </div>
                    <DataTable
                        loading={tripsLoading || ordersLoading}
                        columns={aylanmaCols}
                        data={aylanmaRows}
                        numeration
                        viewAll
                        onRowClick={handleAylanmaClick}
                        wrapperClassName="p-0 bg-transparent"
                    />
                </CardContent>
            </Card>

            <Modal
                modalKey="driver-salary-history"
                size="max-w-3xl"
                title="Oyliklar tarixi"
            >
                <DataTable
                    loading={salaryLoading || tripsLoading}
                    columns={ledgerCols}
                    data={ledger}
                    numeration
                    viewAll
                />
            </Modal>

            <Modal
                modalKey="aylanma-orders"
                size="max-w-4xl"
                title={
                    selectedTrip
                        ? `Reyslar — Aylanma #${selectedTrip.trip_index} (ID:${selectedTrip.id})`
                        : "Reyslar"
                }
                onClose={() => setSelectedTripIdx(null)}
            >
                <DataTable
                    loading={selectedOrdersLoading}
                    columns={orderCols}
                    data={selectedOrders}
                    numeration
                    viewAll
                />
            </Modal>
        </div>
    )
}
