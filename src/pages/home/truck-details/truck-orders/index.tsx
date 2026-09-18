import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { MANAGERS_ORDERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { ChevronDown } from "lucide-react"
import * as React from "react"

import ParamPagination from "@/components/as-params/pagination"
import { formatDate } from "@/lib/format-date"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import TruckTripCashflowRow from "../truck-trip-cashflows"

const TruckTripOrderMain = () => {
    const params = useParams({ strict: false })
    const search = useSearch({ strict: false })
    const navigate = useNavigate()
    const page = Number(search.page ?? 1)
    const expandedOrderId = search.order ? Number(search.order) : null

    const { data, isLoading, isError } = useGet<ListResponse<TripOrdersRow>>(
        MANAGERS_ORDERS,
        {
            params: {
                trip: params.id,
                page:search.page,
                page_size:search.page_size
            },
        },
    )

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
                                <TableCell
                                    colSpan={9}
                                    className="text-center py-6 text-destructive"
                                >
                                    Ma‘lumotni yuklab bo‘lmadi. Sahifani
                                    yangilang yoki keyinroq urinib ko‘ring.
                                </TableCell>
                            </TableRow>
                        )}

                        {!isLoading && !isError && !data?.results?.length && (
                            <TableRow className="border-none">
                                <TableCell
                                    colSpan={9}
                                    className="text-center py-6 text-muted-foreground"
                                >
                                    Bu reysda buyurtma yo‘q
                                </TableCell>
                            </TableRow>
                        )}

                        {data?.results?.map((order, index) => {
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
                                                (data.page_size ?? 10) +
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
                                            {(
                                                order.payment_amount_usd ||
                                                order.payment_amount_uzs
                                            ) ?
                                                formatMoney(
                                                    order.payment_amount_usd ||
                                                        order.payment_amount_uzs,
                                                )
                                            :   "—"}
                                        </TableCell>

                                        <TableCell className="border-r border-secondary last:border-none">
                                            {order.payment_amount_usd ?
                                                "USD"
                                            : order.payment_amount_uzs ?
                                                "UZS"
                                            :   "—"}
                                        </TableCell>

                                        <TableCell className="border-r border-secondary last:border-none">
                                            {formatDate(
                                                order.date as string,
                                            ) || "—"}
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

            {!!data?.results?.length && (
                <div className="pt-4 flex justify-center">
                    <ParamPagination
                        totalPages={data?.total_pages}
                        disabled={isLoading}
                    />
                </div>
            )}
        </div>
    )
}

export default TruckTripOrderMain
