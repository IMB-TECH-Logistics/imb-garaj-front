import { ParamCombobox } from "@/components/as-params/combobox"
import ParamDateRange from "@/components/as-params/date-picker-range"
import { DataTable } from "@/components/ui/datatable"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    WAREHOUSE_PRODUCTS,
    WAREHOUSE_RECEIPT_LINES,
    WAREHOUSE_WITHDRAWAL_FILTERS,
    WAREHOUSE_WITHDRAWALS,
} from "@/constants/api-endpoints"
import { useWarehouseOwner } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { Package, X } from "lucide-react"
import { forwardRef, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useReceiptCols, useWithdrawalCols } from "./cols"
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
                        <h2 className="text-lg font-semibold leading-tight break-words">
                            {product.name}
                        </h2>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                            {product.gtin && (
                                <>
                                    <span>
                                        GTIN{" "}
                                        <span className="font-mono text-foreground">
                                            {product.gtin}
                                        </span>
                                    </span>
                                    <span>·</span>
                                </>
                            )}
                            <span>{product.unit_name}</span>
                            {product.avg_price !== null && (
                                <>
                                    <span>·</span>
                                    <span>
                                        {formatMoney(product.avg_price)}{" "}
                                        {t("page.som")}
                                    </span>
                                </>
                            )}
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
            <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="rounded-lg bg-muted/60 p-3">
                    <div className="text-xs text-muted-foreground">
                        {t("wh.total_left")}
                    </div>
                    <div className="text-base font-semibold">
                        {formatMoney(product.qty_left)} {product.unit_name}
                    </div>
                </div>
                <div className="rounded-lg bg-muted/60 p-3">
                    <div className="text-xs text-muted-foreground">
                        {t("form.amount")}
                    </div>
                    <div className="text-base font-semibold">
                        {formatMoney(product.value)} {t("page.som")}
                    </div>
                </div>
            </div>
        </div>
    )
}

const LinesSection = forwardRef<HTMLDivElement>((_, ref) => {
    const { t } = useTranslation()
    const isOwner = useWarehouseOwner()
    const { product, lot, tab, setTab, clear } = useOmborSearch()
    const search = useSearch({ strict: false }) as OmborSearchParams

    const activeTab: WhTab =
        isOwner && tab !== "withdrawals" ? "receipts" : "withdrawals"

    const { data: selected } = useGet<WhProduct>(
        `${WAREHOUSE_PRODUCTS}/${product}`,
        { enabled: !!product },
    )

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

    const receiptCols = useReceiptCols(!!product)
    const withdrawalCols = useWithdrawalCols({
        hideProduct: !!product,
        showTenant: isOwner,
    })

    const head = (
        <>
            {product && selected && (
                <ProductHeader product={selected} onClose={clear} />
            )}
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <Tabs
                    value={activeTab}
                    onValueChange={(value) => setTab(value as WhTab)}
                >
                    <TabsList>
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
                    <ParamCombobox
                        paramName="product"
                        options={catalog?.results ?? []}
                        valueKey="id"
                        labelKey="name"
                        label={t("wh.product")}
                        asloClear={["lot", "lpage"]}
                        addButtonProps={{
                            className: "!bg-background dark:!bg-secondary",
                        }}
                    />
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
            {activeTab === "receipts" ?
                <DataTable
                    loading={receiptsLoading}
                    columns={receiptCols}
                    data={receipts?.results}
                    rowColor={(row) => highlight(!!lot && row.id === lot)}
                    height="h-40"
                    className="min-w-[900px]"
                    paginationProps={pagination(receipts)}
                    head={head}
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
        </div>
    )
})

LinesSection.displayName = "LinesSection"

export default LinesSection
