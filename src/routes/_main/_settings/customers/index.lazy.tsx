import Customers from "@/pages/home/settings/customers"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/customers/")({
    component: Customers,
})
