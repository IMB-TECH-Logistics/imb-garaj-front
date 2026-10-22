import ParamDateRange from "@/components/as-params/date-picker-range"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MONITORING_GARAGE_AREA } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { endOfMonth, startOfMonth } from "date-fns"
import { ArrowLeft, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ConnectionFilterBar, NoGpsFilterButton, TruckStatusFilterBar } from "./gps-list"
import RouteMap, { type MapPoint } from "./route-map"
import { ReplayMapControl } from "./route-replay"
import { TrackerHeader } from "./tracker-history"
import type { TruckStatusFilter } from "./types"
import { EMPTY_FILTERS } from "./types"
import type { useMonitoringController } from "./use-monitoring-controller"

type C = ReturnType<typeof useMonitoringController>

export function ReportHeader({ mode }: Pick<C, "mode">) {
    const { t } = useTranslation()
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-semibold">{t("table.status")}</h1>
            {mode === "report" && (
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <ParamDateRange
                        from="from_date"
                        to="to_date"
                        clearable={false}
                        defaultValue={{
                            from: startOfMonth(new Date()),
                            to: endOfMonth(new Date()),
                        }}
                        addButtonProps={{
                            className:
                                "!bg-muted/50 h-8 text-xs min-w-28 justify-start",
                        }}
                    />
                </div>
            )}
        </div>
    )
}

export function PanelToggle({ panelOpen, setPanelOpen, panelTitle }: Pick<C, "panelOpen" | "setPanelOpen" | "panelTitle">) {
    return (
        <button
            type="button"
            onClick={() => setPanelOpen((v) => !v)}
            aria-label={panelTitle}
            title={panelTitle}
            className={cn(
                "absolute top-1/2 z-20 hidden h-16 w-6 -translate-y-1/2 items-center justify-center rounded-md border border-primary bg-primary text-primary-foreground shadow-lg shadow-black/30 transition-[right,color,background-color] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:brightness-110 lg:flex",
                panelOpen
                    ? "right-[calc(max(280px,(100%_-_12px)/5)_-_6px)]"
                    : "right-[-6px]",
            )}
        >
            {panelOpen ? (
                <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
            ) : (
                <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            )}
        </button>
    )
}

export function MapArea({ mode, historical, trackerImei, gpsLive, noGpsOnly, connection, truckStatus, setTruckStatus, truckStatusCounts, setConnection, connectionCounts, allUnlinked, setNoGps, selectedId, backToAll, history, replayBar, replayStatuses, mapMarkers, setMapBounds, routeSegments, polylineData }: Pick<C, "mode" | "historical" | "trackerImei" | "gpsLive" | "noGpsOnly" | "connection" | "truckStatus" | "setTruckStatus" | "truckStatusCounts" | "setConnection" | "connectionCounts" | "allUnlinked" | "setNoGps" | "selectedId" | "backToAll" | "history" | "replayBar" | "replayStatuses" | "mapMarkers" | "setMapBounds" | "routeSegments" | "polylineData">) {
    const garageArea = useGet<{ coordinates: MapPoint[] }>(MONITORING_GARAGE_AREA, {
        options: { staleTime: Infinity },
    })
    const garageAreas = useMemo(
        () => (garageArea.data ? [garageArea.data.coordinates] : undefined),
        [garageArea.data],
    )
    const { t } = useTranslation()
    return (
        <div
            className={cn(
                "min-w-0 overflow-hidden transition-opacity duration-500",
                mode === "report"
                    ? "pointer-events-none hidden opacity-0 lg:block"
                    : "opacity-100",
            )}
        >
            <Card className="relative overflow-hidden">
                <CardContent className="relative p-0">
                    {!historical && !trackerImei && (gpsLive.data?.length ?? 0) > 0 && (
                        <div className="absolute left-3 right-3 top-3 z-[500] flex flex-wrap items-start gap-2 pointer-events-none [&>*]:pointer-events-auto [&>*]:max-w-full [&>*]:overflow-x-auto">
                            <TruckStatusFilterBar
                                value={noGpsOnly || connection !== "all" ? ("none" as TruckStatusFilter) : truckStatus}
                                onChange={setTruckStatus}
                                counts={truckStatusCounts}
                                extra={
                                    <>
                                        <ConnectionFilterBar
                                            bare
                                            value={noGpsOnly ? "all" : connection}
                                            onChange={setConnection}
                                            counts={connectionCounts}
                                        />
                                        {allUnlinked.length > 0 && (
                                            <NoGpsFilterButton
                                                active={noGpsOnly}
                                                count={allUnlinked.length}
                                                onToggle={() => setNoGps(!noGpsOnly)}
                                            />
                                        )}
                                    </>
                                }
                            />
                        </div>
                    )}
                    {mode === "map" && (trackerImei || selectedId != null) && (
                        <Button
                            size="icon"
                            variant="secondary"
                            className="absolute left-3 top-3 z-[500] h-10 w-10 shadow-md"
                            onClick={backToAll}
                            aria-label={t("page.back_to_list")}
                            title={t("page.back_to_list")}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    {mode === "map" && trackerImei && (
                        <Button
                            size="icon"
                            variant="secondary"
                            className={cn(
                                "absolute left-3 top-[60px] z-[500] h-10 w-10 font-mono text-base font-bold shadow-md",
                                history.showStops
                                    ? "bg-amber-500 text-amber-950 hover:bg-amber-400"
                                    : "text-muted-foreground",
                            )}
                            onClick={() => history.setShowStops(!history.showStops)}
                            aria-pressed={history.showStops}
                            aria-label={t("mon.show_stops")}
                            title={t("mon.show_stops")}
                        >
                            P
                        </Button>
                    )}
                    {replayBar && (
                        <ReplayMapControl
                            replay={history.replay}
                            statuses={replayStatuses}
                            focusKey={history.focus?.kind === "status" ? history.focus.key : null}
                            onFocus={(key) => history.setFocus(key ? { kind: "status", key } : null)}
                            className="absolute left-16 right-3 top-3 z-[500]"
                        />
                    )}
                    <RouteMap
                        height="calc(100vh - 112px)"
                        markers={mapMarkers}
                        onBoundsChange={setMapBounds}
                        segments={
                            trackerImei
                                ? history.map.segments
                                : historical
                                  ? routeSegments
                                  : undefined
                        }
                        points={
                            trackerImei
                                ? history.map.points
                                : historical
                                  ? polylineData?.points
                                  : undefined
                        }
                        bbox={
                            trackerImei
                                ? history.map.bbox
                                : historical
                                  ? (polylineData?.bbox ?? null)
                                  : null
                        }
                        pois={trackerImei ? history.map.pois : undefined}
                        areas={garageAreas}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

export function SidePanelHeader({ mode, historical, selectedId, trackerHeaderVisible, selectedTracker, selectTracker, setFilters, selectedDriverName, panelTitle, setMode }: Pick<C, "mode" | "historical" | "selectedId" | "trackerHeaderVisible" | "selectTracker" | "setFilters" | "selectedDriverName" | "panelTitle" | "setMode"> & { selectedTracker: NonNullable<C["selectedTracker"]> }) {
    const { t } = useTranslation()
    return (
        <CardHeader className={cn("flex flex-row items-center justify-between gap-2 py-3", trackerHeaderVisible && "mb-4 border-b-2 border-muted-foreground/60")}>
            {trackerHeaderVisible ? (
                <TrackerHeader tracker={selectedTracker} onBack={() => selectTracker(null)} />
            ) : (
            <div className="flex min-w-0 items-center gap-2">
                {mode === "map" && selectedId != null && (
                    <button
                        type="button"
                        onClick={() => setFilters(EMPTY_FILTERS)}
                        aria-label={t("page.back_to_list")}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                )}
                {(mode === "report" || historical || selectedId != null) && (
                    <CardTitle className="truncate text-sm font-semibold">
                        {mode === "report"
                            ? t("table.orders_history")
                            : selectedId != null && selectedDriverName
                              ? selectedDriverName
                              : panelTitle}
                    </CardTitle>
                )}
            </div>
            )}
            <div className="flex items-center gap-1.5">
                {mode === "report" && (
                    <button
                        type="button"
                        onClick={() =>
                            setMode(
                                mode === "report"
                                    ? "map"
                                    : "report",
                            )
                        }
                        aria-label={
                            mode === "report"
                                ? t("actions.cancel")
                                : t("page.details")
                        }
                        className={cn(
                            "group grid h-7 w-7 place-items-center rounded-md border transition-colors",
                            mode === "report"
                                ? "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                                : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20",
                        )}
                    >
                        {mode === "report" ? (
                            <Minimize2 className="h-3.5 w-3.5" />
                        ) : (
                            <Maximize2 className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                        )}
                    </button>
                )}
            </div>
        </CardHeader>
    )
}
