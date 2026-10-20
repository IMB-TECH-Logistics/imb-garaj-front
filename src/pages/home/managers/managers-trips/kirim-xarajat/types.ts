import { formatMoney } from "@/lib/format-money"

// ──── Types ────

export type FinanceRow = {
    id: number
    return_id?: number
    return_status?: number
    trip: number | null
    order: number | null
    loading_name: string | null
    unloading_name: string | null
    amount: number
    executor: number
    executor_name: string
    category: number
    category_name: string
    comment: string | null
    payment_type: number | null
    payment_type_name: string
    receipt: string | null
    quantity: string | null
    created: string
    updated: string
    petrol_station: number | null
    petrol_station_name: string | null
    added_after_close?: boolean
    action?: number
    category_code?: string | null
    history_count?: number
    pending_change?: { id: number; type: "edit" | "delete" | "return"; amount: number | null } | null
    advance?: number | null
    advance_spent?: number | null
    advance_left?: number | null
    advance_returned?: number | null
}

// Backend javobdagi summa doim so'mda
export function uzsOf(r: FinanceRow) {
    return Number(r.amount || 0)
}

export function formatAmount(row: FinanceRow) {
    return formatMoney(uzsOf(row))
}

export type Category = {
    id?: number
    name: string
    amount?: number
    total_amount?: number
    total_amount_uzs?: string
    code?: string | null
}
