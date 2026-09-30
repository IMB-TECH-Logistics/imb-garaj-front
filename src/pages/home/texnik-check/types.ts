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
    source: LineSource
}

export type ExpenseForm = {
    vehicle: number | null
    category: number | null
    amount: string | null
    date: string
    comment: string
    items: LineValues[]
}
