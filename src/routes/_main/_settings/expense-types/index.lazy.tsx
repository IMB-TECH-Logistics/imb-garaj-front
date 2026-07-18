import ExpensesTypePage from "@/pages/home/settings/expenses-types"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/expense-types/")({
    component: ExpensesTypePage,
})
