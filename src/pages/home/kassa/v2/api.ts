import { useHasAction } from "@/constants/useUser"
import { useDelete } from "@/hooks/useDelete"
import { useGet } from "@/hooks/useGet"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useQueryClient } from "@tanstack/react-query"
import { useSearch } from "@tanstack/react-router"

export const KV2 = "checkout/kassa-v2"
export const KV2_OVERVIEW = `${KV2}/overview`
export const KV2_TRANSACTIONS = `${KV2}/transactions`
export const KV2_EXCEL = `${KV2}/transactions/excel`
export const KV2_INCOME = `${KV2}/income`
export const KV2_REQUESTS = `${KV2}/requests`
export const KV2_TRIPS = `${KV2}/trips`
export const KV2_DRIVERS = `${KV2}/drivers`
export const KV2_CATEGORIES = `${KV2}/expense-categories`
export const VEHICLES_LIST = "vehicles"

export type Dir = "in" | "out"
export type RequestKind = "avans" | "qoshimcha" | "qaytarish" | "berish" | "oylik" | "garaj_xarajat" | "avans_qaytarish"
export type ExpenseType = "texnik_korik" | "tamir" | "ombor"
export type TripStatus = "avans_kutilmoqda" | "yolda" | "yopilmoqda" | "yopildi"

export const KIND_LABEL: Record<RequestKind, string> = {
    avans: "Avans",
    qoshimcha: "Qo'shimcha pul",
    qaytarish: "Aylanma qoldig'i",
    berish: "Aylanma farqi",
    oylik: "Oylik",
    garaj_xarajat: "Garaj xarajati",
    avans_qaytarish: "Avans qoldig'i",
}
export const KIND_DIR: Record<RequestKind, Dir> = {
    avans: "out",
    qoshimcha: "out",
    qaytarish: "in",
    berish: "out",
    oylik: "out",
    garaj_xarajat: "out",
    avans_qaytarish: "in",
}
export const EXPENSE_TYPE_LABEL: Record<ExpenseType, string> = {
    texnik_korik: "Texnik ko'rik",
    tamir: "Ta'mirlash",
    ombor: "Ombor / xo'jalik",
}
export const WAREHOUSES = ["Asosiy ombor", "Ehtiyot qismlar ombori"]

export const STATUS = { PENDING: 10, PAID: 20, REJECTED: -10, CANCELED: -20 } as const

export type Overview = {
    balance: number
    start_balance: number | null
    started_at: string | null
    income: { total: number; external: number; trips: number; drivers: number; reversals: number }
    outcome: { total: number; avans: number; farq: number; oylik: number; garaj: number; reversals: number }
    drivers: { id: number; name: string; plate: string | null; balance: number }[]
    drivers_total: number
    pending_requests: number
}

export type KassaTx = {
    id: number
    amount: string
    dir: Dir
    kind: string
    kind_label: string
    expense_type: string | null
    party: string | null
    driver: number | null
    trip: number | null
    comment: string | null
    executor_name: string | null
    created: string
    edited_at: string | null
    reversed: { at: string; reason: string; by: string | null } | null
    reversal_of: number | null
    close?: (CloseBreakdown & { id: number; request: number }) | null
}

export type KassaRequest = {
    id: number
    kind: RequestKind
    kind_label: string
    status: number
    status_display: string
    amount: string
    expected_amount: string | null
    driver: number | null
    driver_name: string | null
    trip: number | null
    vehicle: number | null
    vehicle_number: string | null
    expense_type: ExpenseType | null
    expense_type_label: string | null
    warehouse: string | null
    product: string | null
    comment: string | null
    rejected_comment: string | null
    creator_name: string | null
    paid_by_name: string | null
    paid_at: string | null
    created: string
    close?: CloseBreakdown | null
}

export type KassaTrip = {
    id: number
    driver: number
    driver_name: string | null
    plate: string | null
    start: string | null
    end: string | null
    created: string
    status: TripStatus
    driver_balance: number
}

export type CloseBreakdown = {
    trip_start: string | null
    trip_end: string | null
    given: number
    earned: number
    spent: number
    due: number
    avans_left: number
    salary: number
    net: number
}

export type ClosePreview = {
    trip: number
    driver: number
    given: number
    earned: number
    spent: number
    due: number
    salary_default: number
    expenses: { id: number; amount: number; category: number | null; category_name: string | null; comment: string | null; date: string }[]
}

export type LedgerRow = {
    id: string
    kind: string
    amount: number
    reason: string
    trip: number | null
    comment: string | null
    date: string
    reversed?: boolean
}

export type Paged<T> = { results: T[]; total_pages?: number; count?: number; pending_ids?: number[] }

export const n = (v: string | number | null | undefined) => Number(v ?? 0)

export const money = (v: number | string | null | undefined) => {
    const x = Math.round(n(v))
    return (x < 0 ? "−" : "") + Math.abs(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

export const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return "—"
    const d = new Date(iso)
    const p = (x: number) => String(x).padStart(2, "0")
    return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export const usePeriod = () => {
    const search = useSearch({ strict: false }) as { from_date?: string; to_date?: string }
    return { from_date: search.from_date, to_date: search.to_date }
}

export const useKassaRoles = () => {
    const cashier = useHasAction("kassa_cashier_control" as never)
    const operator = useHasAction("kassa_operator_control" as never)
    return { cashier, operator }
}

export const useRefreshKassa = () => {
    const qc = useQueryClient()
    return () =>
        qc.invalidateQueries({
            predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith(KV2),
        })
}

export const useOverview = () => useGet<Overview>(KV2_OVERVIEW, { params: usePeriod() })

export const useKassaPost = (onDone?: () => void) => {
    const refresh = useRefreshKassa()
    return usePost({
        onSuccess: () => {
            refresh()
            onDone?.()
        },
        meta: { skipGlobalError: true },
    })
}

export const useKassaPatch = (onDone?: () => void) => {
    const refresh = useRefreshKassa()
    return usePatch({
        onSuccess: () => {
            refresh()
            onDone?.()
        },
        meta: { skipGlobalError: true },
    })
}

export const useKassaDelete = (onDone?: () => void) => {
    const refresh = useRefreshKassa()
    return useDelete({
        onSuccess: () => {
            refresh()
            onDone?.()
        },
        meta: { skipGlobalError: true },
    })
}

export const errorText = (e: any): string => {
    const d = e?.response?.data
    if (!d) return "Xatolik yuz berdi"
    if (typeof d === "string") return d.slice(0, 200)
    if (d.detail) return String(d.detail)
    const first = Object.values(d)[0]
    if (Array.isArray(first)) return String(first[0])
    if (typeof first === "string") return first
    return "Xatolik yuz berdi"
}
