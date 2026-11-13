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
    trip_fuel: string
    trip_salary: string
    trip_other: string
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
    tax_cash: string
    tax_total: string
    tax_profit_manual: string
    tax_vat_manual: string
    tax_payroll_manual: string
    tax_cash_manual: string
    leasing: Record<string, string>
    leasing_total: string
    leasing_mode: boolean
    tax_params: TaxParams
    tax_calc: TaxCalc
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
    "tax_cash",
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
    leasing?: string
    leasing_vehicles?: { vehicle: number; plate: string; amount: string }[]
}

export type TaxParams = {
    enabled: boolean
    bank_income: string | null
    bank_markup: string
    salary_official: string
    vat_rate: string
    pit_rate: string
    social_rate: string
    profit_rate: string
    dividend_rate: string
    cash_fee_rate: string
    bank_fee_salary: string
    bank_fee_dividend: string
}

export type TaxCalc = Partial<
    Record<
        | "bank_income"
        | "bank_income_suggested"
        | "cash_income_gross"
        | "cash_fee"
        | "cash_income"
        | "bank_income_net"
        | "bank_vat"
        | "fuel_net"
        | "fuel_vat"
        | "rent_net"
        | "rent_vat"
        | "vat_pay"
        | "salary_net"
        | "salary_gross"
        | "pit"
        | "social"
        | "payroll_cost"
        | "after_costs"
        | "bank_fees"
        | "before_tax"
        | "profit_tax"
        | "net_profit"
        | "dividend_tax"
        | "dividend"
        | "cash_salary_back"
        | "cash_in"
        | "taxes",
        string
    >
> & { bank_income_auto?: boolean; kassa?: Record<string, string> }
