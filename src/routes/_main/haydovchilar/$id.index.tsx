import HaydovchiDetail from "@/pages/home/haydovchilar/detail"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_main/haydovchilar/$id/")({
    component: HaydovchiDetail,
})
