import DownloadAsExcel from "@/components/download-as-excel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { WAREHOUSE_PRODUCTS } from "@/constants/api-endpoints"
import { useHasAction, useWarehouseOwner } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useProductCols } from "./cols"
import LinesSection from "./lines-section"
import ReceiptModal, { RECEIPT_MODAL_KEY } from "./receipt-modal"
import type { OmborSearchParams, WhProduct } from "./types"
import { useOmborSearch } from "./use-ombor-search"

const Stock = () => {
    const { t } = useTranslation()
    const isOwner = useWarehouseOwner()
    const hasControl = useHasAction("warehouse_control")
    const search = useSearch({ strict: false })
    const navigate = useNavigate()
    const { openModal: openReceipt } = useModal(RECEIPT_MODAL_KEY)

    const receiptParam = (search as OmborSearchParams).receipt

    useEffect(() => {
        if (!receiptParam) return
        if (isOwner && hasControl) openReceipt()
        navigate({
            search: (prev: Record<string, unknown>) => ({
                ...prev,
                receipt: undefined,
            }),
            replace: true,
        } as never)
    }, [receiptParam])

    const query = String(search.search ?? "").trim()
    const searchValue = query

    const { data, isLoading } = useGet<ListResponse<WhProduct>>(
        WAREHOUSE_PRODUCTS,
        {
            params: {
                in_stock: 1,
                search: searchValue || undefined,
                page: search.page,
                page_size: search.page_size,
            },
        },
    )

    const columns = useProductCols()

    return (
        <div className="flex flex-col w-full gap-3">
            <DataTable
                numeration
                loading={isLoading}
                columns={columns}
                data={data?.results}
                className="min-w-[760px]"
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                head={
                    <div className="flex justify-between items-center gap-3 mb-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg">
                                {t("page.warehouse_products")}
                            </h1>
                            <Badge>{data?.count ?? 0}</Badge>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <DownloadAsExcel
                                url={`${WAREHOUSE_PRODUCTS}/excel`}
                                name={t("nav.warehouse")}
                                params={{
                                    in_stock: 1,
                                    search: searchValue || undefined,
                                }}
                            >
                                {t("actions.download")}
                            </DownloadAsExcel>
                            {isOwner && hasControl && (
                                <Button
                                    icon={<Plus size={16} />}
                                    onClick={openReceipt}
                                >
                                    {t("actions.add")}
                                </Button>
                            )}
                        </div>
                    </div>
                }
            />

            {isOwner && hasControl && <ReceiptModal />}
        </div>
    )
}

const Moves = () => {
    const { product, clear } = useOmborSearch()

    useEffect(() => {
        if (!product) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !e.defaultPrevented) clear()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [product])

    return <LinesSection />
}

const Ombor = () => {
    const { section } = useSearch({ strict: false }) as OmborSearchParams

    return (
        <div className="flex flex-col w-full gap-3">
            {section === "moves" ? <Moves /> : <Stock />}
        </div>
    )
}

export default Ombor
