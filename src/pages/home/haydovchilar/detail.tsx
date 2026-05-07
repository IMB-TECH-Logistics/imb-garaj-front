import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    DRIVERS_BALANCE,
    MANAGERS_DRIVER_SALARY,
    MANAGERS_ORDERS,
    MANAGERS_TRIPS,
    SETTINGS_DRIVERS,
    TRIPS_DRIVER_STATS,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import axiosInstance from "@/services/axios-instance"
import { useQueries } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { ArrowLeft, Calendar, Phone, Receipt, Route, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { useMemo } from "react"
import { formatPhoneNumber } from "@/pages/home/settings/customers/phone-number"

type DriverBalance = { id: number; full_name: string; balance: string }

type DriverStats = {
    income_total: string | number
    total_trips: number
    total_orders: number
}

type OrderIncome = {
    id: number
    payment_type: number | null
    currency: number
    currency_course: string | null
    amount: string
    category: number
}

type OrderRow = {
    id: number
    loading_name: string
    unloading_name: string
    cargo_type_name: string
    date: string
    status: number
    payment_amount_uzs: string | null
    payment_amount_usd: string | null
    incomes: OrderIncome[]
}

type FlatReys = OrderRow & {
    trip_id: number
    trip_index: number
    trip_start: string | null
    trip_end: string | null
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
    trip_id: number
    trip_index: number
}

const STATUS_LABEL: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    0: { label: "Kutilmoqda", variant: "secondary" },
    1: { label: "Boshlandi", variant: "outline" },
    2: { label: "Yo'lda", variant: "outline" },
    3: { label: "Yakunlandi", variant: "default" },
    4: { label: "Bekor qilindi", variant: "destructive" },
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

const useReysCols = () =>
    useMemo<ColumnDef<FlatReys>[]>(
        () => [
            {
                header: "Aylanma",
                accessorKey: "trip_index",
                cell: ({ row }) => (
                    <Badge variant="outline" className="font-mono">
                        #{row.original.trip_index} (ID:{row.original.trip_id})
                    </Badge>
                ),
            },
            {
                header: "Yo'nalish",
                accessorFn: (row) =>
                    `${row.loading_name || "—"} → ${row.unloading_name || "—"}`,
                id: "route",
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
                    const s = STATUS_LABEL[row.original.status]
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
    trip_id: number | null
    trip_index: number | null
    amount: number
    comment?: string | null
    running: number
}

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

    const { data: drivers } = useGet<ListResponse<DriversType>>(
        SETTINGS_DRIVERS,
        { params: { page_size: 1000 } },
    )
    const driver = useMemo(
        () => drivers?.results?.find((d) => d.id === driverId),
        [drivers, driverId],
    )

    const { data: balances } = useGet<DriverBalance[]>(DRIVERS_BALANCE)
    const balance = useMemo(
        () => balances?.find((b) => b.id === driverId)?.balance ?? "0",
        [balances, driverId],
    )

    const { data: driverStats } = useGet<DriverStats>(
        `${TRIPS_DRIVER_STATS}/${driverId}`,
        { enabled: !!driverId },
    )

    const { data: tripsData, isLoading: tripsLoading } = useGet<
        ListResponse<ManagerTrips>
    >(MANAGERS_TRIPS, {
        params: { driver_id: driverId, page_size: 1000 },
        enabled: !!driverId,
    })
    const trips = tripsData?.results ?? []

    // tartiblangan: eng yangi aylanma yuqorida — index 1 dan boshlab
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
                trip_id: r.trip ?? 0,
                trip_index: r.trip != null ? tripIndex.get(r.trip) ?? 0 : 0,
            }))
            .sort((a, b) => (b.created || "").localeCompare(a.created || ""))
    }, [tripsSorted, salaryData])

    const flatReyses = useMemo<FlatReys[]>(() => {
        const out: FlatReys[] = []
        tripsSorted.forEach((t, i) => {
            const q = orderQueries[i]
            const orders = q?.data?.results ?? []
            orders.forEach((o) => {
                out.push({
                    ...o,
                    trip_id: t.id ?? 0,
                    trip_index: i + 1,
                    trip_start: t.start ?? null,
                    trip_end: t.end ?? null,
                })
            })
        })
        return out
    }, [tripsSorted, orderQueries.map((q) => q.dataUpdatedAt).join(",")])

    const reysCols = useReysCols()
    const ledgerCols = useLedgerCols()

    const totals = useMemo(() => {
        let uzs = 0
        let usd = 0
        flatReyses.forEach((r) => {
            uzs += Number(r.payment_amount_uzs ?? 0) || 0
            usd += Number(r.payment_amount_usd ?? 0) || 0
        })
        const tripIncomeUzs = trips.reduce(
            (acc, t) => acc + Number(t.income_uzs ?? 0),
            0,
        )
        const tripIncomeUsd = trips.reduce(
            (acc, t) => acc + Number(t.income_usd ?? 0),
            0,
        )
        const tripExpenseUzs = trips.reduce(
            (acc, t) => acc + Number(t.cash_flow_sum ?? 0),
            0,
        )
        const salaryPaid = flatSalaries.reduce(
            (acc, s) => acc + (Number(s.amount) || 0),
            0,
        )
        return {
            ordersUzs: uzs,
            ordersUsd: usd,
            tripIncomeUzs,
            tripIncomeUsd,
            tripExpenseUzs,
            salaryPaid,
        }
    }, [flatReyses, flatSalaries, trips])

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
                    trip_id: t.id ?? null,
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
                trip_id: s.trip_id,
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
        // Eng yangi tepada ko'rinishi uchun teskariga
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

    const balanceNum = computedBalance

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

            {/* Tabs: Reyslar / Oylik maosh */}
            <Tabs defaultValue="reyslar" className="w-full">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <TabsList>
                        <TabsTrigger value="reyslar" className="flex items-center gap-2">
                            <Receipt size={14} />
                            Reyslar
                        </TabsTrigger>
                        <TabsTrigger value="oylik" className="flex items-center gap-2">
                            <Calendar size={14} />
                            Oylik maosh
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="reyslar" className="mt-4 space-y-4">
                    {/* Stats row */}
                    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            icon={<Route size={16} />}
                            label="Aylanmalar"
                            value={`${driverStats?.total_trips ?? 0}`}
                            suffix="ta"
                        />
                        <StatCard
                            icon={<Receipt size={16} />}
                            label="Reyslar"
                            value={`${driverStats?.total_orders ?? 0}`}
                            suffix="ta"
                        />
                    </div>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-medium">Reyslar ro'yxati</h3>
                                <span className="text-sm font-normal text-muted-foreground">
                                    Jami daromad:{" "}
                                    <span className="text-green-600 font-semibold">
                                        {formatMoney(
                                            Number(
                                                driverStats?.income_total ?? 0,
                                            ),
                                        )}{" "}
                                        UZS
                                    </span>
                                </span>
                            </div>
                            <DataTable
                                loading={tripsLoading || ordersLoading}
                                columns={reysCols}
                                data={flatReyses}
                                numeration
                                viewAll
                                wrapperClassName="p-0 bg-transparent"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="oylik" className="mt-4 space-y-4">
                    {/* Ledger */}
                    <DataTable
                        loading={salaryLoading || tripsLoading}
                        columns={ledgerCols}
                        data={ledger}
                        numeration
                        viewAll
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function SummaryLine({
    label,
    value,
    accent,
}: {
    label: string
    value: string
    accent?: string
}) {
    return (
        <div className="rounded-md border bg-muted/30 px-3 py-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
                {label}
            </div>
            <div className={`font-semibold tabular-nums ${accent ?? ""}`}>{value}</div>
        </div>
    )
}

function SummaryTile({
    icon,
    label,
    value,
    suffix,
    tone,
    accent,
}: {
    icon: React.ReactNode
    label: string
    value: string
    suffix?: string
    tone: "green" | "red" | "neutral"
    accent?: boolean
}) {
    const toneBg =
        tone === "green"
            ? "bg-green-500/10"
            : tone === "red"
              ? "bg-red-500/10"
              : "bg-muted"
    const toneText =
        tone === "green"
            ? "text-green-500"
            : tone === "red"
              ? "text-red-500"
              : "text-muted-foreground"
    return (
        <Card
            className={
                "overflow-hidden " +
                (accent
                    ? tone === "green"
                        ? "bg-green-500/5 border-green-500/20"
                        : tone === "red"
                          ? "bg-red-500/5 border-red-500/20"
                          : ""
                    : "")
            }
        >
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                        {label}
                    </span>
                    <span
                        className={`size-7 rounded-full flex items-center justify-center ${toneBg} ${toneText}`}
                    >
                        {icon}
                    </span>
                </div>
                <div className={`mt-2 text-2xl font-bold tabular-nums ${toneText}`}>
                    {value}
                    {suffix && (
                        <span className="text-sm font-normal text-muted-foreground ml-1.5">
                            {suffix}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function StatCard({
    icon,
    label,
    value,
    suffix,
    extra,
    accent,
}: {
    icon: React.ReactNode
    label: string
    value: React.ReactNode
    suffix?: string
    extra?: React.ReactNode
    accent?: string
}) {
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-4">
                <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs uppercase tracking-wider font-medium">
                        {label}
                    </span>
                    <span className="opacity-70">{icon}</span>
                </div>
                <div className={`mt-2 text-xl font-bold tabular-nums ${accent ?? ""}`}>
                    {value}
                    {suffix && (
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                            {suffix}
                        </span>
                    )}
                </div>
                {extra && (
                    <div className={`text-xs mt-0.5 ${accent ?? "text-muted-foreground"}`}>
                        {extra}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
