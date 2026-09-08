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
    phone?: string | null
}

type ImageField = File | string | null

interface ManagerTrips {
    income_uzs: string
    pending_order_count: number | string
    /**
     * Backend (TripSerializer) hozircha bu maydonni QAYTARMAYDI — MT-21.
     * Shu sababli ixtiyoriy: kelmasa ustun "—" ko'rsatadi, soxta 0 emas.
     * backend-kerak/F2.md ga qarang.
     */
    completed_order_count?: number | string | null
    driver_name: string
    id?: number
    vehicle?: number | string
    income_usd: string
    cash_flow_sum: string
    start_mileage: number
    end_mileage: number
    start_fuel?: number | string | null
    end_fuel?: number | string | null
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
    client: number
    direction: number | null
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
    images?: { id: number; image: string }[]
}

type ManagerExpenses = {
    trip: number
    amount: number
    category: number
    comment: string
    payment_type: number
}
