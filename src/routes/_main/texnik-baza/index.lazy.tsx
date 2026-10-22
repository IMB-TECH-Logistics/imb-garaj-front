import TexnikBaza from "@/pages/home/texnik-baza"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/texnik-baza/")({
    component: TexnikBaza,
})
