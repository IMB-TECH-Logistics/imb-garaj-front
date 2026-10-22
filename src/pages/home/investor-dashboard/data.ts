export const MONTHS = ["Okt 25", "Noy 25", "Dek 25", "Yan 26", "Fev 26", "Mar 26", "Apr 26", "May 26", "Iyn 26", "Iyl 26", "Avg 26", "Sen 26"]
export const JOURNAL_MONTHS = ["Okt 2025", "Noy 2025", "Dek 2025", "Yan 2026", "Fev 2026", "Mar 2026", "Apr 2026", "May 2026", "Iyn 2026", "Iyl 2026", "Avg 2026", "Sen 2026"]

export const PERIOD_LISTS: Record<string, string[]> = {
    month: ["Oktabr 2025", "Noyabr 2025", "Dekabr 2025", "Yanvar 2026", "Fevral 2026", "Mart 2026", "Aprel 2026", "May 2026", "Iyun 2026", "Iyul 2026", "Avgust 2026", "Sentabr 2026"],
    quarter: ["4-chorak 2025", "1-chorak 2026", "2-chorak 2026", "3-chorak 2026"],
    year: ["2025 yil", "2026 yil"],
}

export const MONEY = [
    { key: "income", label: "Tushum (QQS siz)", value: 54, prev: 61.2, upIsGood: true },
    { key: "expense", label: "Xarajat", value: 129, prev: 83.7, upIsGood: false },
    { key: "profit", label: "Sof foyda", value: -75, prev: -22.5, upIsGood: true, absDelta: true },
    { key: "cash", label: "Kassadagi pul", value: 141, prev: 168.4, upIsGood: true },
]

export const OPS = [
    { label: "Mashinalar", value: "3" },
    { label: "Reyslar", value: "13" },
    { label: "Masofa", value: "11 347 km" },
    { label: "Reysga tushum", money: 54 / 13 },
    { label: "Mashinaga foyda", money: -25 },
]

export const CO_REV = [88, 96, 82, 70, 79, 92, 104, 99, 86, 80, 61.2, 54]
export const CO_COST = [65.5, 62.2, 63.8, 81.1, 68.4, 64, 62.1, 63.1, 65.8, 67.1, 83.7, 129]

export const COST_TOTAL = 129

export type PnlRow = { label: string; value: number; kind?: "total" | "result" | "pct"; share?: string }

export const PNL: PnlRow[] = [
    { label: "Tushum (QQS siz)", value: 54, kind: "total" },
    { label: "Xarajatlar", value: 129, kind: "total" },
    { label: "Ijara to'lovlari (investorlarga)", value: 96, share: "chart-1" },
    { label: "Yoqilg'i", value: 18, share: "chart-3" },
    { label: "Haydovchilar ish haqi", value: 15, share: "chart-5" },
    { label: "Ta'mirlash, boshqa, amortizatsiya", value: 0 },
    { label: "Foyda solig'i", value: 0 },
    { label: "Sof foyda", value: -75, kind: "result" },
    { label: "Foyda foizi (rentabellik)", value: -139, kind: "pct" },
]

export type BalanceRow = { label: string; value: number; kind?: "total" | "good" | "debt" }

export const BALANCE: BalanceRow[] = [
    { label: "Avtopark (qoldiq qiymati)", value: 4622.9 },
    { label: "Kassadagi pul", value: 141 },
    { label: "Bizga qarzdorlar (debitorlik)", value: 0 },
    { label: "Ombordagi zaxira (TMB)", value: 0 },
    { label: "Jami aktivlar", value: 4763.8, kind: "total" },
    { label: "Biz to'laydigan qarz (investorlarga)", value: 96, kind: "debt" },
    { label: "Investor kapitali", value: 4667.9, kind: "total" },
    { label: "Aylanma mablag'", value: 45, kind: "good" },
]

export const INVESTORS = [
    { name: "IZUMI", idx: 1, fleet: 3722.9, lease: 72, color: "chart-1", trend: [12.4, 18.6, 9.8, -6.2, 4.5, 15.3, 22.1, 19.4, 11.0, 7.6, -12.8, -37.5] },
    { name: "VST", idx: 2, fleet: 900, lease: 24, color: "chart-3", trend: [10.1, 15.2, 8.4, -4.9, 6.1, 12.7, 19.8, 16.5, 9.2, 5.3, -9.7, -37.5] },
]

export type SummaryRow = { label: string; values: number[]; total: number; kind?: "total" | "debt" | "pct" }

export const SUMMARY: SummaryRow[] = [
    { label: "Avtoparkka sarmoya", values: [3722.9, 900], total: 4622.9 },
    { label: "Aylanma kapital", values: [60, 60], total: 120 },
    { label: "Foyda (zarar) ulushi", values: [-37.5, -37.5], total: -75 },
    { label: "Investor kapitali", values: [3745.4, 922.5], total: 4667.9, kind: "total" },
    { label: "To'lanmagan qarz (ijara)", values: [72, 24], total: 96, kind: "debt" },
    { label: "Ulush", values: [50, 50], total: 100, kind: "pct" },
]

export const WORKING_CAPITAL = 60
export const PROFIT_SHARE = -37.5
