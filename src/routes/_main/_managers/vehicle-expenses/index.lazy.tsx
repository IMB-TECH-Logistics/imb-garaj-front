import { VehicleExpenses } from "@/pages/home/vehicle-expenses"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_managers/vehicle-expenses/")({
    component: VehicleExpenses,
})
