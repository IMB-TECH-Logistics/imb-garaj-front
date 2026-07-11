import AylanmaDetail from "@/pages/home/haydovchilar/aylanma-detail"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute(
    "/_main/haydovchilar/$id/aylanma/$tripId",
)({
    component: AylanmaDetail,
})
