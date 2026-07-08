import { DataTable } from "@/components/ui/datatable"
import { OWNER_TRIP_DAILY_STATISTIC } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useParams, useSearch } from "@tanstack/react-router"
import { useState } from "react"
import { useOrderCols, TripDailyStatisticType } from "./cols"
import ExpenseDialog from "./expense-dialog"

const VehicleTrips = () => {
    const params = useParams({ strict: false })
    const search: any = useSearch({ strict: false })
    const [expenseTrip, setExpenseTrip] = useState<{ id: number; total: number | null } | null>(null)

    const { data, isLoading } = useGet<TripDailyStatisticType[]>(OWNER_TRIP_DAILY_STATISTIC, {
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

        const totalIncome = trip.orders_trip?.reduce((acc: number, val: any) => acc + (Number(val.income) || 0), 0) || 0

        rows.push({
            is_summary: true,
            id: trip.id,
            trip_id: trip.id,
            total_expense: trip.total_expense,
            total_mileage: trip.total_mileage,
            fuel_consume: trip.fuel_consume,
            income: totalIncome,
            cargo_type_name: Array.from(new Set(trip.orders_trip?.map(o => o.cargo_type_name).filter(Boolean))).join(", "),
        })

        return { id: trip.id, minDate, maxDate, rows }
    })

    if (isLoading) {
        return (
            <div className="mt-4">
                <DataTable loading columns={columns as any} data={[]} viewAll />
            </div>
        )
    }

    return (
        <div className="space-y-6 mt-4">
            {trips.map((trip, index) => (
                <div key={trip.id}>
                    <h3 className="text-left text-sm font-semibold text-muted-foreground mb-2">
                        {index + 1}. Aylanma ({trip.minDate || "—"} — {trip.maxDate || "—"})
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
