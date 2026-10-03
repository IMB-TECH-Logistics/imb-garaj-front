import ParamDateRange from "@/components/as-params/date-picker-range"
import EmptyBox from "@/components/custom/empty-box"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { VEHICLES } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { ArrowLeft, Truck } from "lucide-react"
import { useTranslation } from "react-i18next"
import VehicleTrips from "./truck-trips"
import ParamTabs from "@/components/as-params/tabs"
import { MonthlyReport, VehicleExpenses } from "@/pages/home/finance/investor-report"

function ViewPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const search: any = useSearch({ strict: false })
    const { id } = useParams({ strict: false }) as { id?: string }
    const canViewVehicle = useHasAction("settings_vehicles_view")
    const { error: vehicleError } = useGet(`${VEHICLES}/${id}`, {
        enabled: !!id && canViewVehicle,
        options: { retry: false },
    })

    const goBack = () =>
        navigate({ to: "/truck", search: { from_date: search?.from_date, to_date: search?.to_date } })

    if (!id || (vehicleError as any)?.response?.status === 404) {
        return (
            <div className="space-y-4 pb-6">
                <Button variant="ghost" onClick={goBack}>
                    <ArrowLeft size={18} />
                    {t("page.back_to_list")}
                </Button>
                <h1 className="text-xl font-semibold">{t("messages.not_found")}</h1>
                <EmptyBox height="h-[50vh]" />
            </div>
        )
    }

    return (
        <div className="pb-4">
            <div
                className="flex flex-wrap items-center gap-3 mb-4"
            >
                <Button
                    onClick={goBack}
                    className="shrink-0"
                >
                    <ArrowLeft className="h-4" />
                </Button>

                <h1 className="font-bold whitespace-nowrap text-lg sm:text-xl flex items-center gap-2">
                    {search?.truck_type_name || search?.truck_number ? (
                        <>
                            <Truck size={20} className="text-primary hidden sm:block" />
                            {search?.order_count_busy !== undefined && (
                                <TooltipProvider delayDuration={150}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="text-xs sm:text-sm border py-0.5 px-2 rounded bg-muted font-medium cursor-default">
                                                {search.order_count_empty || 0} / {search.order_count_busy}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {t("table.trips_ratio")}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            {search?.truck_type_name} 
                            {search?.truck_number && <span className="text-muted-foreground font-medium">({search?.truck_number})</span>}
                            <span className="hidden sm:inline font-normal"> - {t("page.trips")}</span>
                        </>
                    ) : (
                        t("page.trips")
                    )}
                </h1>

                <div className="flex-1 flex justify-end">
                    <ParamDateRange
                        from="from_date"
                        to="to_date"
                        addButtonProps={{
                            className: "!bg-background dark:!bg-secondary min-w-32 justify-start",
                        }}
                    />
                </div>
            </div>

            <ParamTabs
                paramName="truck_tab"
                options={[
                    { value: "trips", label: "Aylanmalar", content: <VehicleTrips /> },
                    { value: "expenses", label: "Mashina xarajatlari", content: <VehicleExpenses vehicleId={id} /> },
                    { value: "monthly", label: "Oylar bo'yicha", content: <MonthlyReport vehicleId={id} /> },
                ]}
            />
        </div>
    )
}

export default ViewPage
