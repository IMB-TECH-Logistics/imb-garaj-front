import { KassaRequest, KassaTx, KIND_DIR, n } from "./api"

export type KassaRow = KassaTx & { req?: KassaRequest }

export const requestRow = (r: KassaRequest): KassaRow => ({
    id: -r.id,
    amount: r.amount,
    dir: KIND_DIR[r.kind] ?? "out",
    kind: r.kind,
    kind_label: r.kind_label,
    expense_type: r.expense_type_label,
    party: requestWho(r),
    driver: r.driver,
    trip: r.trip,
    comment: r.comment,
    executor_name: r.creator_name,
    created: r.created,
    edited_at: null,
    reversed: null,
    reversal_of: null,
    close: r.close ? { ...r.close, id: -r.id, request: r.id } : null,
    req: r,
})

export const kindFilters = (t: (key: string) => string): [string, string][] => [
    ["all", t("fin.kv2.kind_filter_all")],
    ["kirim", t("fin.kv2.cash_in")],
    ["chiqim", t("fin.kv2.cash_out")],
    ["yopish", t("fin.kv2.close_turnover")],
    ["avans", t("form.advance")],
    ["garaj", t("vst.to_expense")],
    ["bekor", t("kassa.status_rollback")],
]

export const requestKindFilter = (r: KassaRequest) => {
    if (r.close || r.kind === "qaytarish" || r.kind === "berish" || r.kind === "oylik") return "yopish"
    if (r.kind === "garaj_xarajat") return "garaj"
    return "avans"
}

export const mergeCloses = (list: KassaRow[], closeLabel: string): KassaRow[] => {
    const seen = new Set<number>()
    const out: KassaRow[] = []
    for (const r of list) {
        if (!r.close) {
            out.push(r)
            continue
        }
        if (seen.has(r.close.id)) continue
        seen.add(r.close.id)
        const net = n(r.close.net)
        out.push({ ...r, amount: String(Math.abs(net)), dir: net >= 0 ? "in" : "out", kind_label: closeLabel, expense_type: null })
    }
    return out
}

const dm = (d: string | null) => (d ? `${d.slice(8, 10)}.${d.slice(5, 7)}` : "…")
export const tripPeriod = (a: string | null, b: string | null, ongoing: string) => `${dm(a)} – ${b ? dm(b) : ongoing}`

export const requestWho = (r: KassaRequest) => {
    if (r.kind !== "garaj_xarajat") return r.driver_name
    if (r.expense_type === "ombor") return [r.warehouse, r.product].filter(Boolean).join(" · ")
    return r.vehicle_number
}
