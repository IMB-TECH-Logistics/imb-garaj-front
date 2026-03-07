import ParamTabs from "@/components/as-params/tabs"
import { Button } from "@/components/ui/button"
import { useNavigate } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import HrProfile from "./truck-profile"
import VehicleCashflows from "./truck-profile/truck-cashflows"
import VehicleTrips from "./truck-trips"
import TruckCheck from "./truck-check"

function ViewPage({ data }: { data: Human | undefined }) {
    const navigate = useNavigate()
    const options = [
        {
            value: "1",
            label: "Reyslar",
            content: <VehicleTrips />,
        },

        {
            value: "2",
            label: "Boshqa xarajatlar",
            content: <VehicleCashflows />,
        },
           {
            value: "3",
            label: "Texnik ko'rik",
            content: <TruckCheck />,
        },
    ]

    return (
        <div className="pb-4">
            <div
                className="flex items-center gap-3 mb-4 cursor-pointer"
                onClick={() => navigate({ to: "/truck" })}
            >
                <Button
                    onClick={() => navigate({ to: "/truck" })}
                    className="shrink-0"
                >
                    <ArrowLeft className="h-4" />
                </Button>

                <h1 className="font-bold">Transport ma'lumotlari</h1>
            </div>

            <HrProfile data={data} />
            <ParamTabs options={options} className="gap-1 mt-2" />
        </div>
    )
}

export default ViewPage
