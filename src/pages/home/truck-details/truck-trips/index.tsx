import { DataTable } from "@/components/ui/datatable"
import { OWNER_TRIP_DAILY_STATISTIC } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useParams, useSearch } from "@tanstack/react-router"
import { useCostCols, TripDailyStatisticType } from "./cols"

const VehicleTrips = () => {
    const params = useParams({ strict: false })
    const search: any = useSearch({ strict: false })

    const { data, isLoading } = useGet<TripDailyStatisticType[]>(OWNER_TRIP_DAILY_STATISTIC, {
        params: {
            vehicle_id: params.id,
            from_date: search?.from_date,
            to_date: search?.to_date,
        },
    })

    const columns = useCostCols()

    const flattenedData: any[] = []
    data?.forEach(trip => {
        let minDate = "";
        let maxDate = "";

        trip.orders_trip?.forEach((order, idx) => {
            flattenedData.push({ ...order })

            if (idx === 0) {
                minDate = order.date;
                maxDate = order.date;
            } else {
                if (order.date < minDate) minDate = order.date;
                if (order.date > maxDate) maxDate = order.date;
            }
        })
        flattenedData.push({
            is_summary: true,
            id: trip.id,
            start_date: minDate,
            end_date: maxDate,
            total_expense: trip.total_expense,
            total_mileage: trip.total_mileage,
            fuel_consume: trip.fuel_consume,
            income_uzs: trip.orders_trip?.reduce((acc: number, val: any) => acc + (val.income_uzs || 0), 0),
            income_usd: trip.orders_trip?.reduce((acc: number, val: any) => acc + (val.income_usd || 0), 0),
            cargo_type_name: Array.from(new Set(trip.orders_trip?.map(o => o.cargo_type_name).filter(Boolean))).join(", ")
        })
    })

    return (
        <div className="space-y-3 mt-4">
            <DataTable
                loading={isLoading}
                columns={columns as any}
                data={flattenedData}
                viewAll
                rowColor={(row: any) => row.is_summary ? "!bg-yellow-300 dark:!bg-yellow-500 hover:!bg-yellow-300 dark:hover:!bg-yellow-500 [&>td]:!py-1 [&>td]:!h-6" : ""}
            />
        </div>
    )
}

export default VehicleTrips
