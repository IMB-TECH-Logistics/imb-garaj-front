import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { DRIVERS_LIST } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatPhoneNumber } from "@/pages/home/settings/customers/phone-number"
import { formatMoney } from "@/lib/format-money"
import { Button } from "@/components/ui/button"
import { uzApiErrorText } from "@/lib/uz-api-errors"
import { ColumnDef } from "@tanstack/react-table"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

type DriverRow = {
    id: number
    first_name: string
    last_name: string
    full_name: string
    username: string
    phone: string | null
    experience: number
    completed_trips: number
    total_trips: number
    ongoing_trips: number
    completed_orders: number
    total_orders: number
    revenue_uzs: string | number
    revenue_usd: string | number
    salary_paid_uzs: string | number
    total_distance_km: string | number
    total_fuel_liters: string | number
    fuel_per_100km: string | number
    total_fuel_gas?: string | number
    fuel_gas_per_100km?: string | number
    coverage: number
    balance_uzs: string | number
    latest_trip_id: number | null
    latest_trip_end: string | null
    score: string | number
    tier: "A" | "B" | "C" | "D"
}

const num = (v: unknown) => Number(v ?? 0) || 0

const TIER_STYLES: Record<DriverRow["tier"], string> = {
    A: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    B: "bg-primary/10 text-primary border-primary/30",
    C: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    D: "bg-rose-500/15 text-rose-500 border-rose-500/30",
}

const useCols = () =>
    useMemo<ColumnDef<DriverRow>[]>(
        () => [
            {
                header: "Ism",
                accessorKey: "first_name",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="font-medium">
                        {row.original.first_name} {row.original.last_name}
                    </span>
                ),
            },
            {
                header: "Telefon",
                accessorKey: "phone",
                cell: ({ row }) =>
                    formatPhoneNumber(row.original.phone || "—"),
            },
            {
                header: "Tajriba",
                accessorKey: "experience",
                enableSorting: true,
                cell: ({ row }) =>
                    row.original.experience > 0
                        ? `${row.original.experience} yil`
                        : "-",
            },
            {
                header: "Reyslar",
                accessorKey: "completed_trips",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums">
                        {row.original.completed_trips} /{" "}
                        {row.original.total_trips}
                    </span>
                ),
            },
            {
                header: "Yoqilg‘i (100km)",
                accessorKey: "fuel_per_100km",
                enableSorting: true,
                cell: ({ row }) => {
                    const diesel = num(row.original.fuel_per_100km)
                    const gas = num(row.original.fuel_gas_per_100km)
                    if (diesel <= 0 && gas <= 0)
                        return (
                            <span className="text-muted-foreground">—</span>
                        )
                    const tone = (v: number) =>
                        v <= 26
                            ? "text-emerald-500"
                            : v <= 32
                              ? "text-amber-500"
                              : "text-rose-500"
                    return (
                        <span className="tabular-nums font-medium flex flex-col leading-tight">
                            {diesel > 0 && (
                                <span className={tone(diesel)}>
                                    {diesel.toFixed(1)} l
                                </span>
                            )}
                            {gas > 0 && (
                                <span className={tone(gas)}>
                                    {gas.toFixed(1)} m³
                                </span>
                            )}
                        </span>
                    )
                },
            },
            {
                header: "Qamrov (hudud)",
                accessorKey: "coverage",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums">
                        {row.original.coverage}
                    </span>
                ),
            },
            {
                header: "Olib kelgan summa",
                accessorKey: "revenue_uzs",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="tabular-nums font-medium">
                        {formatMoney(num(row.original.revenue_uzs))} so’m
                    </span>
                ),
            },
            {
                header: "Balans",
                accessorKey: "balance_uzs",
                enableSorting: true,
                cell: ({ row }) => {
                    const v = num(row.original.balance_uzs)
                    return (
                        <span
                            className={
                                v < 0
                                    ? "text-red-500 font-medium"
                                    : v > 0
                                      ? "text-green-500 font-medium"
                                      : ""
                            }
                        >
                            {formatMoney(v)} so’m
                        </span>
                    )
                },
            },
            {
                header: "Reyting",
                accessorKey: "score",
                enableSorting: true,
                cell: ({ row }) => (
                    <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-md border text-[11px] font-bold ${TIER_STYLES[row.original.tier]}`}
                    >
                        {row.original.tier}
                    </span>
                ),
            },
        ],
        [],
    )

export default function HaydovchilarList() {
    const navigate = useNavigate()
    const search = useSearch({ strict: false }) as any
    const cols = useCols()

    // OP-01: /users/drivers/list/ backendda juda sekin (dekart ko'paytmali agregat).
    // Cheksiz skeleton o'rniga aniq timeout qo'yamiz va tushunarli xabar ko'rsatamiz.
    const REQUEST_TIMEOUT_MS = 45_000
    const SLOW_HINT_AFTER_MS = 8_000

    const { data, isLoading, isFetching, isError, error, refetch } = useGet<
        DriverRow[]
    >(DRIVERS_LIST, {
        params: { search: search.driver_search },
        config: { timeout: REQUEST_TIMEOUT_MS },
        options: { retry: 0 },
    })

    const [isSlow, setIsSlow] = useState(false)
    useEffect(() => {
        if (!isFetching) {
            setIsSlow(false)
            return
        }
        const t = setTimeout(() => setIsSlow(true), SLOW_HINT_AFTER_MS)
        return () => clearTimeout(t)
    }, [isFetching])

    const rows = data ?? []

    const isTimeout =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.code === "ECONNABORTED" || !(error as any)?.response

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <AlertTriangle className="text-amber-500" size={36} />
                <h2 className="text-lg font-semibold">
                    Haydovchilar ro‘yxatini yuklab bo‘lmadi
                </h2>
                <p className="max-w-md text-sm text-muted-foreground">
                    {isTimeout
                        ? `Server ${REQUEST_TIMEOUT_MS / 1000} soniya ichida javob bermadi. Bu sahifaning ma'lumot so'rovi hozircha juda sekin — muammo serverda hal qilinmoqda.`
                        : uzApiErrorText(error)}
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => refetch()}
                        icon={<RefreshCw size={16} />}
                    >
                        Qayta urinish
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() =>
                            navigate({
                                search: {
                                    ...search,
                                    driver_search: undefined,
                                } as any,
                            })
                        }
                    >
                        Filtrni tozalash
                    </Button>
                </div>
            </div>
        )
    }

    const handleRowClick = (row: DriverRow) => {
        navigate({
            to: "/haydovchilar/$id",
            params: { id: row.id.toString() },
            search: { name: row.full_name } as any,
        })
    }

    return (
        <DataTable
            loading={isLoading}
            columns={cols}
            data={rows}
            numeration
            viewAll
            onRowClick={handleRowClick}
            head={
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-semibold">Haydovchilar</h1>
                        <Badge className="text-sm">{rows.length} ta</Badge>
                        {isLoading && isSlow && (
                            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Loader2 className="animate-spin" size={14} />
                                Ma'lumot yuklanmoqda — bu sahifa hozircha sekin
                                ishlaydi...
                            </span>
                        )}
                    </div>
                </div>
            }
        />
    )
}
