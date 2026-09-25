

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
    latest_at?: string | null
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

export type GpsLiveVehicle = {
    imei: string
    tracker_name: string
    vehicle: number | null
    vehicle_number: string | null
    driver_name: string | null
    status: "online" | "offline" | "unknown"
    last_update: string | null
    lat: number | null
    lng: number | null
    speed: number | null
    course: number | null
    ignition: boolean | null
    fix_time: string | null
}

export type GpsDay = {
    date: string
    points: number
    first: string
    last: string
    distance_km: number
    max_speed: number
}

export type GpsPosition = {
    id: number
    fix_time: string
    latitude: number
    longitude: number
    speed: number | null
    course: number | null
}

export type VehicleOrderBadge = {
    vehicle: number
    external_id: string
    garage_order_id: number | null
    status: number
    status_name: string | null
    garage_status: number | null
    from: string | null
    to: string | null
    loaded_at: string | null
    loaded_at_reliable: boolean | null
    started_at: string | null
    spent_minutes: number | null
}

export type VehicleLastOrders = {
    available: boolean
    stale: boolean
    results: VehicleOrderBadge[]
}

export type LastOrderStatus = {
    status: number
    status_name: string | null
    garage_status: number | null
    start: string
    end: string | null
}

export type VehicleLastOrder = {
    vehicle: { id: number; truck_number: string; driver: string | null; gps_imei: string | null }
    available: boolean
    stale: boolean
    order: {
        external_id: string
        garage_order_id: number | null
        status: number
        status_name: string | null
        garage_status: number | null
        from: string | null
        to: string | null
        date: string | null
    } | null
    statuses: LastOrderStatus[]
    loaded_at: string | null
    loaded_at_reliable: boolean | null
    stats: {
        started_at: string
        ended_at: string | null
        spent_minutes: number
        distance_km: number | null
        moving_minutes: number | null
        stop_minutes: number | null
    } | null
    track: {
        segments: { status: number | null; garage_status: number | null; points: [number, number][] }[]
        bbox: [number, number, number, number] | null
    } | null
}
