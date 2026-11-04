import { format } from "date-fns"
import { DataTable } from "@/components/ui/datatable"
import { OWNER_TRIP_DAILY_STATISTIC } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useParams, useSearch } from "@tanstack/react-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useOrderCols, TripDailyStatisticType } from "./cols"
import ExpenseDialog from "./expense-dialog"

const ORDER_TYPE_EMPTY = 2

const isUnpriced = (row: any) =>
    !row.is_leg && !row.is_residual && !row.is_summary && row.type !== ORDER_TYPE_EMPTY && !(Number(row.income) > 0)

const VehicleTrips = () => {
    const { t } = useTranslation()
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

        const tripFuel = Number(trip.other_fuel) || 0
        const fuelLitres = (Number(trip.orders_fuel_consume) || 0) + (Number(trip.legs_fuel_consume) || 0)
        const spreadFuel = tripFuel > 0 && fuelLitres > 0

        trip.orders_trip?.forEach((order, idx) => {
            const share = spreadFuel ? Math.round((tripFuel * (Number(order.fuel_consume) || 0)) / fuelLitres) : 0
            rows.push({
                ...order,
                expense: (Number(order.expense) || 0) + share,
                fuel_expense: (Number(order.fuel_expense) || 0) + share,
                rest_expense: (Number(order.expense) || 0) - (Number(order.salary_expense) || 0) - (Number(order.fuel_expense) || 0),
            })
            if (idx === 0) {
                minDate = order.date
                maxDate = order.date
            } else {
                if (order.date < minDate) minDate = order.date
                if (order.date > maxDate) maxDate = order.date
            }
        })

        trip.empty_legs?.forEach((leg) => {
            const idlePay = Number(leg.idle_payment) || 0
            if (leg.idle_start) {
                const hours = Math.round((new Date(leg.start).getTime() - new Date(leg.idle_start).getTime()) / 360000) / 10
                rows.push({
                    is_leg: true,
                    id: `idle-${leg.id}`,
                    date: format(new Date(leg.idle_start), "yyyy-MM-dd"),
                    start: leg.idle_start,
                    loading_name: leg.from_place || "—",
                    unloading_name: leg.from_place || "—",
                    client_name: `${t("status.idle_stop")}${hours > 0 ? ` · ${hours} ${t("fleet.hours_short")}` : ""}`,
                    total_mileage: null,
                    fuel_consume: null,
                    income: 0,
                    expense: idlePay,
                    salary_expense: idlePay,
                    fuel_expense: 0,
                    rest_expense: 0,
                })
            }
            const share = spreadFuel ? Math.round((tripFuel * (Number(leg.fuel_consume) || 0)) / fuelLitres) : 0
            const pay = (Number(leg.payment) || 0) + (leg.idle_start ? 0 : idlePay)
            if (!leg.minutes && !Number(leg.km) && !pay && !share) return
            rows.push({
                is_leg: true,
                id: `leg-${leg.id}`,
                date: leg.date,
                start: leg.start,
                loading_name: leg.from_place || "—",
                unloading_name: leg.to_place || "—",
                client_name: t("trips.managers.empty_run"),
                total_mileage: leg.km,
                fuel_consume: leg.fuel_consume,
                income: 0,
                expense: share + pay,
                salary_expense: pay,
                fuel_expense: share,
                rest_expense: 0,
            })
        })
        const sortKey = (r: any) => {
            const dayStart = new Date(`${r.date}T06:00:00`).getTime()
            const at = new Date(r.is_leg ? r.start : r.load_at).getTime()
            if (Number.isNaN(at)) return dayStart
            if (r.is_leg) return at
            const days = (at - dayStart) / 86400000
            return days >= -1.25 && days <= 2.75 ? at : dayStart
        }
        rows.forEach((r) => {
            r._at = sortKey(r)
            if (!r.is_leg && r.load_at && r._at !== new Date(`${r.date}T06:00:00`).getTime()) r.date = format(new Date(r._at), "yyyy-MM-dd")
        })
        rows.sort((x, y) => x._at - y._at)

        const ordersIncome = trip.orders_trip?.reduce((acc: number, val: any) => acc + (Number(val.income) || 0), 0) || 0
        const residualIncome = Number(trip.other_income) || 0
        const residualFuel = spreadFuel ? 0 : tripFuel
        const reysRows = rows.filter((r) => !r.is_leg)
        let unassigned = 0
        trip.other_items?.forEach((item) => {
            const at = new Date(item.at).getTime()
            const amount = Number(item.amount) || 0
            const target = [...reysRows].reverse().find((r) => r._at <= at) ?? reysRows[0]
            if (!target) {
                unassigned += amount
                return
            }
            target.expense = (Number(target.expense) || 0) + amount
            target.rest_expense = (Number(target.rest_expense) || 0) + amount
            target.other_notes = [...(target.other_notes ?? []), { text: item.comment || item.category || "—", amount }]
        })
        const residualSalary = Number(trip.other_salary) || 0
        const residualExpense = residualSalary + residualFuel + unassigned
        const totalIncome = ordersIncome + residualIncome

        if (residualIncome || residualExpense) {
            rows.push({
                is_residual: true,
                id: `residual-${trip.id}`,
                trip_id: trip.id,
                income: residualIncome,
                expense: residualExpense,
                salary_expense: residualSalary,
                fuel_expense: residualFuel,
                rest_expense: unassigned,
            })
        }

        const sumOf = (key: string) => rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0)
        rows.push({
            is_summary: true,
            id: trip.id,
            trip_id: trip.id,
            total_expense: sumOf("expense"),
            salary_expense: sumOf("salary_expense"),
            fuel_expense: sumOf("fuel_expense"),
            rest_expense: sumOf("rest_expense"),
            total_mileage: trip.total_mileage,
            fuel_consume: trip.fuel_consume,
            income: totalIncome,
        })

        return {
            id: trip.id,
            minDate,
            maxDate,
            residualIncome,
            residualExpense,
            start: trip.start,
            end: trip.end,
            hiddenOrderCount: trip.hidden_order_count || 0,
            orderCount: trip.orders_trip?.length || 0,
            rows,
        }
    }).filter((trip) => {
        if (!trip.end) return true
        const summary = trip.rows[trip.rows.length - 1]
        const isEmpty =
            trip.orderCount === 0 &&
            !trip.residualIncome &&
            !trip.residualExpense &&
            !Number(summary?.income) &&
            !Number(summary?.total_expense) &&
            !Number(summary?.total_mileage) &&
            !Number(summary?.fuel_consume)
        return !isEmpty
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
                        {index + 1}. {t("page.turnover_detail")} ({trip.minDate || trip.start || "—"} —{" "}
                        {trip.maxDate || trip.end || t("status.on_road")})
                        {trip.orderCount === 0 && trip.hiddenOrderCount > 0 && (
                            <span className="ml-2 font-normal opacity-70">
                                · {trip.hiddenOrderCount} {t("status.archived")}
                            </span>
                        )}
                    </h3>
                    <DataTable
                        columns={columns as any}
                        data={trip.rows}
                        viewAll
                        rowColor={(row: any) =>
                            row.is_summary ? "!bg-slate-200 dark:!bg-slate-700 hover:!bg-slate-200 dark:hover:!bg-slate-700 [&>td]:!py-1 [&>td]:!h-6"
                            : isUnpriced(row) ? "!bg-amber-100 dark:!bg-amber-900/40 hover:!bg-amber-100 dark:hover:!bg-amber-900/40"
                            : ""}
                    />
                </div>
            ))}
            {!isLoading && trips.length === 0 && (
                <p className="text-center text-muted-foreground py-8">{t("page.not_found")}</p>
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
