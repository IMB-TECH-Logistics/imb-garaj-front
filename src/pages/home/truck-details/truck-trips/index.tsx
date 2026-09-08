import { DataTable } from "@/components/ui/datatable"
import { OWNER_TRIP_DAILY_STATISTIC } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useParams, useSearch } from "@tanstack/react-router"
import { useState } from "react"
import { useOrderCols, TripDailyStatisticType } from "./cols"
import ExpenseDialog from "./expense-dialog"
import { queryErrorHint, queryErrorMessage } from "@/lib/query-state"

const VehicleTrips = () => {
    const params = useParams({ strict: false })
    const search: any = useSearch({ strict: false })
    const [expenseTrip, setExpenseTrip] = useState<{ id: number; total: number | null } | null>(null)

    const { data, isLoading, isError, error } = useGet<TripDailyStatisticType[]>(OWNER_TRIP_DAILY_STATISTIC, {
        params: {
            vehicle_id: params.id,
            from_date: search?.from_date,
            to_date: search?.to_date,
        },
    })

    const columns = useOrderCols({
        onExpenseClick: (tripId, totalExpense) =>
            setExpenseTrip({ id: tripId, total: totalExpense ?? null }),
    })

    const trips = (data || []).map(trip => {
        let minDate = ""
        let maxDate = ""

        const rows: any[] = []

        trip.orders_trip?.forEach((order, idx) => {
            rows.push({ ...order })
            if (idx === 0) {
                minDate = order.date
                maxDate = order.date
            } else {
                if (order.date < minDate) minDate = order.date
                if (order.date > maxDate) maxDate = order.date
            }
        })

        /* IN-06: Jami tushum SERVERDAN olinadi (`total_income`).
         *
         * Ilgari bu yerda `orders_trip` ustidan `reduce` qilinardi — ya'ni faqat
         * ko'rinadigan buyurtma qatorlari qo'shilardi. Backend esa reys darajasiga
         * to'g'ridan-to'g'ri yozilgan (buyurtmaga bog'lanmagan) kirimni ham
         * sanaydi. Natijada 40 131 DCA uchun ro'yxatda 16 383 000, tafsilotda
         * 11 715 000 chiqar edi — 4 668 000 farq.
         *
         * Umumiy qoida: server hisoblab bergan yig'indi bo'lsa, uni qayta hisoblama.
         * `total_income` kelmasa (eski backend) — eski usulga qaytamiz.
         */
        const rowsIncome =
            trip.orders_trip?.reduce(
                (acc: number, val: any) => acc + (Number(val.income) || 0),
                0,
            ) || 0
        const directIncome = Number(trip.direct_income ?? 0) || 0
        const totalIncome =
            trip.total_income != null ?
                Number(trip.total_income) || 0
            :   rowsIncome + directIncome
        const unassignedExpense = Number(trip.unassigned_expense ?? 0) || 0

        // Jami qatorlar yig'indisidan farq qilsa — farqni ko'rsatuvchi qator
        // qo'shiladi, shunda "Jami" ni qo'lda tekshirib bo'ladi.
        if (directIncome || unassignedExpense) {
            rows.push({
                is_direct: true,
                id: `direct-${trip.id}`,
                income: directIncome,
                expense: unassignedExpense,
            })
        }

        rows.push({
            is_summary: true,
            id: trip.id,
            trip_id: trip.id,
            total_expense: trip.total_expense,
            unassigned_expense: trip.unassigned_expense,
            total_mileage: trip.total_mileage,
            fuel_consume: trip.fuel_consume,
            income: totalIncome,
            cargo_type_name: Array.from(new Set(trip.orders_trip?.map(o => o.cargo_type_name).filter(Boolean))).join(", "),
        })

        const orderCount = trip.orders_trip?.length ?? 0
        const hasAnyValue =
            Number(trip.total_expense ?? 0) !== 0 ||
            Number(trip.total_mileage ?? 0) !== 0 ||
            Number(trip.fuel_consume ?? 0) !== 0 ||
            totalIncome !== 0

        return { id: trip.id, minDate, maxDate, rows, orderCount, hasAnyValue }
    })
        // IN-11: butunlay bo'sh aylanmalar (na qator, na summa) umuman ko'rsatilmaydi —
        // ilgari "2. Aylanma (— — —)" hammasi 0 bo'lgan holda ham chizilardi.
        .filter((trip) => trip.orderCount > 0 || trip.hasAnyValue)

    if (isLoading) {
        return (
            <div className="mt-4">
                <DataTable loading columns={columns as any} data={[]} viewAll />
            </div>
        )
    }

    // YANGI-04: so'rov yiqilganda bo'sh jadval emas, sababi ko'rsatiladi —
    // "aylanma yo'q" bilan "ma'lumot berilmadi" bir xil narsa emas.
    if (isError) {
        return (
            <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
                <p className="font-medium text-amber-600 dark:text-amber-500">
                    {queryErrorMessage(error)}
                </p>
                <p className="text-xs text-muted-foreground">
                    {queryErrorHint(error)}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6 mt-4">
            {trips.map((trip, index) => (
                <div key={trip.id}>
                    <h3 className="text-left text-sm font-semibold text-muted-foreground mb-2">
                        {index + 1}. Aylanma{" "}
                        {trip.orderCount > 0 ?
                            <>({trip.minDate || "—"} — {trip.maxDate || "—"})</>
                        :   // IN-11: qatorsiz, lekin summasi bor guruh — sabab ko'rsatiladi
                            <span
                                className="font-normal text-amber-600 dark:text-amber-500"
                                title="Bu aylanmadagi pul harakatlari hech qanday buyurtmaga bog'lanmagan, shuning uchun qatorlar ro'yxati bo'sh."
                            >
                                (buyurtmaga bog'lanmagan xarajat — qatorlar yo'q)
                            </span>
                        }
                    </h3>
                    <DataTable
                        columns={columns as any}
                        data={trip.rows}
                        viewAll
                        rowColor={(row: any) => row.is_summary ? "!bg-slate-200 dark:!bg-slate-700 hover:!bg-slate-200 dark:hover:!bg-slate-700 [&>td]:!py-1 [&>td]:!h-6" : ""}
                    />
                </div>
            ))}
            {!isLoading && trips.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Ma'lumot topilmadi</p>
            )}

            <ExpenseDialog
                tripId={expenseTrip?.id ?? null}
                totalExpense={expenseTrip?.total ?? null}
                open={expenseTrip !== null}
                onClose={() => setExpenseTrip(null)}
            />
        </div>
    )
}

export default VehicleTrips
