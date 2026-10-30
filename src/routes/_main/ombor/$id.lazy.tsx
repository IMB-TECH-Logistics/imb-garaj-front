import ProductDetail from "@/pages/home/ombor/product-detail"
import { createLazyFileRoute } from "@tanstack/react-router"

const ProductDetailRoute = () => {
    const { id } = Route.useParams()
    return <ProductDetail id={Number(id)} />
}

export const Route = createLazyFileRoute("/_main/ombor/$id")({
    component: ProductDetailRoute,
})
