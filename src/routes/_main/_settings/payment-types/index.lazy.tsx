import PaymentType from "@/pages/home/settings/payment-type"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/payment-types/")({
    component: PaymentType,
})
