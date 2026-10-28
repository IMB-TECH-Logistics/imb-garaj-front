import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ContragentType = "investor" | "supplier" | "client" | "other"

export const CONTRAGENT_TYPES: ContragentType[] = ["investor", "supplier", "client", "other"]

export type Contragent = {
    id: number
    name: string
    phone: string
    type: ContragentType
    comment: string
}

export type ContragentTxDir = "in" | "out"

export type ContragentTxKind = "cash" | "goods" | "service" | "trip"

export type ContragentTx = {
    id: number
    contragent_id: number
    date: string
    dir: ContragentTxDir
    kind: ContragentTxKind
    amount: number
    comment: string
}

type State = {
    contragents: Contragent[]
    txs: ContragentTx[]
    addContragent: (v: Omit<Contragent, "id">) => number
    addTx: (v: Omit<ContragentTx, "id">) => void
}

const nextId = (rows: { id: number }[]) => rows.reduce((m, r) => Math.max(m, r.id), 0) + 1

export const useContragentStore = create<State>()(
    persist(
        (set, get) => ({
            contragents: [
                { id: 1, name: "Izumi Invest", phone: "+998 90 123 45 67", type: "investor", comment: "" },
                { id: 2, name: "Neft-Servis", phone: "+998 90 111 22 33", type: "supplier", comment: "Salyarka" },
                { id: 3, name: "Agro Export MChJ", phone: "+998 91 222 33 44", type: "client", comment: "Naqd reys buyurtmachisi" },
                { id: 4, name: "Akmal aka", phone: "+998 93 555 66 77", type: "other", comment: "Qo'shni" },
            ],
            txs: [
                { id: 1, contragent_id: 1, date: "2026-10-03", dir: "in", kind: "cash", amount: 4_000_000, comment: "Kassaga qarz" },
                { id: 2, contragent_id: 1, date: "2026-10-20", dir: "out", kind: "cash", amount: 3_000_000, comment: "Qarz qaytarildi" },
                { id: 3, contragent_id: 2, date: "2026-10-02", dir: "in", kind: "goods", amount: 10_000_000, comment: "Salyarka 800 L" },
                { id: 4, contragent_id: 2, date: "2026-10-10", dir: "out", kind: "cash", amount: 4_000_000, comment: "" },
                { id: 5, contragent_id: 3, date: "2026-10-12", dir: "out", kind: "trip", amount: 8_500_000, comment: "Toshkent → Samarqand, naqd reys" },
                { id: 6, contragent_id: 3, date: "2026-10-18", dir: "in", kind: "cash", amount: 5_000_000, comment: "Reys puli qisman" },
                { id: 7, contragent_id: 4, date: "2026-10-22", dir: "in", kind: "cash", amount: 1_000_000, comment: "Yoqilg'iga yetmadi" },
            ],
            addContragent: (v) => {
                const id = nextId(get().contragents)
                set((s) => ({ contragents: [...s.contragents, { ...v, id }] }))
                return id
            },
            addTx: (v) => set((s) => ({ txs: [...s.txs, { ...v, id: nextId(s.txs) }] })),
        }),
        { name: "contragents-ui-sample-v1" },
    ),
)

export type ContragentRow = Contragent & { balance: number; last: string | null; count: number }

export const contragentRows = (contragents: Contragent[], txs: ContragentTx[]): ContragentRow[] =>
    contragents.map((c) => {
        const own = txs.filter((tx) => tx.contragent_id === c.id)
        const balance = own.reduce((s, tx) => s + (tx.dir === "in" ? tx.amount : -tx.amount), 0)
        const last = own.reduce<string | null>((m, tx) => (!m || tx.date > m ? tx.date : m), null)
        return { ...c, balance, last, count: own.length }
    })

export type ContragentTxRow = ContragentTx & { balance: number }

export const contragentLedger = (txs: ContragentTx[]): ContragentTxRow[] => {
    let balance = 0
    return [...txs]
        .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
        .map((tx) => {
            balance += tx.dir === "in" ? tx.amount : -tx.amount
            return { ...tx, balance }
        })
        .reverse()
}

export const som = (v: number) => `${Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} so'm`

export const TYPE_STYLE: Record<ContragentType, string> = {
    investor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    supplier: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    client: "bg-violet-500/10 text-violet-600 border-violet-500/30",
    other: "bg-muted text-muted-foreground border-border",
}
