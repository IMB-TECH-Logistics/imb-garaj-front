import { Button } from "@/components/ui/button"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { ArrowLeft, Calendar, Truck } from "lucide-react"
import VehicleTrips from "./truck-trips"

function ViewPage() {
    const navigate = useNavigate()
    const search: any = useSearch({ strict: false })

    return (
        <div className="pb-4">
            <div
                className="flex flex-wrap items-center gap-3 mb-4 cursor-pointer"
                onClick={() => navigate({ to: "/truck", search: { from_date: search?.from_date, to_date: search?.to_date } })}
            >
                <Button
                    onClick={(e) => {
                        e.stopPropagation()
                        navigate({ to: "/truck", search: { from_date: search?.from_date, to_date: search?.to_date } })
                    }}
                    className="shrink-0"
                >
                    <ArrowLeft className="h-4" />
                </Button>

                <h1 className="font-bold whitespace-nowrap text-lg sm:text-xl flex items-center gap-2">
                    {search?.truck_type_name || search?.truck_number ? (
                        <>
                            <Truck size={20} className="text-primary hidden sm:block" />
                            {search?.order_count_busy !== undefined && (
                                <span className="text-xs sm:text-sm border py-0.5 px-2 rounded bg-muted font-medium">
                                    {search.order_count_busy} / {search.order_count_empty || 0}
                                </span>
                            )}
                            {search?.truck_type_name} 
                            {search?.truck_number && <span className="text-muted-foreground font-medium">({search?.truck_number})</span>}
                            <span className="hidden sm:inline font-normal"> - Reyslar ma'lumoti</span>
                        </>
                    ) : (
                        "Reyslar ma'lumoti"
                    )}
                </h1>

                <div className="flex-1 flex justify-end items-center gap-2 text-muted-foreground text-xs sm:text-sm font-medium pr-2 sm:pr-4">
                    {search?.from_date && search?.to_date && (
                        <>
                            <Calendar size={14} className="opacity-80" />
                            <span className="tabular-nums">{search.from_date}</span>
                            <span className="opacity-50">—</span>
                            <span className="tabular-nums">{search.to_date}</span>
                        </>
                    )}
                </div>
            </div>

            <VehicleTrips />
        </div>
    )
}

export default ViewPage
