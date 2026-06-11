import { useState } from "react"
import { type VehicleRow } from "./data"
import RouteView from "./route-view"
import VehicleList from "./vehicle-list"
import VehicleTimeline from "./timeline"

type View =
    | { type: "list" }
    | { type: "timeline"; vehicle: VehicleRow }
    | { type: "route"; vehicle: VehicleRow; status: number; from: "list" | "timeline" }

export default function StatusReport({
    onSelectOnMap,
}: {
    // Tapping a timeline segment selects that avtomobil on the map with the
    // tapped status active on the Holat lentasi (status ribbon).
    onSelectOnMap?: (vehicleId: number, status: number) => void
}) {
    const [view, setView] = useState<View>({ type: "list" })

    if (view.type === "timeline")
        return (
            <VehicleTimeline
                vehicle={view.vehicle}
                onBack={() => setView({ type: "list" })}
                onShowRoute={(status) =>
                    onSelectOnMap
                        ? onSelectOnMap(view.vehicle.id, status)
                        : setView({
                              type: "route",
                              vehicle: view.vehicle,
                              status,
                              from: "timeline",
                          })
                }
            />
        )

    if (view.type === "route") {
        const vehicle = view.vehicle
        return (
            <RouteView
                vehicle={vehicle}
                status={view.status}
                onBack={() =>
                    setView(
                        view.from === "timeline"
                            ? { type: "timeline", vehicle }
                            : { type: "list" },
                    )
                }
            />
        )
    }

    return (
        <VehicleList
            onSelect={(vehicle) => setView({ type: "timeline", vehicle })}
            onStatusSelect={(vehicle, status) =>
                setView({ type: "route", vehicle, status, from: "list" })
            }
        />
    )
}
