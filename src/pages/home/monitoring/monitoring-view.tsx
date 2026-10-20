import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { StatStrip } from "./historical-summary"
import { MonitoringPanelBody } from "./monitoring-panel-body"
import { MapArea, PanelToggle, ReportHeader, SidePanelHeader } from "./monitoring-panels"
import StatusRibbon from "./status-ribbon"
import { useMonitoringController } from "./use-monitoring-controller"

export default function MonitoringView() {
    const c = useMonitoringController()
    const { mode, panelOpen, historical, selectedId, trackerHeaderVisible, selectedTracker, ribbonVehicleId, ribbonDate, selectedDriverName, activeStatus, toggleStatus, polylineData } = c
    return (
        <div className="flex flex-col gap-3">
            {mode === "report" && (
                <ReportHeader mode={mode} />
            )}

            {/* One persistent grid: the map collapses + fades while the panel
                track grows from sidebar-width to full — a true expand, not a
                crossfade of two separate trees. Only the panel's inner content
                swaps between the live lists and the status report. */}
            <div
                className={cn(
                    "relative grid grid-cols-1 gap-3 transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    mode === "report"
                        ? "lg:grid-cols-[minmax(0,0fr)_minmax(320px,1fr)]"
                        : panelOpen
                          ? "lg:grid-cols-[minmax(0,4fr)_minmax(280px,1fr)]"
                          : "lg:grid-cols-[minmax(0,1fr)_minmax(0,0fr)]",
                )}
            >
                {mode === "map" && (
                    <PanelToggle {...c} />
                )}
                <MapArea {...c} />

                <Card
                    className={cn(
                        "flex h-full max-h-[calc(100vh-112px)] min-w-0 flex-col transition-opacity duration-500",
                        mode === "map" &&
                            !panelOpen &&
                            "lg:pointer-events-none lg:invisible lg:overflow-hidden lg:border-0 lg:opacity-0",
                    )}
                >
                    {(mode === "report" || historical || selectedId != null || trackerHeaderVisible) && (
                    <SidePanelHeader {...c} selectedTracker={selectedTracker!} />
                    )}
                    <CardContent className={cn("flex-1", trackerHeaderVisible ? "flex min-h-0 flex-col overflow-hidden" : "overflow-auto", mode === "report" || historical || selectedId != null || trackerHeaderVisible ? "pt-0" : "pt-4")}>
                        <MonitoringPanelBody {...c} />
                    </CardContent>
                </Card>
            </div>

            {mode === "map" && ribbonVehicleId != null && ribbonDate && (
                <StatusRibbon
                    vehicleId={ribbonVehicleId}
                    vehicleLabel={selectedDriverName}
                    date={ribbonDate}
                    active={activeStatus}
                    onToggle={toggleStatus}
                />
            )}

            {mode === "map" &&
                historical &&
                polylineData &&
                polylineData.count > 0 && <StatStrip data={polylineData} />}
        </div>
    )
}
