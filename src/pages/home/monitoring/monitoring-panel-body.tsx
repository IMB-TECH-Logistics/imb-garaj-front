import { useTranslation } from "react-i18next"
import { DimensionEmpty } from "./dimension-row"
import GpsList, { UnlinkedVehicles } from "./gps-list"
import { HistoricalSummary } from "./historical-summary"
import OrderList from "./order-list"
import StatusReport from "./status"
import { TrackerHistoryPanel } from "./tracker-history"
import TripList from "./trip-list"
import type { useMonitoringController } from "./use-monitoring-controller"
import VehicleList from "./vehicle-list"

type C = ReturnType<typeof useMonitoringController>

export function MonitoringPanelBody({ mode, selectFromStatus, historical, polylineData, polyline, navigate, dimension, selectedTracker, history, noGpsOnly, allUnlinked, truckStatus, connection, cargoItems, gpsItems, visibleItems, gpsLive, ordersByVehicle, trackerImei, selectTracker, unlinkedVehicles, orders, filters, selectOrder, trips, selectTrip, vehicles, selectVehicle }: Pick<C, "mode" | "selectFromStatus" | "historical" | "polylineData" | "polyline" | "navigate" | "dimension" | "selectedTracker" | "history" | "noGpsOnly" | "allUnlinked" | "truckStatus" | "connection" | "cargoItems" | "gpsItems" | "visibleItems" | "gpsLive" | "ordersByVehicle" | "trackerImei" | "selectTracker" | "unlinkedVehicles" | "orders" | "filters" | "selectOrder" | "trips" | "selectTrip" | "vehicles" | "selectVehicle">) {
    const { t } = useTranslation()
    return (
        <>
            {mode === "report" ? (
                <StatusReport onSelectOnMap={selectFromStatus} />
            ) : historical ? (
                <HistoricalSummary
                    data={polylineData}
                    loading={polyline.isLoading}
                    onOpenTrip={(id) =>
                        navigate({
                            to: "/monitoring/trips/$id",
                            params: { id: String(id) },
                        })
                    }
                />
            ) : dimension === "driver" ? (
                // Hozircha faqat gps-backend trekerlari. Eski ro'yxat:
                // <DriverList items={liveDrivers} loading={drivers.isLoading}
                //     activeId={filters.driver} onSelect={selectDriver} />
                selectedTracker ? (
                    <TrackerHistoryPanel history={history} />
                ) : (
                    <>
                    {noGpsOnly ? (
                        <UnlinkedVehicles items={allUnlinked} />
                    ) : (truckStatus !== "all" || connection !== "all") && cargoItems.length === 0 && gpsItems.length > 0 ? (
                        <DimensionEmpty title={t("page.not_found")} />
                    ) : (
                    <>
                    {visibleItems.length < cargoItems.length && (
                        <div className="mb-2 flex items-center justify-between gap-2 rounded-md bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
                            <span>{t("mon.map_area")}</span>
                            <span className="font-mono font-semibold tabular-nums text-foreground">
                                {visibleItems.length} / {cargoItems.length}
                            </span>
                        </div>
                    )}
                    <GpsList
                        items={visibleItems}
                        loading={gpsLive.isLoading}
                        unavailable={gpsLive.isError}
                        orders={ordersByVehicle}
                        activeImei={trackerImei}
                        onSelect={(item) => selectTracker(item.imei)}
                        unlinked={unlinkedVehicles}
                    />
                    </>
                    )}
                    </>
                )
            ) : dimension === "order" ? (
                <OrderList
                    items={orders.data ?? []}
                    loading={orders.isLoading}
                    activeId={filters.order}
                    onSelect={selectOrder}
                />
            ) : dimension === "trip" ? (
                <TripList
                    items={trips.data ?? []}
                    loading={trips.isLoading}
                    activeId={filters.trip}
                    onSelect={selectTrip}
                />
            ) : (
                <VehicleList
                    items={vehicles.data ?? []}
                    loading={vehicles.isLoading}
                    activeId={filters.vehicle}
                    onSelect={selectVehicle}
                />
            )}
        </>
    )
}
