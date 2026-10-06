import ProductCategoriesPage from "@/pages/home/settings/product-categories"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/product-categories/")({
    component: ProductCategoriesPage,
})
