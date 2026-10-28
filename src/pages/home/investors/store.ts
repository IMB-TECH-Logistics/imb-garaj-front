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

export type Loan = {
    id: number
    investor_id: number
    date: string
    due_date: string | null
    amount: number
    comment: string
}

export type Repayment = {
    id: number
    loan_id: number
    date: string
    amount: number
    comment: string
}

type State = {
    investors: Investor[]
    investments: Investment[]
    loans: Loan[]
    repayments: Repayment[]
    addInvestor: (v: Omit<Investor, "id">) => number
    addInvestment: (v: Omit<Investment, "id">) => void
    addLoan: (v: Omit<Loan, "id">) => void
    addRepayment: (v: Omit<Repayment, "id">) => void
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
    loans: [
        { id: 1, investor_id: 1, date: "2026-10-03", due_date: "2026-11-03", amount: 5_000, comment: "Yoqilg'i uchun kassa yetmadi" },
        { id: 2, investor_id: 2, date: "2026-10-15", due_date: null, amount: 2_000, comment: "" },
    ],
    repayments: [
        { id: 1, loan_id: 1, date: "2026-10-20", amount: 2_000, comment: "" },
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
            addLoan: (v) => set((s) => ({ loans: [...s.loans, { ...v, id: nextId(s.loans) }] })),
            addRepayment: (v) => set((s) => ({ repayments: [...s.repayments, { ...v, id: nextId(s.repayments) }] })),
        }),
        { name: "investors-ui-sample-v1" },
    ),
)

export type LoanRow = Loan & { paid: number; left: number; status: "open" | "partial" | "paid" | "overdue" }

export const loanRows = (loans: Loan[], repayments: Repayment[], today = new Date().toISOString().slice(0, 10)): LoanRow[] =>
    loans.map((l) => {
        const paid = repayments.filter((r) => r.loan_id === l.id).reduce((s, r) => s + r.amount, 0)
        const left = Math.max(l.amount - paid, 0)
        const status =
            left === 0 ? "paid"
            : l.due_date && l.due_date < today ? "overdue"
            : paid > 0 ? "partial"
            : "open"
        return { ...l, paid, left, status }
    })

export type InvestorRow = Investor & {
    invested: number
    share: number
    loaned: number
    loan_left: number
}

export const investorRows = (s: Pick<State, "investors" | "investments" | "loans" | "repayments">): InvestorRow[] => {
    const totalInvested = s.investments.reduce((sum, i) => sum + i.amount, 0)
    const loans = loanRows(s.loans, s.repayments)
    return s.investors.map((inv) => {
        const invested = s.investments.filter((i) => i.investor_id === inv.id).reduce((sum, i) => sum + i.amount, 0)
        const own = loans.filter((l) => l.investor_id === inv.id)
        return {
            ...inv,
            invested,
            share: totalInvested ? (invested / totalInvested) * 100 : 0,
            loaned: own.reduce((sum, l) => sum + l.amount, 0),
            loan_left: own.reduce((sum, l) => sum + l.left, 0),
        }
    })
}

export const usd = (v: number) => `$ ${Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`

export const pct = (v: number) => `${v.toFixed(1).replace(".", ",").replace(",0", "")}%`
