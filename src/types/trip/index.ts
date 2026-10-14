interface TripFormData {
    driver: number | string
    vehicle: number | string
    start: Date
    type: number | string
    end: Date
}

type CardMain = {
    current_balance: number
    current_balance_perc: number
    difference: number
    difference_perc: number
    expenses: number
    expense_perc: number
    incomes: number
    income_perc: number
}

type TripRow = {
    vehicle_number: string | number
    driver_name: string | number
    orders_count: string | number
    pending_order_count?: string | number
    completed_order_count?: string | number
    order_count?: string | number
    id: number | string
    created: string
    updated: string
    status: number
    type: number
    start: string
    end: string | null
    driver: number
    vehicle: number
}

type Truck = {
    truck_type_name: string
    status: number
    driver_name: string
    id: number
    created: string
    updated: string
    truck_number: string
    truck_passport: string
    trailer_number: string | null
    fuel: string
    truck_type: number
    trailer_type: number | null
    driver: number
    page: string
}

type CargoItem = {
    id: number
    created: string
    updated: string
    name: string
}

type TripsOrders = {
    id?: string | number
    loading: number
    unloading: number
    trip: number
}

type DistrictType = {
    name: string
    id: number | number
}

type TripOrdersRow = {
    name: string
    client_name: string
    created_at: string | number
    cargo_type_name: string
    loading_name: string
    unloading_name: string
    id: number
    created: string
    updated: string
    loading: number
    unloading: number
    trip: number
    driver?: number | null
    trailer_number?: string | null
    cargo_type: string | number
    direction: number | null
    date: string | number
    client: string
    payment_type: string | number
    amount: number | string
    type: number | string
    payment_amount_uzs: string
    status:number
    activity: number
    activity_display: string
    external_id?: string | null
    incomes?: {
        id?: number
        payment_type: number | null
        amount: number | string | null
    }[]
    payments: [
        {
            amount: string | null
            payment_type: number | null
        },
    ]
    images?: { id: number; image: string }[]
    manual_income?: boolean
    price_diff?: string | number
    price_diff_by_client?: boolean
    salary_amount?: number | string | null
    extra_pay_amount?: number | string | null
    extra_pay_comment?: string | null
    extra_pay_paid_at?: string | null
}

type CashflowRow = {
    amount?: number | string
    id?: number
    created?: string
    updated: string
    comment?: string | null
    executor?: number
    transaction?: number
    order?: number
    category?: number
    technic?: string | number
    end_time?: string | number
}

type ExpenseCategory = {
    id?: number | string
    name?: string
}

type OrderPaymentType = {
    id: number
    payment_type_name: string
    amount: string
    order: number
    payment_type: number
}

type TruckInfo = {
    driver_name: string
    fuel_consumed: number
    fuel_cost: number
    fuel_type: string
    mileage: number
    other_expense: number
    owner: string
    phone: string
    primary_truck: string
    profit: number
    repair: number
    revenue: number
    salary: number
    secondary_trucks: []
    total_expense: number
    trip_count: number
    vehicle_type: string
}
