import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Investor = {
    id: number
    name: string
    phone: string
    comment: string
}

export type InvestmentKind = "cash" | "vehicle"

export type Investment = {
    id: number
    investor_id: number
    date: string
    kind: InvestmentKind
    vehicle: string
    amount: number
    comment: string
}

export type LoanDir = "in" | "out"

export type LoanTx = {
    id: number
    investor_id: number
    date: string
    dir: LoanDir
    amount: number
    comment: string
}

type State = {
    investors: Investor[]
    investments: Investment[]
    loanTxs: LoanTx[]
    addInvestor: (v: Omit<Investor, "id">) => number
    addInvestment: (v: Omit<Investment, "id">) => void
    addLoanTx: (v: Omit<LoanTx, "id">) => void
}

const nextId = (rows: { id: number }[]) => rows.reduce((m, r) => Math.max(m, r.id), 0) + 1

const SAMPLE = {
    investors: [
        { id: 1, name: "Izumi Invest", phone: "+998 90 123 45 67", comment: "" },
        { id: 2, name: "Izumi Vodiy Star", phone: "+998 91 765 43 21", comment: "" },
    ],
    investments: [
        { id: 1, investor_id: 1, date: "2026-09-01", kind: "vehicle" as const, vehicle: "01 M 024950", amount: 100_000, comment: "" },
        { id: 2, investor_id: 1, date: "2026-09-01", kind: "vehicle" as const, vehicle: "01 M 024951", amount: 100_000, comment: "" },
        { id: 3, investor_id: 1, date: "2026-09-01", kind: "vehicle" as const, vehicle: "01 M 024948", amount: 100_000, comment: "" },
        { id: 4, investor_id: 1, date: "2026-09-05", kind: "cash" as const, vehicle: "", amount: 10_000, comment: "Aylanma uchun" },
        { id: 5, investor_id: 2, date: "2026-09-05", kind: "cash" as const, vehicle: "", amount: 10_000, comment: "Aylanma uchun" },
    ],
    loanTxs: [
        { id: 1, investor_id: 1, date: "2026-10-03", dir: "in" as const, amount: 200, comment: "Yoqilg'i uchun kassa yetmadi" },
        { id: 2, investor_id: 1, date: "2026-10-08", dir: "in" as const, amount: 200, comment: "" },
        { id: 3, investor_id: 1, date: "2026-10-20", dir: "out" as const, amount: 300, comment: "" },
        { id: 4, investor_id: 2, date: "2026-10-15", dir: "in" as const, amount: 2_000, comment: "" },
    ],
}

export const useInvestorsStore = create<State>()(
    persist(
        (set, get) => ({
            ...SAMPLE,
            addInvestor: (v) => {
                const id = nextId(get().investors)
                set((s) => ({ investors: [...s.investors, { ...v, id }] }))
                return id
            },
            addInvestment: (v) => set((s) => ({ investments: [...s.investments, { ...v, id: nextId(s.investments) }] })),
            addLoanTx: (v) => set((s) => ({ loanTxs: [...s.loanTxs, { ...v, id: nextId(s.loanTxs) }] })),
        }),
        { name: "investors-ui-sample-v2" },
    ),
)

export type LoanTxRow = LoanTx & { balance: number }

export const loanLedger = (txs: LoanTx[]): LoanTxRow[] => {
    let balance = 0
    return [...txs]
        .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
        .map((tx) => {
            balance += tx.dir === "in" ? tx.amount : -tx.amount
            return { ...tx, balance }
        })
        .reverse()
}

export type InvestorRow = Investor & {
    invested: number
    share: number
    loaned: number
    repaid: number
    loan_left: number
}

export const investorRows = (s: Pick<State, "investors" | "investments" | "loanTxs">): InvestorRow[] => {
    const totalInvested = s.investments.reduce((sum, i) => sum + i.amount, 0)
    return s.investors.map((inv) => {
        const invested = s.investments.filter((i) => i.investor_id === inv.id).reduce((sum, i) => sum + i.amount, 0)
        const own = s.loanTxs.filter((tx) => tx.investor_id === inv.id)
        const loaned = own.filter((tx) => tx.dir === "in").reduce((sum, tx) => sum + tx.amount, 0)
        const repaid = own.filter((tx) => tx.dir === "out").reduce((sum, tx) => sum + tx.amount, 0)
        return {
            ...inv,
            invested,
            share: totalInvested ? (invested / totalInvested) * 100 : 0,
            loaned,
            repaid,
            loan_left: loaned - repaid,
        }
    })
}

export const usd = (v: number) => `$ ${Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`

export const pct = (v: number) => `${v.toFixed(1).replace(".", ",").replace(",0", "")}%`
