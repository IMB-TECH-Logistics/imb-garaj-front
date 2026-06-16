

export type Dimension = "driver" | "order" | "trip" | "vehicle"

export type LiveDriver = {
    user: number
    driver_name: string
    vehicle: number | null
    vehicle_number: string | null
    trip: number | null
    order: number | null
    lat: number | null
    lng: number | null
    last_seen: string
    seconds_since: number
}

export type OrderTracking = {
    id: number
    status: number
    type: number
    driver: number | null
    driver_name: string | null
    vehicle: number | null
    vehicle_number: string | null
    trip: number | null
    client_name: string | null
    lat: number | null
    lng: number | null
    last_seen: string | null
    seconds_since: number | null
    external_id: string | null
    is_integration: boolean
    amount: number | string | null
}

export type TripTracking = {
    id: number
    driver: number | null
    driver_name: string | null
    vehicle: number | null
    vehicle_number: string | null
    start: string | null
    end: string | null
    lat: number | null
    lng: number | null
    last_seen: string | null
    seconds_since: number | null
}

export type VehicleTracking = {
    id: number
    truck_number: string
    status: number | null
    trip: number | null
    driver: number | null
    driver_name: string | null
    lat: number | null
    lng: number | null
    last_seen: string | null
    seconds_since: number | null
}

export type RoutePolyline = {
    trip: number | null
    order: number | null
    driver: number | null
    count: number
    distance_m: number
    first_at: string | null
    last_at: string | null
    bbox: [number, number, number, number] | null
    points: [number, number][]
}

export type DriverOption = {
    id: number
    first_name?: string
    last_name?: string
    full_name?: string
}

export type TripOption = {
    id: number
    driver_name?: string | null
    start?: string | null
    end?: string | null
}

export type MonitoringFilters = {
    driver: number | null
    order: number | null
    trip: number | null
    vehicle: number | null
    fromDate: string
    toDate: string
}

export const EMPTY_FILTERS: MonitoringFilters = {
    driver: null,
    order: null,
    trip: null,
    vehicle: null,
    fromDate: "",
    toDate: "",
}

export function isHistoricalView(f: MonitoringFilters): boolean {
    return (
        f.driver != null ||
        f.order != null ||
        f.trip != null ||
        f.vehicle != null ||
        !!f.fromDate ||
        !!f.toDate
    )
}

export function todayIso(): string {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
}
