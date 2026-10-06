import type { WhLot, WhProduct } from "../ombor/types"

export const TECH_INSPECTION_CODE = "technical_inspection"

export type LineSource = "qr" | "manual"

export type ExpenseItem = {
    id: number
    lot: number
    product: number
    product_name: string
    lot_number: string
    expires_at: string | null
    quantity: string
    unit_price: string
    total: string
    unit_name: string
    source: LineSource
    factory_number?: string | null
    odometer?: number | null
}

export type SerialProduct = WhProduct & {
    category?: number | null
    category_name?: string | null
    is_serialized?: boolean
}

export type SerialLot = WhLot & {
    factory_number?: string | null
    state?: "in_stock" | "installed" | "repair" | "written_off"
    condition?: "new" | "used"
}

export type ExpenseCategory = {
    id: number
    name: string
    code?: string | null
}

export type LineValues = {
    product: number | null
    lot: number | null
    quantity: string
    odometer?: string
    source: LineSource
}

export type ExpenseForm = {
    vehicle: number | null
    category: number | null
    amount: string | null
    date: string
    lifespan: string
    comment: string
    items: LineValues[]
}
