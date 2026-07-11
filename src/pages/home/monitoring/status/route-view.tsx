import { MONITORING_STATUS_ROUTE } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useSearch } from "@tanstack/react-router"
import { endOfMonth, format, startOfMonth } from "date-fns"
import { ArrowLeft } from "lucide-react"
import RouteMap from "../route-map"
import { type ApiStatusRoute, STATUS_META, type VehicleRow } from "./data"

function fmtDur(mins: number): string {
    const total = Math.round(mins)
    const h = Math.floor(total / 60)
    const m = total % 60
    if (h === 0) return `${m}m`
    return m ? `${h}s ${m}m` : `${h}s`
}

export default function RouteView({
    vehicle,
    status,
    onBack,
}: {
    vehicle: VehicleRow
    status: number
    onBack: () => void
}) {
    const meta = STATUS_META[status]
    const search = useSearch({ strict: false }) as Record<string, string>
    const today = new Date()
    const from = search.from_date
        ? new Date(search.from_date)
        : startOfMonth(today)
    const to = search.to_date ? new Date(search.to_date) : endOfMonth(today)

    const { data } = useGet<ApiStatusRoute>(MONITORING_STATUS_ROUTE, {
        params: {
            vehicle: vehicle.id,
            status,
            from_date: format(from, "yyyy-MM-dd"),
            to_date: format(to, "yyyy-MM-dd"),
        },
    })

    const points = data?.points ?? []
    const durationMin = data?.duration_min ?? 0
    const km = ((data?.distance_m ?? 0) / 1000).toFixed(2)

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="shrink-0"
                >
                    <ArrowLeft size={18} />
                </Button>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-semibold">
                            {vehicle.truck_number}
                        </h1>
                        <span className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                            <span
                                className={cn(
                                    "h-2.5 w-2.5 rounded-sm",
                                    meta.dot,
                                )}
                            />
                            {meta.label}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {vehicle.driver_name} · {vehicle.type}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_340px]">
                <Card className="overflow-hidden">
                    <CardContent className="p-0">
                        <RouteMap
                            height="calc(100vh - 200px)"
                            points={points}
                            lineColor={meta.color}
                        />
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-3">
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm font-semibold">
                                Bosib o'tilgan masofa
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-semibold tabular-nums">
                                    {km}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    km
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm font-semibold">
                                Ma'lumotlar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2 pt-0">
                            <Row label="Holat" value={meta.label} />
                            <Row
                                label="Haydovchi"
                                value={vehicle.driver_name}
                            />
                            <Row label="Mashina" value={vehicle.truck_number} />
                            <Row label="Turi" value={vehicle.type} />
                            <Row
                                label="Davomiyligi"
                                value={fmtDur(durationMin)}
                            />
                            <Row
                                label="Nuqtalar"
                                value={points.length.toLocaleString()}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b py-1.5 last:border-b-0">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="truncate text-sm font-medium tabular-nums">
                {value}
            </span>
        </div>
    )
}
