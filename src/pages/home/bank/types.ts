export const BANK_TRANSACTION = "checkout/bank/transactions"

export type BankEditRow = {
    id: number
    created: string
    kind: "kirim" | "chiqim"
    amount: string
    note: string | null
    income_type: string | null
    expense_type: string | null
    kontragent: { id: number; name: string } | null
    petrol_station_id: number | null
    category_id: number | null
    comment: string | null
}
