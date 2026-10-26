type ManagerVehicles = {
    id: number
    truck_number: string
    truck_type: number
    driver_name: string
    pending_orders: number
    type: string
    status: number
    loading_name: string
    unloading_name: string
    order_status: number
    order_activity: number | null
    order_type: number | null
    next_loading_name: string | null
    next_unloading_name: string | null
    expected_arrival: string | null
    phone?: string | null
}

type ImageField = File | string | null

interface ManagerTrips {
    cash_close_status?: number | null
    income_uzs: string
    pending_order_count: string
    completed_order_count: number
    driver_name: string
    vehicle_number?: string | null
    id?: number
    vehicle?: number | string
    cash_flow_sum: string
    start_mileage: number
    end_mileage: number
    fuel: number
    start: string
    end: string
    fuel_consume: number
    driver: number
    start_mileage_image: ImageField
    end_mileage_image: ImageField
    loading: string
    unloading: string
}

type TripFuelState = "ok" | "pending" | "no_data" | "unreliable"

type ManagerOrdersPayments = {
    id: number
    order: number
    amount: string
    payment_type: number
}

type ManagerOrders = {
    distance_km?: number | null
    fuel_amount?: number | null
    fuel_state?: TripFuelState | null
    fuel_type?: "diesel" | "methane" | null
    id: number
    trip?: number
    loading: number
    loading_name: string
    unloading: number
    unloading_name: string
    loading_located?: boolean | null
    unloading_located?: boolean | null
    load_lat?: number | null
    load_lng?: number | null
    unload_lat?: number | null
    unload_lng?: number | null
    cargo_type: number
    cargo_type_name: string
    client: number
    direction: number | null
    date: string
    type: number
    status: number
    activity: number
    activity_display: string
    payment_amount: number
    payment_amount_uzs: string
    pending_time: string
    started_time: string
    ordered_at?: string | null
    loading_time: string
    in_transit_time: string
    unloading_time: string
    completed_time: string
    parking_minutes?: number | null
    canceled_time: string
    logistics_canceled_at?: string | null
    archived_time: string
    images?: { id: number; image: string }[]
    incomes?: { id?: number; payment_type: number | null }[]
    truck_number?: string | null
    external_id?: string | null
    is_integration?: boolean
    logistics_ttn?: string | null
    logistics_product?: string | null
    logistics_distributor?: string | null
    logistics_distributor_code?: string | null
    manual_income?: boolean
    price_diff?: string | number
    price_diff_by_client?: boolean
    direction_match?: "matched" | "created" | "ambiguous" | "not_found" | "manual" | ""
    direction_name?: string | null
    direction_has_price?: boolean
    vehicle_other_active_orders?: number
    trip_confirmed?: boolean
    trip_open_days?: number | null
    vehicle_open_trips?: number
}

type ManagerExpenses = {
    trip: number
    amount: number
    category: number
    comment: string
    payment_type: number
}
