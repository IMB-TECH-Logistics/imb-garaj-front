import { ParamCombobox } from "@/components/as-params/combobox"
import ParamDateRange from "@/components/as-params/date-picker-range"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { WAREHOUSE_TRANSFERS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { useQueryClient } from "@tanstack/react-query"
import { useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { OmborSearchParams, WhTransfer } from "./types"
import { fmtDate } from "./utils"

const DETAIL_MODAL_KEY = "wh-transfer-detail"
const DELETE_MODAL_KEY = "wh-transfer-delete"

const DirectionBadge = ({ direction }: { direction: "in" | "out" }) => {
    const { t } = useTranslation()
    return (
        <Badge variant={direction === "in" ? "default" : "orange"}>
            {direction === "in" ? t("wh.transfer.in") : t("wh.transfer.out")}
        </Badge>
    )
}

const partyOf = (row: WhTransfer) =>
    row.direction === "in" ? row.from_tenant_name : row.to_tenant_name

const TransferDetail = ({ id }: { id: number }) => {
    const { t } = useTranslation()
    const { data, isLoading } = useGet<WhTransfer>(
        `${WAREHOUSE_TRANSFERS}/${id}`,
        { enabled: !!id },
    )

    if (isLoading || !data) {
        return (
            <div className="p-6 text-center text-sm text-muted-foreground">
                {t("wh.transfer.loading")}
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3 p-0.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/60 p-3">
                    <div className="text-xs text-muted-foreground">
                        {t("wh.transfer.direction")}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                        <DirectionBadge direction={data.direction} />
                        <span className="font-medium">{partyOf(data)}</span>
                    </div>
                </div>
                <div className="rounded-lg bg-muted/60 p-3">
                    <div className="text-xs text-muted-foreground">
                        {t("form.date")}
                    </div>
                    <div className="font-medium">{fmtDate(data.date)}</div>
                </div>
            </div>
            <div className="rounded-lg border divide-y">
                {(data.lines ?? []).map((line) => (
                    <div
                        key={line.id}
                        className="p-3 flex items-center justify-between gap-3 flex-wrap"
                    >
                        <div className="min-w-0">
                            <div className="font-medium">
                                {line.source_product_name}
                            </div>
                            {line.factory_number && (
                                <div className="text-xs font-mono text-muted-foreground">
                                    {line.factory_number}
                                </div>
                            )}
                        </div>
                        <div className="text-sm text-right tabular-nums">
                            <div>
                                {formatMoney(line.quantity)} {line.unit_name} ×{" "}
                                {formatMoney(line.unit_price)}
                            </div>
                            <div className="font-medium">
                                {formatMoney(line.total)} {t("page.som")}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {data.comment && (
                <div className="text-sm text-muted-foreground">
                    {data.comment}
                </div>
            )}
            <div className="rounded-lg bg-muted/60 p-3 flex items-center justify-between gap-3">
                <div className="font-medium">{t("page.total")}</div>
                <div className="font-medium tabular-nums">
                    {formatMoney(data.total)} {t("page.som")}
                </div>
            </div>
            {data.executor_name && (
                <div className="text-xs text-muted-foreground">
                    {t("wh.transfer.executor")}: {data.executor_name}
                </div>
            )}
        </div>
    )
}

const TransfersSection = () => {
    const { t } = useTranslation()
    const search = useSearch({ strict: false }) as OmborSearchParams
    const hasControl = useHasAction("warehouse_control")
    const queryClient = useQueryClient()
    const { openModal: openDetail } = useModal(DETAIL_MODAL_KEY)
    const { openModal: openDelete } = useModal(DELETE_MODAL_KEY)
    const [selected, setSelected] = useState<WhTransfer | null>(null)

    const { data, isLoading } = useGet<ListResponse<WhTransfer>>(
        WAREHOUSE_TRANSFERS,
        {
            params: {
                direction: search.direction,
                from_date: search.from_date,
                to_date: search.to_date,
                search: search.search || undefined,
                page: search.page,
                page_size: search.page_size,
            },
        },
    )

    const columns = useMemo<ColumnDef<WhTransfer>[]>(
        () => [
            {
                id: "direction",
                header: t("wh.transfer.direction"),
                cell: ({ row }) => (
                    <DirectionBadge direction={row.original.direction} />
                ),
            },
            {
                id: "party",
                header: t("wh.transfer.party"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap font-medium">
                        {partyOf(row.original)}
                    </span>
                ),
            },
            {
                id: "date",
                header: t("form.date"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {fmtDate(row.original.date)}
                    </span>
                ),
            },
            {
                id: "products",
                header: t("wh.products"),
                cell: ({ row }) => {
                    const lines = row.original.lines ?? []
                    if (!lines.length) return <span>—</span>
                    const first = lines[0].source_product_name
                    return (
                        <span>
                            {first}
                            {lines.length > 1 && ` +${lines.length - 1}`}
                        </span>
                    )
                },
            },
            {
                id: "total",
                header: t("page.total"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap font-medium">
                        {formatMoney(row.original.total)} {t("page.som")}
                    </span>
                ),
            },
            {
                id: "executor",
                header: t("wh.transfer.executor"),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {row.original.executor_name || "—"}
                    </span>
                ),
            },
        ],
        [t],
    )

    return (
        <div className="flex flex-col w-full gap-3">
            <DataTable
                numeration
                loading={isLoading}
                columns={columns}
                data={data?.results}
                className="min-w-[760px]"
                onRowClick={(row) => {
                    setSelected(row)
                    openDetail()
                }}
                isRowLocked={(row) => row.direction !== "in"}
                onDelete={
                    hasControl ?
                        (row) => {
                            setSelected(row.original)
                            openDelete()
                        }
                    :   undefined
                }
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                head={
                    <div className="flex justify-between items-center gap-3 mb-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg">{t("wh.tab_transfers")}</h1>
                            <Badge>{data?.count ?? 0}</Badge>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <ParamDateRange
                                from="from_date"
                                to="to_date"
                                addButtonProps={{
                                    className:
                                        "!bg-background dark:!bg-secondary min-w-32 justify-start",
                                }}
                            />
                            <ParamCombobox
                                paramName="direction"
                                options={[
                                    { id: "in", name: t("wh.transfer.in") },
                                    { id: "out", name: t("wh.transfer.out") },
                                ]}
                                valueKey="id"
                                labelKey="name"
                                label={t("wh.transfer.direction")}
                                addButtonProps={{
                                    className:
                                        "!bg-background dark:!bg-secondary",
                                }}
                            />
                        </div>
                    </div>
                }
            />
            <Modal
                modalKey={DETAIL_MODAL_KEY}
                title={t("wh.transfer.detail_title", { id: selected?.id })}
                size="max-w-2xl"
            >
                {selected && <TransferDetail key={selected.id} id={selected.id} />}
            </Modal>
            {hasControl && (
                <DeleteModal
                    modalKey={DELETE_MODAL_KEY}
                    path={WAREHOUSE_TRANSFERS}
                    id={selected?.id}
                    name={
                        selected ?
                            t("wh.transfer.delete_name", {
                                id: selected.id,
                                date: fmtDate(selected.date),
                            })
                        :   ""
                    }
                    disableRefetch
                    onSuccessAction={() =>
                        queryClient.invalidateQueries({
                            predicate: (query) =>
                                String(query.queryKey[0]).startsWith(
                                    "warehouse/",
                                ),
                        })
                    }
                />
            )}
        </div>
    )
}

export default TransfersSection
