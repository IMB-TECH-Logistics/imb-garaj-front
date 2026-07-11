import Ombor from "@/pages/home/ombor"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/ombor/")({
    component: Ombor,
})
