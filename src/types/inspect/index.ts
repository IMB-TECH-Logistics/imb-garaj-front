type TechnicInspect = {
    id: number
    vehicle: number
    category: number
    date: string
    lifespan?: string | null
    comment: string
    amount: string | null
    category_code?: string | null
    items?: import("@/pages/home/texnik-check/types").ExpenseItem[]
}
