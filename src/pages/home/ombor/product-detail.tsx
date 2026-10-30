import { useNavigate } from "@tanstack/react-router"
import LinesSection from "./lines-section"

const ProductDetail = ({ id }: { id: number }) => {
    const navigate = useNavigate()
    return (
        <div className="flex flex-col w-full gap-3">
            <LinesSection productId={id} onClose={() => navigate({ to: "/ombor" })} />
        </div>
    )
}

export default ProductDetail
