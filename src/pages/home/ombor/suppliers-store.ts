import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Supplier = {
    id: number
    name: string
    phone: string
    comment: string
}

export type SupplierTxDir = "in" | "out"

export type SupplierTx = {
    id: number
    supplier_id: number
    date: string
    dir: SupplierTxDir
    amount: number
    comment: string
}

type State = {
    suppliers: Supplier[]
    txs: SupplierTx[]
    addSupplier: (v: Omit<Supplier, "id">) => number
    addTx: (v: Omit<SupplierTx, "id">) => void
}

const nextId = (rows: { id: number }[]) => rows.reduce((m, r) => Math.max(m, r.id), 0) + 1

export const useSuppliersStore = create<State>()(
    persist(
        (set, get) => ({
            suppliers: [
                { id: 1, name: "Neft-Servis", phone: "+998 90 111 22 33", comment: "Salyarka" },
                { id: 2, name: "Avto Zapchast Savdo", phone: "+998 93 444 55 66", comment: "Ehtiyot qismlar" },
            ],
            txs: [
                { id: 1, supplier_id: 1, date: "2026-10-02", dir: "in", amount: 10_000_000, comment: "Salyarka 800 L" },
                { id: 2, supplier_id: 1, date: "2026-10-10", dir: "out", amount: 4_000_000, comment: "" },
                { id: 3, supplier_id: 2, date: "2026-10-14", dir: "in", amount: 3_250_000, comment: "Tormoz kolodkasi, filtrlar" },
            ],
            addSupplier: (v) => {
                const id = nextId(get().suppliers)
                set((s) => ({ suppliers: [...s.suppliers, { ...v, id }] }))
                return id
            },
            addTx: (v) => set((s) => ({ txs: [...s.txs, { ...v, id: nextId(s.txs) }] })),
        }),
        { name: "suppliers-ui-sample-v1" },
    ),
)

export type SupplierRow = Supplier & { taken: number; paid: number; debt: number }

export const supplierRows = (suppliers: Supplier[], txs: SupplierTx[]): SupplierRow[] =>
    suppliers.map((s) => {
        const own = txs.filter((tx) => tx.supplier_id === s.id)
        const taken = own.filter((tx) => tx.dir === "in").reduce((sum, tx) => sum + tx.amount, 0)
        const paid = own.filter((tx) => tx.dir === "out").reduce((sum, tx) => sum + tx.amount, 0)
        return { ...s, taken, paid, debt: taken - paid }
    })

export type SupplierTxRow = SupplierTx & { balance: number }

export const supplierLedger = (txs: SupplierTx[]): SupplierTxRow[] => {
    let balance = 0
    return [...txs]
        .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
        .map((tx) => {
            balance += tx.dir === "in" ? tx.amount : -tx.amount
            return { ...tx, balance }
        })
        .reverse()
}
