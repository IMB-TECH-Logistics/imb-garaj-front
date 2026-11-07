export const MONTHLY_REPORTS = "kontragent/monthly-reports"
export const reportUrl = (id: number, tail = "") =>
    `${MONTHLY_REPORTS}/${id}${tail ? `/${tail}` : ""}`
export const REPORT_CREATE = "fin-report-create"
export const REPORT_DELETE = "fin-report-delete"

export type ShareRow = { kontragent: number; name: string; pct: string }

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
    other_expense: string
    profit: string
    vehicle_rent: string
    rent_vat: string
    management: string
    management_fee: string
    management_fee_usd: string
    fleet: number
    management_total: string
    tax: string
    tax_profit: string
    tax_vat: string
    tax_payroll: string
    tax_total: string
    rent: string
    rent_total: string
    other: string
    overhead: string
    net: string
    dividends: string
    shares: ShareRow[]
    firm_share: string
    firm_amount: string
    status: "draft" | "approved"
    approved_at: string | null
    approved_by_name: string | null
    usd_rate: string | null
    rate_date: string | null
    owners: OwnerRow[]
    posted_at: string | null
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

export const OVERHEAD_KEYS = [
    "management",
    "tax_profit",
    "tax_vat",
    "tax_payroll",
    "tax",
    "rent",
    "other",
] as const
export type OverheadKey = (typeof OVERHEAD_KEYS)[number]

export type OverheadItem = {
    id: number
    date: string
    line: OverheadKey
    category: string
    amount: string
    comment: string
}

export type OwnerVehicle = {
    vehicle: number
    plate: string
    part: "head" | "trailer"
    rent_usd: string
    vat_percent: string
    rent: string
}

export type OwnerRow = {
    kontragent: number
    name: string
    pct: string
    rent_usd: string
    rent: string
    vat: string
    dividend: string
    balance: string
    vehicles: OwnerVehicle[]
}
