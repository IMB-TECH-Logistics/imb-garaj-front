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
    life_years: number
    life_months: number
    life_days: number
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
    lpage?: number
    lpage_size?: number
    from_date?: string
    to_date?: string
    tenant?: number
    vehicle_plate?: string
    section?: "items" | "moves"
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
