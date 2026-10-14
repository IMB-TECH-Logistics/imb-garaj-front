import { ParamCombobox } from "@/components/as-params/combobox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { WAREHOUSE_OTHER_STOCK } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useSearch } from "@tanstack/react-router"
import { PackageOpen } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import TransferModal, { TRANSFER_MODAL_KEY } from "./transfer-modal"
import type { OmborSearchParams, WhOtherStock } from "./types"

const OtherStockSection = () => {
    const { t } = useTranslation()
    const search = useSearch({ strict: false }) as OmborSearchParams
    const hasControl = useHasAction("warehouse_control")
    const { openModal } = useModal(TRANSFER_MODAL_KEY)
    const [fromTenant, setFromTenant] = useState<number | undefined>()

    const { data, isLoading } = useGet<ListResponse<WhOtherStock>>(
        WAREHOUSE_OTHER_STOCK,
        {
            params: {
                search: search.search || undefined,
                tenant: search.tenant,
                page: search.page,
                page_size: search.page_size,
            },
        },
    )
    const { data: all } = useGet<ListResponse<WhOtherStock>>(
        WAREHOUSE_OTHER_STOCK,
        { params: { page_size: 500 } },
    )

    const tenants = useMemo(() => {
        const map = new Map<number, string>()
        all?.results.forEach((row) => map.set(row.tenant, row.tenant_name))
        return Array.from(map, ([id, name]) => ({ id, name }))
    }, [all])

    const take = (tenant?: number) => {
        setFromTenant(tenant)
        openModal()
    }

    const columns = useMemo<ColumnDef<WhOtherStock>[]>(() => {
        const base: ColumnDef<WhOtherStock>[] = [
            {
                id: "tenant",
                header: t("wh.tenant"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {row.original.tenant_name}
                    </span>
                ),
            },
            {
                id: "product",
                header: t("wh.product"),
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <span className="font-medium">
                            {row.original.product_name}
                        </span>
                        {row.original.is_serialized && (
                            <Badge>{t("wh.serialized_yes")}</Badge>
                        )}
                    </div>
                ),
            },
            {
                id: "quantity",
                header: t("form.quantity"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatMoney(row.original.qty_left)}{" "}
                        {row.original.unit_name}
                    </span>
                ),
            },
            {
                id: "price",
                header: t("form.unit_price"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatMoney(row.original.avg_price ?? 0)}{" "}
                        {t("page.som")}
                    </span>
                ),
            },
        ]
        if (!hasControl) return base
        return [
            ...base,
            {
                id: "take",
                header: "",
                cell: ({ row }) => (
                    <Button
                        size="sm"
                        variant="outline"
                        icon={<PackageOpen size={16} />}
                        onClick={() => take(row.original.tenant)}
                    >
                        {t("wh.transfer.take")}
                    </Button>
                ),
            },
        ]
    }, [t, hasControl])

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
                            <h1 className="text-lg">{t("wh.tab_others")}</h1>
                            <Badge>{data?.count ?? 0}</Badge>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <ParamCombobox
                                paramName="tenant"
                                options={tenants}
                                valueKey="id"
                                labelKey="name"
                                label={t("wh.tenant")}
                                addButtonProps={{
                                    className:
                                        "!bg-background dark:!bg-secondary",
                                }}
                            />
                            {hasControl && (
                                <Button
                                    icon={<PackageOpen size={16} />}
                                    onClick={() => take(search.tenant)}
                                >
                                    {t("wh.transfer.take")}
                                </Button>
                            )}
                        </div>
                    </div>
                }
            />
            {hasControl && (
                <TransferModal fromTenant={fromTenant} tenants={tenants} />
            )}
        </div>
    )
}

export default OtherStockSection
