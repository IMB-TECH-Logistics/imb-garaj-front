import ProductCatalogPage from "@/pages/home/settings/product-catalog"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/product-catalog/")({
    component: ProductCatalogPage,
})
