import ContragentsPage from "@/pages/home/kontragent"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/kontragentlar/")({
    component: ContragentsPage,
})
