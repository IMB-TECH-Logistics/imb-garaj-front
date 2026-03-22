import { Button } from "@/components/ui/button"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { ArrowLeft, Truck } from "lucide-react"
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
                            {search?.truck_type_name} 
                            {search?.truck_number && <span className="text-muted-foreground font-medium">({search?.truck_number})</span>}
                            <span className="hidden sm:inline font-normal"> - Reyslar ma'lumoti</span>
                        </>
                    ) : (
                        "Reyslar ma'lumoti"
                    )}
                </h1>
            </div>

            <VehicleTrips />
        </div>
    )
}

export default ViewPage
