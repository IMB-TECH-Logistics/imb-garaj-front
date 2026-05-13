export type LiveDriver = {
    user: number
    driver_name: string
    vehicle: number | null
    vehicle_number: string | null
    trip: number | null
    order: number | null
    lat: number
    lng: number
    last_seen: string
    seconds_since: number
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
