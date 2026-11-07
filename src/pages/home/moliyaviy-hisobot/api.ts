export const MONTHLY_REPORTS = "kontragent/monthly-reports"
export const reportUrl = (id: number, tail = "") =>
    `${MONTHLY_REPORTS}/${id}${tail ? `/${tail}` : ""}`
export const REPORT_CREATE = "fin-report-create"
export const REPORT_DELETE = "fin-report-delete"

export type MonthlyReport = {
    id: number
    month: string
    month_label: string
    order_count: number
    trip_count: number
    unpriced_count: number
    income: string
    trip_expense: string
    trip_profit: string
    vehicle_expense: string
    recoverable: string
    company_vehicle_expense: string
    profit: string
    vehicle_rent: string
    dividends: string
    usd_rate: string | null
    rate_date: string | null
    owners: OwnerRow[]
    posted_at: string | null
    management: string
    tax: string
    rent: string
    other: string
    overhead: string
    net: string
    comment: string
    computed_at: string | null
    created: string
    updated: string
    created_by_name: string | null
}

export type VehicleRow = {
    id?: number
    truck_number: string
    trip_count: number
    order_count: number
    income: string
    trip_expense: string
    trip_profit: string
    vehicle_expense: string
    net: string
}

export const OVERHEAD_KEYS = ["management", "tax", "rent", "other"] as const
export type OverheadKey = (typeof OVERHEAD_KEYS)[number]

export type OverheadItem = {
    id: number
    date: string
    line: OverheadKey
    category: string
    amount: string
    comment: string
}

export type OwnerVehicle = { vehicle: number; plate: string; part: "head" | "trailer"; rent_usd: string; rent: string; repair: string }

export type OwnerRow = {
    kontragent: number
    name: string
    share: string
    rent_usd: string
    rent: string
    repair: string
    dividend: string
    balance: string
    vehicles: OwnerVehicle[]
}
