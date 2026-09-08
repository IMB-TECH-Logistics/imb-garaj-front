import { DataTable } from "@/components/ui/datatable"
import { ORDER_CASHFLOWS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { Link, useParams } from "@tanstack/react-router"
import { ArrowUpRight } from "lucide-react"
import { useMemo } from "react"
import { useCostCols } from "./cols"

/**
 * Buyurtma xarajatlari — FAQAT KO'RISH oynasi (2-raund, F5-34).
 *
 * Muammo: `/trip/$parentId` da ko'z ikonkasi `add-expenses` oynasini ochar,
 * u yerda esa xarajat QO'SHISH formasi (`AddCashflow`) chizilardi. Forma
 * `childId` route parametrini kutadi, `/trip/498` da esa u yo'q — natijada
 * forma "Xarajatlar mavjud emas" degan matnga tushib qolardi. Ya'ni oyna
 * xarajat ro'yxatini HECH QACHON so'ramagan (tarmoqda `order-cashflows/`
 * umuman ko'rinmasdi) va mavjud xarajat yo'qdek ko'rinardi — masalan
 * 4126-buyurtmadagi 1 120 000 so'mlik "Ta'mirlash".
 *
 * Endi oyna aynan shu buyurtmaning xarajatlarini yuklaydi va jamini ko'rsatadi.
 * Qo'shish/tahrirlash buyurtma tafsiloti sahifasida qoladi — havola beriladi.
 */
const OrderExpenses = ({ orderId }: { orderId?: number }) => {
    const { parentId } = useParams({ strict: false })
    const columns = useCostCols()

    const { data, isLoading, error } = useGet<ListResponse<CashflowRow>>(
        ORDER_CASHFLOWS,
        {
            params: { order: orderId, page: 1, page_size: 1000 },
            enabled: !!orderId,
        },
    )

    const rows = data?.results
    const total = useMemo(
        () =>
            (rows ?? []).reduce(
                (sum, r: any) => sum + (Number(r?.amount) || 0),
                0,
            ),
        [rows],
    )

    if (!orderId) {
        return (
            <div className="text-sm text-muted-foreground">
                Buyurtma tanlanmagan.
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <DataTable
                loading={isLoading}
                error={error}
                columns={columns}
                data={rows}
                numeration
                viewAll
                head={
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        {/* Sarlavha oynaning o'zida bor — bu yerda faqat yig'indi. */}
                        <div className="flex items-center gap-2">
                            {!isLoading && !error && (
                                <span className="text-sm text-muted-foreground">
                                    {data?.count ?? rows?.length ?? 0} ta · jami{" "}
                                    {formatMoney(total)}
                                </span>
                            )}
                        </div>
                        {parentId && (
                            <Link
                                to="/trip/$parentId/$childId"
                                params={{
                                    parentId: String(parentId),
                                    childId: String(orderId),
                                }}
                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                                Batafsil / tahrirlash
                                <ArrowUpRight size={14} />
                            </Link>
                        )}
                    </div>
                }
            />
        </div>
    )
}

export default OrderExpenses
