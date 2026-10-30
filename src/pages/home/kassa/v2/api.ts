import { useHasAction } from "@/constants/useUser"
import { useDelete } from "@/hooks/useDelete"
import { buildQueryKey, getRequest, useGet } from "@/hooks/useGet"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useQueries, useQueryClient } from "@tanstack/react-query"
import { useSearch } from "@tanstack/react-router"
import i18n from "@/i18n/i18n"

export const KV2 = "checkout/kassa-v2"
export const KV2_OVERVIEW = `${KV2}/overview`
export const KV2_DRIVER_EXPENSES = `${KV2}/driver-expenses`
export const KV2_TRANSACTIONS = `${KV2}/transactions`
export const KV2_EXCEL = `${KV2}/transactions/excel`
export const KV2_INCOME = `${KV2}/income`
export const KV2_EXPENSE = `${KV2}/expense`
export const KV2_REQUESTS = `${KV2}/requests`
export const KV2_TRIPS = `${KV2}/trips`
export const KV2_DRIVERS = `${KV2}/drivers`
export const KV2_CATEGORIES = `${KV2}/expense-categories`
export const VEHICLES_LIST = "vehicles"

export type Dir = "in" | "out"
export type RequestKind = "avans" | "qoshimcha" | "qaytarish" | "berish" | "oylik" | "garaj_xarajat" | "avans_qaytarish"
export type ExpenseType = "texnik_korik" | "tamir" | "ombor"
export type TripStatus = "avans_kutilmoqda" | "avans_rad_etildi" | "yolda" | "yopilmoqda" | "rad_etildi" | "yopildi"

export const KIND_LABEL_KEY: Record<RequestKind, string> = {
    avans: "fin.kv2_kind.avans",
    qoshimcha: "fin.kv2_kind.qoshimcha",
    qaytarish: "fin.kv2_kind.qaytarish",
    berish: "fin.kv2_kind.berish",
    oylik: "fin.kv2_kind.oylik",
    garaj_xarajat: "fin.kv2_kind.garaj_xarajat",
    avans_qaytarish: "fin.kv2_kind.avans_qaytarish",
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
export const EXPENSE_TYPE_LABEL_KEY: Record<ExpenseType, string> = {
    texnik_korik: "fin.kv2_expense_type.texnik_korik",
    tamir: "fin.kv2_expense_type.tamir",
    ombor: "fin.kv2_expense_type.ombor",
}
export const WAREHOUSES = ["Asosiy ombor", "Ehtiyot qismlar ombori"]

export const STATUS = { PENDING: 10, PAID: 20, REJECTED: -10, CANCELED: -20 } as const

export type Overview = {
    summary: {
        opening: number | null
        closing: number
        drivers_opening?: number
        drivers_closing?: number
        income: { total: number; external: number; trip_cash: number; reversals: number; loans?: number; vst_trips?: number }
        expense: { total: number; cash: number; fuel?: number; other?: number; salary_cash?: number; by_category?: ExpenseByCategory[]; oylik: number; garaj: number; reversals: number }
        other_expense?: { total: number; garaj: number; chiqim: number; ombor?: number }
        income_by_type?: { vst: number; investor: number; other: number } | null
        drivers: { net: number; given: number; trip_cash: number; cash: number; returned: number }
    }
    balance: number
    start_balance: number | null
    started_at: string | null
    income: { total: number; external: number; trips: number; drivers: number; reversals: number }
    outcome: { total: number; avans: number; farq: number; oylik: number; garaj: number; reversals: number }
    drivers: {
        id: number
        name: string
        plate: string | null
        balance: number
        held?: number
        unconfirmed_expense?: number
        unconfirmed_salary?: number
        unconfirmed_total?: number
        unconfirmed_left?: number
    }[]
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
    source?: string | null
    driver: number | null
    trip: number | null
    comment: string | null
    executor_name: string | null
    created: string
    edited_at: string | null
    reversed: { at: string; reason: string; by: string | null } | null
    reversal_of: number | null
    close?: (CloseBreakdown & { id: number; request: number }) | null
    can_reverse?: boolean
    can_edit?: boolean
    vehicles?: { id: number; plate: string | null }[]
    income_type?: "vst" | "investor" | "other" | null
    kontragent?: number | null
}

export const looseRequests = (reqs: KassaRequest[] | undefined, trips: KassaTrip[] | undefined) => {
    const onTrips = new Set<number>()
    ;(trips ?? []).forEach((tr) => {
        if (tr.avans_request) onTrips.add(tr.avans_request.id)
        if (tr.close_request) onTrips.add(tr.close_request.id)
    })
    return (reqs ?? []).filter((q) => !onTrips.has(q.id) && (q.status === STATUS.PENDING || q.can_unreject))
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
    trip_end?: string | null
    can_manage?: boolean
    reverse_tx?: number | null
    can_unreject?: boolean
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
    given: number
    avans_request: KassaRequest | null
    close_request: KassaRequest | null
    close_amount?: number | string | null
    salary_paid?: number | string
    carried?: number | string
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
    other_expenses: { id: number; amount: number; category_name: string | null; payment_type: string | null; station: string | null; route: string | null; comment: string | null; date: string }[]
    other_spent: number
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
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export const usePeriod = () => {
    const search = useSearch({ strict: false }) as { from_date?: string; to_date?: string }
    return { from_date: search.from_date, to_date: search.to_date }
}

export const useKassaRoles = () => {
    const cashier = useHasAction("kassa_cashier_control" as never)
    return { cashier }
}

export const useRefreshKassa = () => {
    const qc = useQueryClient()
    return () =>
        qc.invalidateQueries({
            predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith(KV2),
        })
}

// Backend sahifani 1000 qatorga kesadi (HeavyListPagination), shuning uchun davr tranzaksiyalari
// bitta so'rovga sig'masligi mumkin: 1-sahifa (total_pages bilan) + qolgan sahifalar. Hammasi
// kelmaguncha `undefined` qaytadi (yorliqda noto'liq son ko'rinmasin).
const TX_PAGE_SIZE = 1000

export const useAllPeriodTx = (period: { from_date?: string; to_date?: string }): KassaTx[] | undefined => {
    const params = { ...period, page_size: TX_PAGE_SIZE }
    const { data: first } = useGet<Paged<KassaTx>>(KV2_TRANSACTIONS, { params })
    const extraPages = Math.max((first?.total_pages ?? 1) - 1, 0)
    const rest = useQueries({
        queries: Array.from({ length: extraPages }, (_, i) => {
            const pageParams = { ...params, page: i + 2 }
            return {
                queryKey: buildQueryKey(KV2_TRANSACTIONS, pageParams),
                queryFn: (): Promise<Paged<KassaTx>> => getRequest(KV2_TRANSACTIONS, { params: pageParams }),
                staleTime: 1000 * 5 * 60,
            }
        }),
        combine: (results) => (results.every((r) => r.data) ? results.flatMap((r) => r.data!.results) : undefined),
    })
    if (!first || !rest) return undefined
    return [...first.results, ...rest]
}

export type ExpenseByCategory = { id: number | null; name: string | null; code: string | null; amount: number | string }

export type DriverExpense = { id: number | string; date: string; amount: number | string; category: string | null; driver: string | null; plate: string | null; trip: number | null; comment: string | null; loading?: string | null; unloading?: string | null; order_date?: string | null }

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
    if (!d) return i18n.t("messages.error")
    if (typeof d === "string") return d.slice(0, 200)
    if (d.detail) return String(d.detail)
    const first = Object.values(d)[0]
    if (Array.isArray(first)) return String(first[0])
    if (typeof first === "string") return first
    return i18n.t("messages.error")
}
