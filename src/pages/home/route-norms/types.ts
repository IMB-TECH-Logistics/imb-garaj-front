export type FuelType = "diesel" | "methane"

export type FuelState = "ok" | "pending" | "no_data" | "unreliable"

export type IssueCode =
    | "no_gps_device"
    | "no_gps_points"
    | "no_window"
    | "time_from_status"
    | "no_zone"
    | "gps_gap"
    | "overlap"
    | "too_short"
    | "same_point"
    | "fuel_km_from_gps"

export type PointRef = {
    id: number
    name: string
    parent_name: string | null
}

export type MedianRange = {
    median: number | null
    min: number | null
    max: number | null
}

export type MedianOnly = {
    median: number | null
}

export type FuelStat = {
    fuel_type: FuelType
    trips_count: number
    amount_median: number | null
    per_100km_median: number | null
}

export type RouteNorm = {
    id: string
    load_point: PointRef | null
    unload_point: PointRef | null
    trips_total: number
    trips_count: number
    drivers_count: number
    vehicles_count: number
    enough: boolean
    distance_km: MedianRange | null
    total_minutes: MedianRange | null
    moving_minutes: MedianOnly | null
    stop_minutes: MedianOnly | null
    fuel: FuelStat[]
    last_finished_at: string | null
}

export type RouteNormSummary = {
    trips_total: number
    in_norm: number
    not_in_norm: number
    issues: Partial<Record<IssueCode, number>>
    fuel: Partial<Record<FuelState, number>>
    routes_count: number
    pending_orders: number
    last_computed_at: string | null
}

export type RouteNormOrder = {
    id: number
    order_id: number
    trip_id: number
    date: string | null
    started_at: string | null
    finished_at: string | null
    driver: { id: number; name: string } | null
    vehicle: { id: number; number: string } | null
    distance_km: number | null
    total_minutes: number | null
    moving_minutes: number | null
    stop_minutes: number | null
    stops_count: number | null
    longest_stop_minutes: number | null
    load_minutes: number | null
    unload_minutes: number | null
    fuel_type: FuelType | null
    fuel_amount: number | null
    fuel_per_100km: number | null
    fuel_state: FuelState
    time_source: "gps" | "status"
    in_norm: boolean
    issues: IssueCode[]
}

export type RouteNormListResponse = ListResponse<RouteNorm>

export type RouteNormOrdersResponse = ListResponse<RouteNormOrder>
