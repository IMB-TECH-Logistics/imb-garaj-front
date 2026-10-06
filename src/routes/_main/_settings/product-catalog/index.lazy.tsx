import ProductSettingsPage from "@/pages/home/settings/product-catalog/tabs"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/product-catalog/")({
    component: ProductSettingsPage,
})
