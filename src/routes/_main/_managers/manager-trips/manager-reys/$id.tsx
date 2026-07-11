import ManagerReys from "@/pages/home/managers/manager-reys"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute(
    "/_main/_managers/manager-trips/manager-reys/$id",
)({
    component: ManagerReys,
})
