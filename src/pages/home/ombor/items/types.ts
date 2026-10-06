export type ItemState = "in_stock" | "installed" | "repair" | "written_off"

export type ItemCondition = "new" | "used"

export type ItemEventKind =
    | "received"
    | "installed"
    | "removed"
    | "repair"
    | "repair_returned"
    | "written_off"

export type ItemAction = "remove" | "repair" | "repair_return" | "write_off"

export type KmSource = "gps" | "manual"

export type WhItem = {
    id: number
    factory_number: string
    product: number
    product_name: string
    category: number
    category_name: string
    state: ItemState
    state_display: string
    condition: ItemCondition
    unit_price: string | number | null
    km_total: number | null
    current_tenant: number | null
    current_tenant_name: string | null
    vehicle_id: number | null
    vehicle_plate: string | null
    installed_at: string | null
    installed_odometer: number | null
    receipt: number | null
    receipt_date: string | null
    created_at: string
}

export type WhItemEvent = {
    id: number
    kind: ItemEventKind
    kind_display: string
    date: string
    tenant: number | null
    tenant_name: string | null
    vehicle_id: number | null
    vehicle_plate: string | null
    inspection_id: number | null
    odometer: number | null
    km_driven: number | null
    km_source: KmSource | null
    executor_name: string | null
    comment: string | null
    created_at: string
}

export type WhItemDetail = WhItem & { events: WhItemEvent[] }

export type KmSuggest = {
    source: "gps" | "odometer" | null
    km_driven: number | null
    last_odometer: number | null
}

export type ItemActionPayload = {
    action: ItemAction
    date: string
    odometer?: number
    km_driven?: number
    km_source?: KmSource
    comment?: string
}

export type ItemCategory = {
    id: number
    name: string
    unit: number
    unit_name: string
    is_serialized: boolean
    products_count: number
}

