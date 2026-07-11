export type ChartPalette = {
    income: string
    expense: string
    profit: string
    profitDark: string
    label: string
    swatch: [string, string, string]
}

export const PALETTES: ChartPalette[] = [
    {
        label: "Blue",
        income: "#26a69a",
        expense: "#ef5350",
        profit: "#60a5fa",
        profitDark: "#2563eb",
        swatch: ["#26a69a", "#60a5fa", "#ef5350"],
    },
]

export const PALETTE_STORE_KEY = "moliya-palette"
