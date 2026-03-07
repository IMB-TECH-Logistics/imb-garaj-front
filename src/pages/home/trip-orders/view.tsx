import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import TripOrderDetailRow from "./cashfow"
import TripDetailPayment from "./order-payments"
import ParamTabs from "@/components/as-params/tabs"

function ViewPageCashFlows() {



        const options = [
        {
            value: "0",
            label: "Xarajatlar",
            content: <TripOrderDetailRow />,
        },

        {
            value: "6",
            label: "To'lovlar",
            content: <TripDetailPayment/>
        },
    ]



    return (
        <div className=" px-2">
          <ParamTabs options={options} className="gap-1 mt-2" />
        </div>
    )
}

export default ViewPageCashFlows
