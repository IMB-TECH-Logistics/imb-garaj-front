import { ParamCombobox } from "@/components/as-params/combobox"
import DownloadAsExcel from "@/components/download-as-excel"
import { parseGs1 } from "@/components/scanner/gs1"
import ScannerDialog from "@/components/scanner/scanner-dialog"
import { useUsbScanner } from "@/components/scanner/use-usb-scanner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { WAREHOUSE_CATEGORIES, WAREHOUSE_PRODUCTS } from "@/constants/api-endpoints"
import { useHasAction, useWarehouseOwner } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { Plus, ScanLine } from "lucide-react"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useProductCols } from "./cols"
import LinesSection from "./lines-section"
import ReceiptModal, { RECEIPT_MODAL_KEY, RECEIPT_SCAN_KEY } from "./receipt-modal"
import type { OmborSearchParams, WhCategory, WhProduct } from "./types"
import { useOmborSearch } from "./use-ombor-search"
import { useScanLookup } from "./use-scan-lookup"

const FIND_SCAN_KEY = "wh-find-scan"

const Ombor = () => {
    const { t } = useTranslation()
    const isOwner = useWarehouseOwner()
    const hasControl = useHasAction("warehouse_control")
    const search = useSearch({ strict: false })
    const navigate = useNavigate()
    const { product, select, clear } = useOmborSearch()
    const lookup = useScanLookup()
    const sectionRef = useRef<HTMLDivElement>(null)

    const { openModal: openScan, isOpen: scanOpen } = useModal(FIND_SCAN_KEY)
    const { openModal: openReceipt, isOpen: receiptOpen } =
        useModal(RECEIPT_MODAL_KEY)
    const { isOpen: receiptScanOpen } = useModal(RECEIPT_SCAN_KEY)

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
    const searchValue = parseGs1(query).gtin ?? query

    const { data, isLoading } = useGet<ListResponse<WhProduct>>(
        WAREHOUSE_PRODUCTS,
        {
            params: {
                in_stock: 1,
                search: searchValue || undefined,
                category: (search as OmborSearchParams).category,
                page: search.page,
                page_size: search.page_size,
            },
        },
    )

    const { data: categories } = useGet<WhCategory[]>(WAREHOUSE_CATEGORIES)
    const columns = useProductCols()

    useUsbScanner(
        async (code) => {
            const message = await lookup(code)
            if (message) toast.error(message)
        },
        !scanOpen && !receiptOpen && !receiptScanOpen,
    )

    useEffect(() => {
        if (!product) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !e.defaultPrevented) clear()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [product])

    useEffect(() => {
        const node = sectionRef.current
        if (!product || !node) return
        const { top } = node.getBoundingClientRect()
        if (top > window.innerHeight - 160) {
            node.scrollIntoView({ behavior: "smooth", block: "start" })
        }
    }, [product])

    return (
        <div className="flex flex-col w-full gap-3">
            <DataTable
                numeration
                loading={isLoading}
                columns={columns}
                data={data?.results}
                onRowClick={(row) =>
                    row.id === product ? clear() : select(row.id)
                }
                rowColor={(row) =>
                    row.id === product ? "!bg-primary/10" : ""
                }
                height="h-40"
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
                            <ParamCombobox
                                paramName="category"
                                options={categories ?? []}
                                valueKey="id"
                                labelKey="name"
                                label={t("wh.category")}
                                addButtonProps={{
                                    className:
                                        "!bg-background dark:!bg-secondary",
                                }}
                            />
                            <Button
                                variant="outline"
                                icon={<ScanLine size={16} />}
                                onClick={openScan}
                            >
                                {t("wh.scan_btn")}
                            </Button>
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

            <LinesSection ref={sectionRef} />

            <ScannerDialog
                modalKey={FIND_SCAN_KEY}
                title={t("wh.scan_title")}
                onScan={lookup}
            />

            {isOwner && hasControl && <ReceiptModal />}
        </div>
    )
}

export default Ombor
