import { ParamCombobox } from "@/components/as-params/combobox"
import DeleteModal from "@/components/custom/delete-modal"
import ParamDateRange from "@/components/as-params/date-picker-range"
import { DataTable } from "@/components/ui/datatable"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    WAREHOUSE_PRODUCTS,
    WAREHOUSE_RECEIPT_LINES,
    WAREHOUSE_ITEMS,
    WAREHOUSE_RECEIPTS,
    WAREHOUSE_WITHDRAWAL_FILTERS,
    WAREHOUSE_WITHDRAWALS,
} from "@/constants/api-endpoints"
import { useHasAction, useWarehouseOwner } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { Package, X } from "lucide-react"
import { forwardRef, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useReceiptCols, useWithdrawalCols } from "./cols"
import ItemDetailSheet from "./items/detail-sheet"
import type { WhItem } from "./items/types"
import StockItems from "./stock-items"
import ReceiptModal, { RECEIPT_EDIT_MODAL_KEY } from "./receipt-modal"
import type {
    OmborSearchParams,
    WhProduct,
    WhReceiptLine,
    WhTab,
    WhWithdrawal,
    WhWithdrawalFilters,
} from "./types"
import { useCatalog } from "./use-catalog"
import { useOmborSearch } from "./use-ombor-search"

const highlight = (selected: boolean) => (selected ? "!bg-primary/10" : "")

const ProductHeader = ({
    product,
    onClose,
}: {
    product: WhProduct
    onClose: () => void
}) => {
    const { t } = useTranslation()
    return (
        <div className="mb-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="size-11 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                        <Package size={22} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                            <h2 className="text-lg font-semibold leading-tight break-words">
                                {product.name}
                            </h2>
                            <span className="text-sm">
                                <span className="text-muted-foreground">{t("wh.total_left")}:</span>{" "}
                                <span className="font-semibold">
                                    {formatMoney(product.qty_left)} {product.unit_name}
                                </span>
                            </span>
                            <span className="text-sm">
                                <span className="text-muted-foreground">{t("form.amount")}:</span>{" "}
                                <span className="font-semibold">
                                    {formatMoney(product.value)} {t("page.som")}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    className="text-primary shrink-0"
                    title={t("actions.close")}
                    onClick={onClose}
                >
                    <div className="bg-primary/20 p-1.5 rounded-md">
                        <X className="h-4 w-4" />
                    </div>
                    <span className="sr-only">{t("actions.close")}</span>
                </button>
            </div>
        </div>
    )
}

type LinesSectionProps = { productId?: number; onClose?: () => void }

const LinesSection = forwardRef<HTMLDivElement, LinesSectionProps>(({ productId, onClose }, ref) => {
    const { t } = useTranslation()
    const isOwner = useWarehouseOwner()
    const { product: searchProduct, lot, tab, setTab, clear } = useOmborSearch()
    const product = productId ?? searchProduct
    const search = useSearch({ strict: false }) as OmborSearchParams

    const { data: selected } = useGet<WhProduct>(
        `${WAREHOUSE_PRODUCTS}/${product}`,
        { enabled: !!product },
    )
    const serial = !!productId && !!selected?.is_serialized

    const activeTab: WhTab =
        serial && (tab === "stock" || !tab) ? "stock"
        : isOwner && tab !== "withdrawals" ? "receipts" : "withdrawals"

    const listParams = {
        product,
        page: search.lpage,
        page_size: search.lpage_size,
        from_date: search.from_date,
        to_date: search.to_date,
    }
    const withdrawalParams = {
        ...listParams,
        tenant: search.tenant,
        vehicle_plate: search.vehicle_plate,
    }

    const navigate = useNavigate()
    const filterKey = [
        search.from_date,
        search.to_date,
        search.tenant,
        search.vehicle_plate,
    ].join("|")
    const prevFilterKey = useRef(filterKey)
    useEffect(() => {
        if (prevFilterKey.current === filterKey) return
        prevFilterKey.current = filterKey
        if (search.lpage) {
            navigate({
                search: { ...search, lpage: undefined } as never,
                replace: true,
            })
        }
    }, [filterKey])

    const { data: catalog } = useCatalog()
    const { data: filterOptions } = useGet<WhWithdrawalFilters>(
        WAREHOUSE_WITHDRAWAL_FILTERS,
        {
            params: { tenant: search.tenant },
            enabled: activeTab === "withdrawals",
        },
    )

    const { data: receipts, isLoading: receiptsLoading } = useGet<
        ListResponse<WhReceiptLine>
    >(WAREHOUSE_RECEIPT_LINES, {
        params: listParams,
        enabled: isOwner && activeTab === "receipts",
    })
    const { data: withdrawals, isLoading: withdrawalsLoading } = useGet<
        ListResponse<WhWithdrawal>
    >(WAREHOUSE_WITHDRAWALS, {
        params: withdrawalParams,
        enabled: activeTab === "withdrawals",
    })

    const { data: stockItems, isLoading: stockLoading } = useGet<
        ListResponse<WhItem>
    >(WAREHOUSE_ITEMS, {
        params: { product, state: "in_stock", page: search.lpage, page_size: search.lpage_size },
        enabled: activeTab === "stock",
    })
    const [itemId, setItemId] = useState<number | undefined>()

    const receiptCols = useReceiptCols(!!product)

    // Xato kiritilgan kirimni o'chirish (S-U3-02): faqat ombor egasi + warehouse_control.
    const canDeleteReceipt = useHasAction("warehouse_control") && isOwner
    const queryClient = useQueryClient()
    const { openModal: openReceiptDelete } = useModal("receipt-delete")
    const [receiptToDelete, setReceiptToDelete] = useState<WhReceiptLine | null>(
        null,
    )
    const { openModal: openReceiptEdit } = useModal(RECEIPT_EDIT_MODAL_KEY)
    const [receiptToEdit, setReceiptToEdit] = useState(0)
    const withdrawalCols = useWithdrawalCols({
        hideProduct: !!product,
        showTenant: isOwner,
    })

    const head = (
        <>
            {product && selected && (
                <ProductHeader product={selected} onClose={onClose ?? clear} />
            )}
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <Tabs
                    value={activeTab}
                    onValueChange={(value) => setTab(value as WhTab)}
                >
                    <TabsList>
                        {serial && (
                            <TabsTrigger value="stock">
                                {t("wh.stock_tab")}
                                {stockItems && ` (${stockItems.count})`}
                            </TabsTrigger>
                        )}
                        {isOwner && (
                            <TabsTrigger value="receipts">
                                {t("wh.receipts")}
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="withdrawals">
                            {isOwner ?
                                t("wh.withdrawals")
                            :   t("wh.my_withdrawals")}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <ParamDateRange
                        from="from_date"
                        to="to_date"
                        addButtonProps={{
                            className:
                                "!bg-background dark:!bg-secondary min-w-32 justify-start",
                        }}
                    />
                    {!productId && <ParamCombobox
                        paramName="product"
                        options={catalog?.results ?? []}
                        valueKey="id"
                        labelKey="name"
                        label={t("wh.product")}
                        asloClear={["lot", "lpage"]}
                        className="w-80"
                        addButtonProps={{
                            className: "!bg-background dark:!bg-secondary min-w-44",
                        }}
                    />}
                    {activeTab === "withdrawals" && isOwner && (
                        <ParamCombobox
                            paramName="tenant"
                            options={filterOptions?.tenants ?? []}
                            valueKey="id"
                            labelKey="name"
                            label={t("wh.tenant")}
                            asloClear={["vehicle_plate"]}
                            addButtonProps={{
                                className: "!bg-background dark:!bg-secondary",
                            }}
                        />
                    )}
                    {activeTab === "withdrawals" && (
                        <ParamCombobox
                            paramName="vehicle_plate"
                            options={filterOptions?.vehicles ?? []}
                            valueKey="plate"
                            labelKey="plate"
                            label={t("wh.plate")}
                            addButtonProps={{
                                className: "!bg-background dark:!bg-secondary",
                            }}
                        />
                    )}
                </div>
            </div>
        </>
    )

    const pagination = (data?: { total_pages: number }) => ({
        totalPages: data?.total_pages,
        paramName: "lpage",
        pageSizeParamName: "lpage_size",
    })

    return (
        <div ref={ref} className="scroll-mt-3">
            {activeTab === "stock" ?
                <StockItems
                    data={stockItems?.results}
                    count={stockItems?.count}
                    loading={stockLoading}
                    head={head}
                    pagination={pagination(stockItems)}
                    onOpen={setItemId}
                />
            : activeTab === "receipts" ?
                <DataTable
                    loading={receiptsLoading}
                    columns={receiptCols}
                    data={receipts?.results}
                    rowColor={(row) => highlight(!!lot && row.id === lot)}
                    height="h-40"
                    className="min-w-[900px]"
                    paginationProps={pagination(receipts)}
                    head={head}
                    onEdit={
                        canDeleteReceipt ?
                            (row) => {
                                setReceiptToEdit(row.original.receipt_id)
                                openReceiptEdit()
                            }
                        :   undefined
                    }
                    onDelete={
                        canDeleteReceipt ?
                            (row) => {
                                setReceiptToDelete(row.original)
                                openReceiptDelete()
                            }
                        :   undefined
                    }
                />
            :   <DataTable
                    loading={withdrawalsLoading}
                    columns={withdrawalCols}
                    data={withdrawals?.results}
                    rowColor={(row) => highlight(!!lot && row.lot === lot)}
                    height="h-40"
                    className="min-w-[900px]"
                    paginationProps={pagination(withdrawals)}
                    head={head}
                />
            }
            {serial && <ItemDetailSheet itemId={itemId} onClose={() => setItemId(undefined)} />}
            {canDeleteReceipt && <ReceiptModal receiptId={receiptToEdit} />}
            <DeleteModal
                modalKey="receipt-delete"
                path={WAREHOUSE_RECEIPTS}
                id={receiptToDelete?.receipt_id}
                name={
                    receiptToDelete ?
                        t("fleet.ombor.receipt_delete_name", {
                            id: receiptToDelete.receipt_id,
                            date: receiptToDelete.date,
                        })
                    :   ""
                }
                disableRefetch
                onSuccessAction={() =>
                    queryClient.invalidateQueries({
                        predicate: (query) =>
                            String(query.queryKey[0]).startsWith("warehouse/"),
                    })
                }
            />
        </div>
    )
})

LinesSection.displayName = "LinesSection"

export default LinesSection
