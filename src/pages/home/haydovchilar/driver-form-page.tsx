import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SETTINGS_DRIVERS } from "@/constants/api-endpoints"
import { getRequest } from "@/hooks/useGet"
import { DriverForm } from "@/pages/home/settings/driver/add-driver"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function DriverFormPage({
    driverId,
    onBack,
    onSaved,
}: {
    driverId?: number
    onBack: () => void
    onSaved: (id: number) => void
}) {
    const { t } = useTranslation()
    const { data, isLoading } = useQuery<DriversType>({
        queryKey: [SETTINGS_DRIVERS, "form", driverId],
        queryFn: () => getRequest(`${SETTINGS_DRIVERS}/${driverId}`),
        enabled: !!driverId,
        staleTime: 0,
        gcTime: 0,
    })
    return (
        <div className="space-y-3 pb-6">
            <div className="flex items-center gap-3">
                <Button variant="default" size="icon" onClick={onBack} className="shrink-0">
                    <ArrowLeft size={18} />
                </Button>
                <h1 className="text-xl font-semibold">
                    {driverId ? t("form.edit_driver") : t("form.add_driver")}
                </h1>
            </div>
            <Card>
                <CardContent className="p-4">
                    {driverId && isLoading ?
                        <p className="py-10 text-center text-muted-foreground">{t("messages.loading")}</p>
                    :   <DriverForm
                            key={data?.id ?? "new"}
                            currentDriver={driverId ? data : null}
                            onDone={(saved) => onSaved(saved?.id ?? driverId ?? 0)}
                        />
                    }
                </CardContent>
            </Card>
        </div>
    )
}
