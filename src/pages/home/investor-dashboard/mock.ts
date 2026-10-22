import type { BalanceRow, PnlRow, SummaryRow } from "./data"

export type PeriodKind = "month" | "quarter" | "year"

export type DashboardMock = {
    periodLabel: string
    prevLabel: string
    banner: { title: string; text: string }
    money: { key: "income" | "expense" | "profit" | "cash"; label: string; value: number; prev: number; upIsGood: boolean; absDelta?: boolean }[]
    ops: { label: string; value?: string; money?: number }[]
    months: string[]
    coRev: number[]
    coCost: number[]
    costTotal: number
    pnl: PnlRow[]
    balance: BalanceRow[]
    investors: { name: string; idx: number; fleet: number; lease: number; color: "chart-1" | "chart-3"; trend: number[] }[]
    summary: SummaryRow[]
    workingCapital: number
    profitShare: number
    journalMonths: string[]
    journal: Record<string, number[][]>
}

const MONTH_FULL = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"]
const MONTH_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"]
const MONTH_DATIVE = ["yanvarga", "fevralga", "martga", "aprelga", "mayga", "iyunga", "iyulga", "avgustga", "sentabrga", "oktabrga", "noyabrga", "dekabrga"]

export const PERIOD_LISTS: Record<PeriodKind, string[]> = {
    month: ["Oktabr 2025", "Noyabr 2025", "Dekabr 2025", "Yanvar 2026", "Fevral 2026", "Mart 2026", "Aprel 2026", "May 2026", "Iyun 2026", "Iyul 2026", "Avgust 2026", "Sentabr 2026"],
    quarter: ["4-chorak 2025", "1-chorak 2026", "2-chorak 2026", "3-chorak 2026"],
    year: ["2025 yil", "2026 yil"],
}

const START_YEAR = 2023
const START_MONTH = 9
const LAST_REV = [88, 96, 82, 70, 79, 92, 104, 99, 86, 80, 61.2, 54]
const LAST_COST = [65.5, 62.2, 63.8, 81.1, 68.4, 64, 62.1, 63.1, 65.8, 67.1, 83.7, 129]
const TOTAL_MONTHS = 36

type Month = {
    year: number
    month: number
    rev: number
    lease: number
    fuel: number
    salary: number
    repair: number
    cost: number
    net: number
    cash: number
    trips: number
    km: number
}

const r1 = (v: number) => Math.round(v * 10) / 10

const MONTHS_DATA: Month[] = (() => {
    const rows: Month[] = []
    for (let i = 0; i < TOTAL_MONTHS; i++) {
        const abs = START_MONTH + i
        const year = START_YEAR + Math.floor(abs / 12)
        const month = abs % 12
        const li = i % 12
        const age = Math.floor((TOTAL_MONTHS - 1 - i) / 12)
        const factor = Math.pow(0.92, age)
        const rev = r1(LAST_REV[li] * factor)
        const cost = r1(LAST_COST[li] * (age ? Math.pow(0.95, age) : 1))
        const exactSep = i === TOTAL_MONTHS - 1
        const lease = exactSep ? 96 : r1(cost * 0.45)
        const fuel = exactSep ? 18 : r1(cost * 0.3)
        const salary = exactSep ? 15 : r1(cost * 0.2)
        const repair = r1(cost - lease - fuel - salary)
        const trips = exactSep ? 13 : Math.max(1, Math.round(rev / 4.15))
        rows.push({
            year, month, rev, lease, fuel, salary, repair, cost,
            net: r1(rev - cost),
            cash: 0,
            trips,
            km: exactSep ? 11347 : Math.round(trips * 872.85),
        })
    }
    let cash = 141
    for (let i = rows.length - 1; i >= 0; i--) {
        rows[i].cash = r1(cash)
        cash = i === rows.length - 1 ? 168.4 : cash - rows[i].net * 0.4
    }
    return rows
})()

const indexOf = (year: number, month: number) => (year - START_YEAR) * 12 + month - START_MONTH

const periodRange = (kind: PeriodKind, label: string): [number, number] => {
    const year = Number(label.match(/(\d{4})/)?.[1] ?? 2026)
    if (kind === "month") {
        const m = Math.max(0, MONTH_FULL.findIndex((n) => label.startsWith(n)))
        const i = indexOf(year, m)
        return [i, i]
    }
    if (kind === "quarter") {
        const q = Number(label[0]) - 1
        return [indexOf(year, q * 3), Math.min(indexOf(year, q * 3 + 2), TOTAL_MONTHS - 1)]
    }
    return [Math.max(indexOf(year, 0), 0), Math.min(indexOf(year, 11), TOTAL_MONTHS - 1)]
}

const prevRange = (kind: PeriodKind, [a, b]: [number, number]): [number, number] => {
    const len = kind === "month" ? 1 : kind === "quarter" ? 3 : 12
    return [Math.max(a - len, 0), Math.max(b - len, 0)]
}

const sum = (a: number, b: number, f: (m: Month) => number) => {
    let s = 0
    for (let i = a; i <= b; i++) s += f(MONTHS_DATA[i])
    return r1(s)
}

const prevLabelOf = (kind: PeriodKind, label: string) => {
    const year = Number(label.match(/(\d{4})/)?.[1] ?? 2026)
    if (kind === "month") {
        const m = MONTH_FULL.findIndex((n) => label.startsWith(n))
        return MONTH_DATIVE[(m + 11) % 12]
    }
    if (kind === "quarter") {
        const q = Number(label[0])
        return q === 1 ? `${year - 1} yil 4-chorakka` : `${q - 1}-chorakka`
    }
    return `${year - 1} yilga`
}

const INVESTOR_DEFS = [
    { name: "IZUMI", idx: 1, fleet: 3722.9, leaseShare: 0.75, color: "chart-1" as const },
    { name: "VST", idx: 2, fleet: 900, leaseShare: 0.25, color: "chart-3" as const },
]
const WORKING_CAPITAL = 60
const PROFIT_SPLIT = 0.5
const FLEET = 4622.9

export function getMock(kind: PeriodKind, label: string): DashboardMock {
    const [a, b] = periodRange(kind, label)
    const [pa, pb] = prevRange(kind, [a, b])
    const income = sum(a, b, (m) => m.rev)
    const lease = sum(a, b, (m) => m.lease)
    const fuel = sum(a, b, (m) => m.fuel)
    const salary = sum(a, b, (m) => m.salary)
    const repair = sum(a, b, (m) => m.repair)
    const expense = r1(lease + fuel + salary + repair)
    const profit = r1(income - expense)
    const cash = MONTHS_DATA[b].cash
    const prevIncome = sum(pa, pb, (m) => m.rev)
    const prevExpense = sum(pa, pb, (m) => m.cost)
    const trips = sum(a, b, (m) => m.trips)
    const km = sum(a, b, (m) => m.km)
    const debt = MONTHS_DATA[b].lease

    const last12 = Array.from({ length: 12 }, (_, k) => MONTHS_DATA[Math.max(b - 11 + k, 0)])
    const months = last12.map((m) => `${MONTH_SHORT[m.month]} ${String(m.year).slice(2)}`)
    const journalMonths = last12.map((m) => `${MONTH_SHORT[m.month]} ${m.year}`)

    const totalAssets = r1(FLEET + cash)
    const capital = r1(totalAssets - debt)
    const profitShare = r1(profit * PROFIT_SPLIT)

    const topShare = expense > 0 ? Math.round((lease / expense) * 100) : 0
    const ratio = income > 0 ? expense / income : 0
    const banner =
        profit < 0 ?
            {
                title: `${label}: davr zarar bilan yopildi`,
                text: `Xarajat tushumdan ${ratio.toFixed(1).replace(".", ",")} baravar ko'p bo'ldi. Asosiy sabab — investorlarga ijara to'lovlari: ular xarajatning ${topShare}% ini tashkil qiladi.`,
            }
        :   {
                title: `${label}: davr foyda bilan yopildi`,
                text: `Xarajat tushumning ${Math.round(ratio * 100)}% ini tashkil qildi. Eng katta xarajat — investorlarga ijara to'lovlari (${topShare}%).`,
            }

    const investors = INVESTOR_DEFS.map((d) => ({
        name: d.name,
        idx: d.idx,
        fleet: d.fleet,
        lease: r1(debt * d.leaseShare),
        color: d.color,
        trend: last12.map((m) => r1(m.net * PROFIT_SPLIT)),
    }))

    const journal: Record<string, number[][]> = {}
    for (const d of INVESTOR_DEFS) {
        journal[d.name] = last12.map((m, k) => {
            const leaseAcc = r1(m.lease * d.leaseShare)
            const profitAcc = r1(Math.max(m.net, 0) * PROFIT_SPLIT)
            return [leaseAcc, profitAcc, k === 11 ? 0 : leaseAcc, k >= 10 ? 0 : profitAcc]
        })
    }

    return {
        periodLabel: label,
        prevLabel: prevLabelOf(kind, label),
        banner,
        money: [
            { key: "income", label: "Tushum (QQS siz)", value: income, prev: prevIncome, upIsGood: true },
            { key: "expense", label: "Xarajat", value: expense, prev: prevExpense, upIsGood: false },
            { key: "profit", label: "Sof foyda", value: profit, prev: r1(prevIncome - prevExpense), upIsGood: true, absDelta: true },
            { key: "cash", label: "Kassadagi pul", value: cash, prev: MONTHS_DATA[pb].cash, upIsGood: true },
        ],
        ops: [
            { label: "Mashinalar", value: "3" },
            { label: "Reyslar", value: String(trips) },
            { label: "Masofa", value: `${km.toLocaleString("ru-RU").replace(/ /g, " ")} km` },
            { label: "Reysga tushum", money: trips ? income / trips : 0 },
            { label: "Mashinaga foyda", money: profit / 3 },
        ],
        months,
        coRev: last12.map((m) => m.rev),
        coCost: last12.map((m) => m.cost),
        costTotal: expense,
        pnl: [
            { label: "Tushum (QQS siz)", value: income, kind: "total" },
            { label: "Xarajatlar", value: expense, kind: "total" },
            { label: "Ijara to'lovlari (investorlarga)", value: lease, share: "chart-1" },
            { label: "Yoqilg'i", value: fuel, share: "chart-3" },
            { label: "Haydovchilar ish haqi", value: salary, share: "chart-5" },
            { label: "Ta'mirlash, boshqa, amortizatsiya", value: repair },
            { label: "Foyda solig'i", value: 0 },
            { label: "Sof foyda", value: profit, kind: "result" },
            { label: "Foyda foizi (rentabellik)", value: income ? r1((profit / income) * 100) : 0, kind: "pct" },
        ],
        balance: [
            { label: "Avtopark (qoldiq qiymati)", value: FLEET },
            { label: "Kassadagi pul", value: cash },
            { label: "Bizga qarzdorlar (debitorlik)", value: 0 },
            { label: "Ombordagi zaxira (TMB)", value: 0 },
            { label: "Jami aktivlar", value: totalAssets, kind: "total" },
            { label: "Biz to'laydigan qarz (investorlarga)", value: debt, kind: "debt" },
            { label: "Investor kapitali", value: capital, kind: "total" },
            { label: "Aylanma mablag'", value: r1(cash - debt), kind: "good" },
        ],
        investors,
        summary: [
            { label: "Avtoparkka sarmoya", values: INVESTOR_DEFS.map((d) => d.fleet), total: FLEET },
            { label: "Aylanma kapital", values: INVESTOR_DEFS.map(() => WORKING_CAPITAL), total: WORKING_CAPITAL * INVESTOR_DEFS.length },
            { label: "Foyda (zarar) ulushi", values: INVESTOR_DEFS.map(() => profitShare), total: r1(profitShare * INVESTOR_DEFS.length) },
            {
                label: "Investor kapitali",
                values: INVESTOR_DEFS.map((d) => r1(d.fleet + WORKING_CAPITAL + profitShare)),
                total: r1(FLEET + WORKING_CAPITAL * INVESTOR_DEFS.length + profitShare * INVESTOR_DEFS.length),
                kind: "total",
            },
            { label: "To'lanmagan qarz (ijara)", values: INVESTOR_DEFS.map((d) => r1(debt * d.leaseShare)), total: debt, kind: "debt" },
            { label: "Ulush", values: INVESTOR_DEFS.map(() => 50), total: 100, kind: "pct" },
        ],
        workingCapital: WORKING_CAPITAL,
        profitShare,
        journalMonths,
        journal,
    }
}
