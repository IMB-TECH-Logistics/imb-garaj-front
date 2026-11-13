import BankPage from "@/pages/home/bank"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/bank/")({
    component: BankPage,
})
