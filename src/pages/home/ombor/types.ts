export type WhUnit = {
    id: number
    name: string
    products_count: number
}

export type WhProduct = {
    id: number
    name: string
    unit: number
    unit_name: string
    is_serialized: boolean
    min_quantity: string | null
    tire_km_limit?: number | null
    serial_prefix?: string | null
    life_years: number
    life_months: number
    life_days: number
    service_years: number | null
    service_months: number | null
    service_days: number | null
    qty_left: string
    avg_price: string | null
    value: string
}

export type WhLot = {
    id: number
    product: number
    product_name: string
    receipt: number | null
    lot_number: string
    expires_at: string | null
    unit_price: string
    qty_in: string
    qty_left: string
    expiry_status: string
    created_at: string
}

export type WhReceiptLine = {
    id: number
    receipt_id: number
    date: string
    product: number
    product_name: string
    unit_name: string
    lot_number: string
    expires_at: string | null
    quantity: string
    unit_price: string
    total: string
    comment: string | null
}

export type WhWithdrawal = {
    id: number
    product: number
    product_name: string
    lot: number
    lot_number: string
    quantity: string
    unit_name: string
    date: string
    source: string
    unit_price: string
    total: string
    tenant: number
    tenant_name: string
    tenant_schema: string
    inspection_id: number | null
    vehicle_id: number | null
    vehicle_plate: string
    executor_id: number | null
    executor_name: string
    is_debt: boolean
    created_at: string
}

export type WhLowStock = {
    id: number
    name: string
    unit_name: string
    qty_left: string
    min_quantity: string
}

export type WhTab = "receipts" | "withdrawals"

export type OmborSearchParams = {
    product?: number
    lot?: number
    tab?: WhTab
    receipt?: 1
    page?: number
    page_size?: number
    lpage?: number
    lpage_size?: number
    from_date?: string
    to_date?: string
    tenant?: number
    vehicle_plate?: string
    section?: "moves" | "others" | "transfers" | "debts" | "suppliers"
    direction?: "in" | "out"
    dtab?: "owed" | "mine"
    creditor?: number
    ppage?: number
    ppage_size?: number
    hpage?: number
    hpage_size?: number
    item?: number
    istate?: string
    icond?: string
    ipage?: number
    ipage_size?: number
    search?: string
}

export type WhWithdrawalFilters = {
    tenants: { id: number; name: string }[]
    vehicles: { plate: string }[]
}

export type WhOtherStock = {
    tenant: number
    tenant_name: string
    product: number
    product_name: string
    unit_name: string
    is_serialized: boolean
    qty_left: string
    avg_price: string | null
}

export type WhTransferLine = {
    id: number
    source_lot: number
    target_lot: number
    source_product_name: string
    target_product_name: string
    unit_name: string
    factory_number: string | null
    quantity: string
    unit_price: string
    total: string
}

export type WhTransfer = {
    id: number
    from_tenant: number
    from_tenant_name: string
    to_tenant: number
    to_tenant_name: string
    direction: "in" | "out"
    receipt: number | null
    date: string
    comment: string | null
    total: string
    executor_id: number | null
    executor_name: string
    lines?: WhTransferLine[]
    created_at: string
}

export type WhDebtor = {
    id: number
    schema_name: string
    name: string
    taken: string
    paid: string
    balance: string
    last_payment_date: string | null
}

export type WhDebtPayment = {
    id: number
    tenant: number
    tenant_name?: string
    creditor: number
    creditor_name: string
    direction: "received" | "paid"
    amount: string
    date: string
    comment: string | null
}

export type WhDebtHistoryRow = {
    type: "withdrawal" | "transfer" | "payment"
    id: number
    date: string
    vehicle_plate: string | null
    product_name: string | null
    quantity: string | null
    unit_price: string | null
    amount: string
    comment: string | null
}

export type WhMyDebt = {
    taken: string
    paid: string
    balance: string
    creditors: (WhDebtor & { id: number })[]
    history: ListResponse<WhDebtHistoryRow>
}
