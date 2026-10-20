export type ImportAction = "created" | "updated" | "unchanged" | "error"

export type ImportRow = {
    line: number
    action: ImportAction
    direction_id: number | null
    label: string
    old_price: string | null
    new_price: string | null
    valid_from: string | null
    orders: number
    message: string
}

export type ImportResponse = {
    applied: boolean
    summary: Record<ImportAction | "orders" | "total", number>
    rows: ImportRow[]
}

export const ACTION_CLASS: Record<ImportAction, string> = {
    created: "bg-emerald-600 hover:bg-emerald-600 text-white",
    updated: "bg-blue-600 hover:bg-blue-600 text-white",
    unchanged: "bg-muted hover:bg-muted text-muted-foreground",
    error: "bg-destructive hover:bg-destructive text-destructive-foreground",
}
