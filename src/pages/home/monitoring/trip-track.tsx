import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    MANAGERS_TRIPS,
    MONITORING_TRIP_TRACK,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useNavigate, useParams } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { useMemo } from "react"
import RouteMap from "./route-map"
import type { RoutePolyline } from "./types"

type TripDetail = {
    id: number
    driver_name?: string | null
    start?: string | null
    end?: string | null
    start_mileage?: number
    end_mileage?: number
    vehicle?: number
}

export default function TripTrackPage() {
    const params = useParams({ strict: false }) as { id: string }
    const navigate = useNavigate()
    const tripId = Number(params.id)

    const polyline = useGet<RoutePolyline>(
        `${MONITORING_TRIP_TRACK}/${tripId}/track`,
        { params: { max_points: 2000 }, enabled: !Number.isNaN(tripId) },
    )

    const trip = useGet<TripDetail>(`${MANAGERS_TRIPS}/${tripId}`, {
        enabled: !Number.isNaN(tripId),
    })

    const polylineData = useMemo<RoutePolyline | undefined>(() => {
        if (!polyline.data) return polyline.data
        return {
            ...polyline.data,
            points: polyline.data.points?.map(
                ([a, b]) => [b, a] as [number, number],
            ),
            bbox: polyline.data.bbox
                ? ([
                      polyline.data.bbox[1],
                      polyline.data.bbox[0],
                      polyline.data.bbox[3],
                      polyline.data.bbox[2],
                  ] as [number, number, number, number])
                : null,
        }
    }, [polyline.data])

    const km = polylineData
        ? (polylineData.distance_m / 1000).toFixed(2)
        : "—"
    const totalMileage =
        trip.data?.start_mileage != null && trip.data?.end_mileage != null
            ? trip.data.end_mileage - trip.data.start_mileage
            : null

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate({ to: "/monitoring" })}
                    icon={<ArrowLeft className="h-4 w-4" />}
                />
                <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                        <h1 className="text-xl font-semibold">
                            Reys marshruti
                        </h1>
                        <span className="text-sm text-muted-foreground tabular-nums">
                            #{tripId}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {trip.data?.driver_name ?? "—"}
                        {trip.data?.start
                            ? ` · ${formatDate(trip.data.start)}`
                            : ""}
                        {trip.data?.end
                            ? ` → ${formatDate(trip.data.end)}`
                            : trip.data?.start
                            ? " → davom etmoqda"
                            : ""}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_340px]">
                <Card className="overflow-hidden">
                    <CardContent className="p-0">
                        <RouteMap
                            height="calc(100vh - 200px)"
                            points={polylineData?.points}
                            bbox={polylineData?.bbox ?? null}
                            gradient
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
                            <Row
                                label="Haydovchi"
                                value={trip.data?.driver_name ?? "—"}
                            />
                            <Row
                                label="Mashina"
                                value={
                                    trip.data?.vehicle != null
                                        ? `#${trip.data.vehicle}`
                                        : "—"
                                }
                            />
                            <Row
                                label="Boshlanish"
                                value={formatStamp(polylineData?.first_at)}
                            />
                            <Row
                                label="Tugash"
                                value={formatStamp(polylineData?.last_at)}
                            />
                            <Row
                                label="Nuqtalar"
                                value={(
                                    polylineData?.count ?? 0
                                ).toLocaleString()}
                            />
                            <Row
                                label="Davomiyligi"
                                value={formatDuration(
                                    polylineData?.first_at ?? null,
                                    polylineData?.last_at ?? null,
                                )}
                            />
                            {totalMileage != null && (
                                <Row
                                    label="Probeg"
                                    value={`${totalMileage}`}
                                />
                            )}
                            {trip.data?.start_mileage != null && (
                                <Row
                                    label="Boshl. probeg"
                                    value={`${trip.data.start_mileage}`}
                                />
                            )}
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

function formatDate(raw: string | null | undefined): string {
    if (!raw) return "—"
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return raw
    return d.toLocaleDateString("uz-UZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
}

function formatStamp(raw: string | null | undefined): string {
    if (!raw) return "—"
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return raw
    return d.toLocaleString("uz-UZ", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    })
}

function formatDuration(from: string | null, to: string | null): string {
    if (!from || !to) return "—"
    const a = new Date(from).getTime()
    const b = new Date(to).getTime()
    if (Number.isNaN(a) || Number.isNaN(b)) return "—"
    const seconds = Math.max(0, Math.floor((b - a) / 1000))
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h === 0) return `${m}m`
    return `${h}s ${m}m`
}
