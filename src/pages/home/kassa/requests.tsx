import { ParamCombobox } from "@/components/as-params/combobox"
import ParamDateRange from "@/components/as-params/date-picker-range"
import ParamInput from "@/components/as-params/input"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import TableActions from "@/components/custom/table-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import {
    CHECKOUT_PENDING_COUNTS,
    CHECKOUT_REQUESTS,
    CHECKOUT_SUMMARY,
} from "@/constants/api-endpoints"
import { useHasAction, useUser } from "@/constants/useUser"
import { useConfirm } from "@/hooks/useConfirm"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { formatMoney } from "@/lib/format-money"
import { handleFormError } from "@/lib/show-form-errors"
import { useQueryClient } from "@tanstack/react-query"
import { useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { ReactNode, useMemo, useState } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import DecisionRejectModal from "./decision-reject-modal"

type CheckoutRequest = {
    id: number
    type: number
    status: number
    amount: string
    checkout_kind: "cash" | "card"
    comment: string | null
    rejected_comment: string | null
    executor: number | null
    executor_name: string | null
    approved_by: number | null
    approved_by_name: string | null
    approved_at: string | null
    created: string
}

const STATUS_VARIANT: Record<number, "secondary" | "default" | "destructive" | "orange"> = {
    10: "orange",
    20: "default",
    [-10]: "destructive",
    [-20]: "secondary",
}

const formatDateTime = (value: string) => {
    const d = new Date(value)
    if (isNaN(d.getTime())) return "-"
    return d.toLocaleString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    })
}

const useRequestCols = (
    statusLabel: (status: number) => string,
) => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<CheckoutRequest>[]>(
        () => [
            {
                header: t("form.date"),
                accessorKey: "created",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatDateTime(row.original.created)}
                    </span>
                ),
            },
            {
                header: t("table.type"),
                accessorKey: "type",
                cell: ({ row }) => (
                    <Badge variant={row.original.type === -1 ? "destructive" : "default"}>
                        {row.original.type === -1 ? t("form.expense") : t("form.income")}
                    </Badge>
                ),
            },
            {
                header: t("kassa.checkout_kind"),
                accessorKey: "checkout_kind",
                cell: ({ row }) =>
                    row.original.checkout_kind === "card" ?
                        t("kassa.card")
                    :   t("kassa.cash"),
            },
            {
                header: t("form.amount"),
                accessorKey: "amount",
                enableSorting: true,
                cell: ({ row }) => formatMoney(Number(row.original.amount)),
            },
            {
                header: t("kassa.executor"),
                accessorKey: "executor_name",
                cell: ({ row }) => row.original.executor_name || "—",
            },
            {
                header: t("form.comment"),
                accessorKey: "comment",
                cell: ({ row }) => row.original.comment || "—",
            },
            {
                header: t("table.status"),
                accessorKey: "status",
                cell: ({ row }) => (
                    <div className="flex flex-col gap-1">
                        <Badge variant={STATUS_VARIANT[row.original.status] ?? "secondary"}>
                            {statusLabel(row.original.status)}
                        </Badge>
                        {row.original.status === -10 && row.original.rejected_comment && (
                            <span className="text-xs text-muted-foreground">
                                {row.original.rejected_comment}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                header: t("kassa.approved_by"),
                accessorKey: "approved_by_name",
                cell: ({ row }) => row.original.approved_by_name || "—",
            },
        ],
        [t, statusLabel],
    )
}

type Props = {
    switcher: ReactNode
}

const CheckoutRequests = ({ switcher }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const search = useSearch({ strict: false }) as any
    const hasApprove = useHasAction("manager_cashflow_approve_control")
    const hasControl = useHasAction("manager_cashflow_control")
    const { data: profile } = useUser()
    const confirm = useConfirm()
    const [selected, setSelected] = useState<CheckoutRequest | null>(null)
    const { openModal: openReject } = useModal("checkout-request-reject")
    const { openModal: openDelete } = useModal("checkout-request-delete")

    const statusLabel = (status: number) => {
        if (status === 10) return t("kassa.status_pending")
        if (status === 20) return t("kassa.status_approved")
        if (status === -10) return t("kassa.status_rejected")
        return t("kassa.status_rollback")
    }

    const columns = useRequestCols(statusLabel)

    const typeOptions = useMemo(
        () => [
            { id: "1", name: t("form.income") },
            { id: "-1", name: t("form.expense") },
        ],
        [t],
    )
    const statusOptions = useMemo(
        () => [
            { id: "10", name: t("kassa.status_pending") },
            { id: "20", name: t("kassa.status_approved") },
            { id: "-10", name: t("kassa.status_rejected") },
        ],
        [t],
    )
    const kindOptions = useMemo(
        () => [
            { id: "cash", name: t("kassa.cash") },
            { id: "card", name: t("kassa.card") },
        ],
        [t],
    )

    const params = {
        page: search.page,
        page_size: search.page_size,
        type: search.req_type,
        status: search.req_status,
        checkout_kind: search.req_kind,
        from_date: search.from_date,
        to_date: search.to_date,
        search: search.req_search,
        ordering: search.ordering,
    }

    const { data, isLoading } = useGet<ListResponse<CheckoutRequest>>(
        CHECKOUT_REQUESTS,
        { params },
    )

    const { mutate: decide } = usePost({
        onSuccess: () => {
            toast.success(t("toast.updated"))
            queryClient.refetchQueries({ queryKey: [CHECKOUT_REQUESTS] })
            queryClient.invalidateQueries({ queryKey: [CHECKOUT_PENDING_COUNTS] })
            queryClient.invalidateQueries({ queryKey: [CHECKOUT_SUMMARY] })
        },
        meta: { skipGlobalError: true },
    })

    const handleApprove = async (row: CheckoutRequest) => {
        const ok = await confirm({
            title: t("kassa.approve"),
            description: formatMoney(Number(row.amount)),
        })
        if (!ok) return
        decide(
            `${CHECKOUT_REQUESTS}/${row.id}/decision`,
            { status: 20 },
            { onError: (e: unknown) => handleFormError(e) },
        )
    }

    const handleReject = (row: CheckoutRequest) => {
        setSelected(row)
        openReject()
    }

    const handleDelete = (row: CheckoutRequest) => {
        setSelected(row)
        openDelete()
    }

    return (
        <>
        <DataTable
            numeration
            manualSorting
            loading={isLoading}
            columns={columns}
            data={data?.results}
            rowAction={(row: CheckoutRequest) => {
                const canDecide =
                    hasApprove &&
                    (row.executor !== profile?.id || !!profile?.is_superuser)
                return row.status === 10 ?
                    <TableActions
                        onFinished={canDecide ? () => handleApprove(row) : undefined}
                        onDelete={
                            hasControl || row.executor === profile?.id ?
                                () => handleDelete(row)
                            :   undefined
                        }
                        onUndo={canDecide ? () => handleReject(row) : undefined}
                    />
                : row.status === 20 && profile?.is_superuser ?
                    <TableActions onDelete={() => handleDelete(row)} />
                :   null
            }}
            wrapperClassName="md:h-full flex flex-col"
            tableWrapperClassName="flex-1 min-h-0 overflow-auto"
            paginationProps={{
                totalPages: data?.total_pages,
                paramName: "page",
                pageSizeParamName: "page_size",
            }}
            head={
                <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        {switcher}
                        <Badge>{formatMoney(data?.count)}</Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <ParamInput
                            searchKey="req_search"
                            placeholder={t("actions.search")}
                            className="w-44"
                        />
                        <ParamCombobox
                            paramName="req_type"
                            options={typeOptions}
                            isSearch={false}
                            label={t("table.type")}
                            addButtonProps={{
                                className: "!bg-background dark:!bg-secondary min-w-32 justify-start",
                            }}
                        />
                        <ParamCombobox
                            paramName="req_kind"
                            options={kindOptions}
                            isSearch={false}
                            label={t("kassa.checkout_kind")}
                            addButtonProps={{
                                className: "!bg-background dark:!bg-secondary min-w-36 justify-start",
                            }}
                        />
                        <ParamCombobox
                            paramName="req_status"
                            options={statusOptions}
                            isSearch={false}
                            label={t("table.status")}
                            addButtonProps={{
                                className: "!bg-background dark:!bg-secondary min-w-36 justify-start",
                            }}
                        />
                        <ParamDateRange from="from_date" to="to_date" />
                    </div>
                </div>
            }
        />
        <Modal
            modalKey="checkout-request-reject"
            title={t("kassa.reject_title")}
            size="max-w-md"
        >
            <DecisionRejectModal
                modalKey="checkout-request-reject"
                url={selected ? `${CHECKOUT_REQUESTS}/${selected.id}/decision` : undefined}
                rejectStatus={-10}
                refetchKeys={[CHECKOUT_REQUESTS, CHECKOUT_PENDING_COUNTS]}
            />
        </Modal>
        <DeleteModal
            modalKey="checkout-request-delete"
            path={CHECKOUT_REQUESTS}
            id={selected?.id}
            refetchKeys={[CHECKOUT_REQUESTS, CHECKOUT_PENDING_COUNTS, CHECKOUT_SUMMARY]}
        />
        </>
    )
}

export default CheckoutRequests
