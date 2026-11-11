import { Card, CardContent } from "@/components/ui/card"
import { useGet } from "@/hooks/useGet"
import { Truck } from "lucide-react"
import { useTranslation } from "react-i18next"

export const VEHICLE_OWNERS = "kontragent/vehicle-owners"

export type OwnedVehicle = {
    id: number
    vehicle: number
    plate: string
    trailer_number: string | null
    kontragent: number
    kontragent_name: string
}

export const useOwnedVehicles = (kontragent: number) =>
    useGet<OwnedVehicle[]>(VEHICLE_OWNERS, { params: { kontragent } })

export const OwnedVehiclesCard = ({ rows }: { rows: OwnedVehicle[] }) => {
    const { t } = useTranslation()
    return (
        <Card>
            <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex flex-col">
                    <h2 className="text-base font-semibold">
                        {t("contragent.owned.title", { count: rows.length })}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                        {t("contragent.owned.hint")}
                    </span>
                </div>
                <div className="rounded-md border divide-y">
                    {rows.map((r) => (
                        <div
                            key={r.id}
                            className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                        >
                            <span className="flex items-center gap-2 font-medium">
                                <Truck className="w-4 h-4 text-muted-foreground" />
                                {r.plate}
                            </span>
                            <span className="text-muted-foreground">
                                {t("contragent.owned.trailer")}:{" "}
                                {r.trailer_number || "—"}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
