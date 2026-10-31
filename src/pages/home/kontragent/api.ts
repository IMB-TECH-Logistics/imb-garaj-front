import { useGet } from "@/hooks/useGet"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export const KONTRAGENT = "kontragent"
export const KONTRAGENT_SUMMARY = "kontragent/summary"
export const KONTRAGENT_PURCHASES = "kontragent/purchases"
export const KONTRAGENT_SALES = "kontragent/sales"
export const kontragentUrl = (id: number, tail = "") => `kontragent/${id}${tail ? `/${tail}` : ""}`

export type ContragentType = "investor" | "supplier" | "client" | "other"
export const CONTRAGENT_TYPES: ContragentType[] = ["investor", "supplier", "client", "other"]

export type Kontragent = {
    id: number
    name: string
    phone: string
    type: ContragentType
    comment: string
    balance: string
    taken: string
    given: string
    pending: string
    count: number
    last: string | null
    invested_usd: string
}

export type EntryDir = "in" | "out"
export type EntryKind = "cash" | "goods" | "service" | "trip"

export type LedgerRow = {
    id: number
    date: string
    dir: EntryDir
    kind: EntryKind
    comment: string
    status: "done" | "pending"
    amount: string
    balance: string
    is_manual: boolean
    editable?: boolean
    source: { type: "kassa" | "request" | "receipt" | "sale" | "manual"; id: number | null }
}

export type Investment = {
    id: number
    date: string
    kind: "cash" | "vehicle"
    vehicle: number | null
    vehicle_name: string | null
    amount_usd: string
    rate: string | null
    amount_uzs: string | null
    comment: string
}

export type Summary = {
    we_owe: string
    we_owe_count: number
    they_owe: string
    they_owe_count: number
    supplier_debt: string
    suppliers: { id: number; name: string; debt: string }[]
}

export const num = (v: string | number | null | undefined) => Number(v) || 0

export const som = (v: number | string) => `${Math.round(num(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} so'm`

export const usd = (v: number | string) => `$ ${Math.round(num(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`

export const TYPE_STYLE: Record<ContragentType, string> = {
    investor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    supplier: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    client: "bg-violet-500/10 text-violet-600 border-violet-500/30",
    other: "bg-muted text-muted-foreground border-border",
}

export const useKontragents = (type?: ContragentType | ContragentType[], enabled = true) =>
    useGet<Kontragent[]>(KONTRAGENT, {
        params: type ? { type: Array.isArray(type) ? type.join(",") : type } : undefined,
        enabled,
    })

export const useKontragentSummary = (enabled = true) => useGet<Summary>(KONTRAGENT_SUMMARY, { enabled })

export const useRefreshFinance = () => {
    const qc = useQueryClient()
    return () =>
        qc.invalidateQueries({
            predicate: (q) => {
                const key = String(q.queryKey[0])
                return key.startsWith("kontragent") || key.startsWith("checkout/kassa-v2") || key.startsWith("warehouse/")
            },
        })
}

export const errorText = (e: any, fallback: string) => {
    const data = e?.response?.data
    if (!data) return fallback
    if (typeof data === "string") return data
    const first = Object.values(data)[0]
    return Array.isArray(first) ? String(first[0]) : typeof first === "string" ? first : fallback
}

export const onApiError = (fallback: string) => (e: unknown) => toast.error(errorText(e, fallback))
