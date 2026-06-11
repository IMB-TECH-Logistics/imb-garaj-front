import Buyurtmalar from "@/pages/buyurtmalar"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/buyurtmalar/")({
    component: Buyurtmalar,
})
