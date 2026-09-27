export type VstDriverRow = {
    driver_id: number
    full_name: string
    trip_id: number
    balance: string
}

export type VstOverview = {
    mode: string
    started_at: string | null
    total: string
    garage: { id: number; name: string; balance: string }
    drivers: { id: number; total: string; computed_total: string; items: VstDriverRow[] }
    payers: { user_id: number; name: string; paid_total: string; pending_count: number }[]
    pending_requests: { count: number; sum: string }
}

export type VstSummary = {
    from_date: string
    to_date: string
    started_at: string | null
    start_balance: string
    income: { total: string; by_kind: Record<string, string> }
    outcome: { total: string; by_kind: Record<string, string> }
    end_balance: string
    residue: { garage: string; drivers: string }
    payer_paid: { user_id: number; name: string; to_drivers: string; expenses: string; total: string; count: number }[]
}

export type PaymentRequest = {
    id: number
    recipient_type: 1 | 2
    recipient_type_display: string
    driver: number | null
    driver_name: string | null
    trip: number | null
    vehicle: number | null
    vehicle_number: string | null
    category: number | null
    category_name: string | null
    amount: string
    comment: string | null
    payer_type: 1 | 2
    payer_type_display: string
    payer: number | null
    payer_name: string | null
    status: 10 | 20 | -10 | -20
    status_display: string
    rejected_comment: string | null
    creator: number
    creator_name: string | null
    paid_by_name: string | null
    paid_at: string | null
    created: string
    payer_report: number | null
}

export type PayerReportRow = {
    id: number
    paid_at: string | null
    recipient_type: 1 | 2
    driver_name: string | null
    vehicle: string | null
    category: string | null
    amount: string
    comment: string | null
    creator_name: string | null
    payer_report: number | null
}

export type PayerReportData = {
    id?: number
    payer: number
    payer_name?: string
    from_date: string
    to_date: string
    status?: number
    status_display?: string
    rows: PayerReportRow[]
    total: string
    count: number
    by_driver: { name: string; amount: string }[]
    by_category: { name: string; amount: string }[]
}

export type PayerReportListRow = {
    id: number
    payer: number
    payer_name: string
    from_date: string
    to_date: string
    total: string
    status: number
    status_display: string
    comment: string | null
    created: string
    created_by_name: string | null
    approved_by_name: string | null
    approved_at: string | null
}

export const formatDateTime = (value?: string | null) => {
    if (!value) return "—"
    const d = new Date(value)
    if (isNaN(d.getTime())) return "—"
    return d.toLocaleString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    })
}
