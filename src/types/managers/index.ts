type ManagerVehicles = {
    id: number
    truck_number: string
    truck_type: number
    driver_name: string
    pending_orders: number
    type: string
    status: number
}

type ImageField = File | string | null

interface ManagerTrips {
    income_uzs: number
    pending_order_count: string
    driver_name: any
    id?: number
    vehicle?: number | string
    income_usd: number
    cash_flow_sum: number
    start_mileage: number
    end_mileage: number
    fuel: number
    start: string
    end: string
    fuel_consume: number
    driver: number
    start_mileage_image: ImageField
    end_mileage_image: ImageField
}

type ManagerOrdersPayments = {
    id: number
    order: number
    currency: number
    currency_course: string
    amount: string
    currency_amount: string
    payment_type: number
}

type ManagerOrders = {
    id: number
    loading: number
    loading_name: string
    unloading: number
    unloading_name: string
    cargo_type: number
    cargo_type_name: string
    date: string
    type: number
    status: number
    payment_amount: number
    payment_amount_uzs: string
    payment_amount_usd: string
    pending_time: string
    started_time: string
    loading_time: string
    in_transit_time: string
    unloading_time: string
    completed_time: string
    canceled_time: string
    archived_time: string
}

type ManagerExpenses = {
    trip: number
    amount: number
    category: number
    comment: string
    payment_type: number
}
