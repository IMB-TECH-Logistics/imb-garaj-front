import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { TRIPS_ORDERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { format } from "date-fns"
import { AlertTriangle, ChevronDown } from "lucide-react"
import * as React from "react"

import ParamPagination from "@/components/as-params/pagination"
import { cn } from "@/lib/utils"
import TruckTripCashflowRow from "../truck-trip-cashflows"

const currencyLabel = (currency: number | null | undefined) =>
    currency === 1 ? "UZS"
    : currency === 2 ? "USD"
    : "—"

/** IN-18: buyurtmaning BARCHA to'lovlarini valyuta bo'yicha jamlaydi. */
const paymentTotals = (order: TripOrdersRow) => {
    const sums = new Map<number | null, number>()
    for (const payment of order.payments ?? []) {
        const amount = Number(payment?.amount ?? 0) || 0
        if (!amount) continue
        const key = payment?.currency ?? null
        sums.set(key, (sums.get(key) ?? 0) + amount)
    }
    return [...sums].map(([currency, amount]) => ({ currency, amount }))
}

const TruckTripOrderMain = () => {
    const params = useParams({ strict: false })
    const search = useSearch({ strict: false })
    const navigate = useNavigate()
    const page = Number(search.page ?? 1)
    const expandedOrderId = search.order ? Number(search.order) : null

    const { data, isLoading, isError, error } = useGet<
        ListResponse<TripOrdersRow>
    >(TRIPS_ORDERS, {
        params: {
            order: params.id,
            page: search.page,
            page_size: search.page_size,
        },
        options: { retry: false },
    })

    // IN-05 / IN-15: `trips/orders` endpointi backendda ro'yxatdan o'tkazilmagan
    // (404). Ilgari sahifa xato haqida hech nima demay bo'sh jadval ko'rsatardi va
    // foydalanuvchi "buyurtma yo'q ekan" deb o'ylardi.
    const status = (error as any)?.response?.status
    const notFound = status === 404
    const rows = data?.results ?? []

    const toggleExpand = (orderId: number) => {
        const isOpen = expandedOrderId === orderId
        navigate({
            search: ((prev: Record<string, unknown>) => ({
                ...prev,
                order: isOpen ? undefined : String(orderId),
            })) as any,
        })
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-end"></div>

            <div className="flex items-center gap-3">
                <h1 className="text-xl">Buyurtmalar ro‘yxati</h1>
            </div>

            {/* TABLE WRAPPER (same as DataTable) */}
            <div className="bg-card rounded-md p-3">
                <Table className="select-text bg-card rounded-md">
                    <TableHeader>
                        <TableRow className="border-none">
                            <TableHead>#</TableHead>
                            <TableHead>Yuklash joyi</TableHead>
                            <TableHead>Tushirish joyi</TableHead>
                            <TableHead>Yuk turi</TableHead>
                            <TableHead>To‘lov miqdori</TableHead>
                            <TableHead>Valyuta</TableHead>
                            <TableHead>Yaratilgan sana</TableHead>
                            <TableHead className="text-right" />
                            <TableHead className="text-right" />
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {isLoading && (
                            <TableRow className="border-none">
                                <TableCell
                                    colSpan={9}
                                    className="text-center py-6"
                                >
                                    Yuklanmoqda...
                                </TableCell>
                            </TableRow>
                        )}

                        {!isLoading && isError && (
                            <TableRow className="border-none">
                                <TableCell colSpan={9} className="py-10">
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <AlertTriangle className="h-6 w-6 text-red-500" />
                                        <p className="font-medium text-red-500">
                                            Buyurtmalar ro'yxatini yuklab bo'lmadi
                                        </p>
                                        <p className="max-w-md text-xs text-muted-foreground">
                                            {notFound ?
                                                "Server bu ma'lumotni bermayapti (404 — endpoint mavjud emas). Bu ma'lumot yo'qligini ANGLATMAYDI; nosozlik haqida administratorga xabar bering."
                                            :   `Server bilan bog'lanishda xatolik${status ? ` (${status})` : ""}. Keyinroq qayta urinib ko'ring.`
                                            }
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}

                        {!isLoading && !isError && rows.length === 0 && (
                            <TableRow className="border-none">
                                <TableCell
                                    colSpan={9}
                                    className="py-10 text-center text-muted-foreground"
                                >
                                    Ma'lumot topilmadi
                                </TableCell>
                            </TableRow>
                        )}

                        {rows.map((order, index) => {
                            const isExpanded = expandedOrderId === order.id

                            return (
                                <React.Fragment key={order.id}>
                                    <TableRow
                                        onClick={() => toggleExpand(order.id)}
                                        className={cn(
                                            "cursor-pointer border-none transition-colors",
                                            "hover:bg-gray-200 dark:hover:bg-secondary",
                                            index % 2 !== 0 &&
                                                "bg-secondary/70",
                                            isExpanded && "bg-secondary",
                                        )}
                                    >
                                        <TableCell className="border-r border-secondary last:border-none">
                                            {(page - 1) *
                                                (data?.page_size ?? 10) +
                                                index +
                                                1}
                                        </TableCell>

                                        <TableCell className="border-r border-secondary last:border-none">
                                            {order.loading_name}
                                        </TableCell>

                                        <TableCell className="border-r border-secondary last:border-none">
                                            {order.unloading_name}
                                        </TableCell>

                                        <TableCell className="border-r border-secondary last:border-none text-muted-foreground">
                                            {order.cargo_type_name ?? "—"}
                                        </TableCell>

                                        <TableCell className="border-r border-secondary last:border-none font-semibold">
                                            {/* IN-18: buyurtma bo'lib-bo'lib to'langan bo'lsa
                                                barcha to'lovlar valyuta bo'yicha jamlanadi */}
                                            {paymentTotals(order).length ?
                                                <div className="flex flex-col">
                                                    {paymentTotals(order).map((p) => (
                                                        <span key={p.currency ?? "none"}>
                                                            {p.amount.toLocaleString("uz-UZ", {
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    ))}
                                                    {(order.payments?.length ?? 0) > 1 && (
                                                        <span className="text-[10px] font-normal text-muted-foreground">
                                                            {order.payments?.length} ta to'lov
                                                        </span>
                                                    )}
                                                </div>
                                            :   "—"}
                                        </TableCell>

                                        <TableCell className="border-r border-secondary last:border-none">
                                            {paymentTotals(order).length ?
                                                <div className="flex flex-col">
                                                    {paymentTotals(order).map((p) => (
                                                        <span key={p.currency ?? "none"}>
                                                            {currencyLabel(p.currency)}
                                                        </span>
                                                    ))}
                                                </div>
                                            :   "—"}
                                        </TableCell>

                                        <TableCell className="border-r border-secondary last:border-none">
                                            {order.created ?
                                                format(
                                                    new Date(order.created),
                                                    "dd.MM.yyyy HH:mm",
                                                )
                                            :   "—"}
                                        </TableCell>

                                        <TableCell
                                            className="border-r border-secondary last:border-none cursor-default p-0 text-right"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Button variant="ghost" size="sm">
                                                <ChevronDown
                                                    className={cn(
                                                        "transition-transform",
                                                        isExpanded &&
                                                            "rotate-180",
                                                    )}
                                                />
                                            </Button>
                                        </TableCell>
                                    </TableRow>

                                    {isExpanded && (
                                        <TableRow className="border-none bg-secondary">
                                            <TableCell
                                                colSpan={9}
                                                className="p-0"
                                            >
                                                <TruckTripCashflowRow />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            <div className="pt-4 flex justify-center">
                <ParamPagination
                    totalPages={data?.total_pages}
                    disabled={isLoading}
                />
            </div>
        </div>
    )
}

export default TruckTripOrderMain
