import { ParamCombobox } from "@/components/as-params/combobox"
import ParamDateRange from "@/components/as-params/date-picker-range"
import ParamInput from "@/components/as-params/input"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { KASSA_OVERVIEW, KASSA_PAYERS, KASSA_PAYMENT_REQUESTS, KASSA_SUMMARY } from "@/constants/api-endpoints"
import { useHasAction, useUser } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { formatMoney } from "@/lib/format-money"
import { handleFormError } from "@/lib/show-form-errors"
import { useQueryClient } from "@tanstack/react-query"
import { useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { Check, Undo2, X } from "lucide-react"
import { ReactNode, useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import DecisionRejectModal from "../decision-reject-modal"
import { formatDateTime, type PaymentRequest } from "./types"

const STATUS_VARIANT: Record<number, "secondary" | "default" | "destructive" | "orange"> = {
    10: "orange",
    20: "default",
    [-10]: "destructive",
    [-20]: "secondary",
}

type Props = { switcher: ReactNode }

const VstPaymentRequests = ({ switcher }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const search = useSearch({ strict: false }) as any
    const { data: profile } = useUser()
    const hasControl = useHasAction("kassa_payment_requests_control")
    const [selected, setSelected] = useState<PaymentRequest | null>(null)
    const { openModal: openReject } = useModal("vst-request-reject")
    const { openModal: openCancel } = useModal("vst-request-cancel")
    const { data: payers } = useGet<{ id: number; name: string }[]>(KASSA_PAYERS)

    const params = {
        page: search.page,
        page_size: search.page_size,
        status: search.pr_status,
        payer: search.pr_payer,
        recipient_type: search.pr_type,
        from_date: search.from_date,
        to_date: search.to_date,
        search: search.pr_search,
    }
    const { data, isLoading } = useGet<ListResponse<PaymentRequest>>(KASSA_PAYMENT_REQUESTS, { params })

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: [KASSA_PAYMENT_REQUESTS] })
        queryClient.invalidateQueries({ queryKey: [KASSA_OVERVIEW] })
        queryClient.invalidateQueries({ queryKey: [KASSA_SUMMARY] })
    }

    const { mutate: pay, isPending: paying } = usePost({
        onSuccess: () => {
            toast.success(t("vst.paid_ok", "To'lov tasdiqlandi"))
            refresh()
        },
        meta: { skipGlobalError: true },
    })

    const canPay = (row: PaymentRequest) =>
        row.status === 10 &&
        (profile?.is_superuser ||
            (row.payer_type === 2 ? row.payer === profile?.id : hasControl))

    const canCancel = (row: PaymentRequest) =>
        row.status === 10 && (profile?.is_superuser || hasControl || row.creator === profile?.id)

    const statusLabel = useCallback((s: number) =>
        s === 10 ? t("vst.st_pending", "Kutilmoqda")
        : s === 20 ? t("vst.st_paid", "Berildi")
        : s === -10 ? t("vst.st_rejected", "Rad etildi")
        : t("vst.st_canceled", "Bekor qilindi"), [t])

    const columns = useMemo<ColumnDef<PaymentRequest>[]>(
        () => [
            {
                header: t("form.date"),
                accessorKey: "created",
                cell: ({ row }) => <span className="whitespace-nowrap">{formatDateTime(row.original.created)}</span>,
            },
            {
                header: t("vst.recipient", "Kimga"),
                accessorKey: "driver_name",
                cell: ({ row }) =>
                    row.original.recipient_type === 1 ?
                        <span>{row.original.driver_name}</span>
                    :   <span className="text-muted-foreground">
                            {row.original.category_name}
                            {row.original.vehicle_number ? ` · ${row.original.vehicle_number}` : ""}
                        </span>,
            },
            {
                header: t("form.amount"),
                accessorKey: "amount",
                cell: ({ row }) => <span className="font-medium">{formatMoney(Number(row.original.amount))}</span>,
            },
            {
                header: t("vst.who_pays", "Kim to'laydi"),
                accessorKey: "payer_name",
                cell: ({ row }) =>
                    row.original.payer_type === 2 ? row.original.payer_name : t("vst.payer_garage", "Garaj kassasi (Doniyor)"),
            },
            {
                header: t("vst.creator", "So'ragan"),
                accessorKey: "creator_name",
                cell: ({ row }) => row.original.creator_name || "—",
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
                        {row.original.status === 20 && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDateTime(row.original.paid_at)}
                            </span>
                        )}
                        {row.original.status === -10 && row.original.rejected_comment && (
                            <span className="text-xs text-muted-foreground">{row.original.rejected_comment}</span>
                        )}
                    </div>
                ),
            },
        ],
        [t, statusLabel],
    )

    return (
        <>
            <DataTable
                numeration
                loading={isLoading}
                columns={columns}
                data={data?.results}
                rowAction={(row: PaymentRequest) =>
                    <div className="flex items-center gap-1 justify-end">
                        {canPay(row) && (
                            <Button
                                size="sm"
                                className="h-8 gap-1"
                                loading={paying}
                                onClick={() =>
                                    pay(`${KASSA_PAYMENT_REQUESTS}/${row.id}/pay`, {}, {
                                        onError: (e: unknown) => handleFormError(e),
                                    })
                                }
                            >
                                <Check size={16} />
                                {t("vst.gave", "Berdim")}
                            </Button>
                        )}
                        {canPay(row) && (
                            <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 text-destructive"
                                title={t("vst.reject", "Rad etish")}
                                onClick={() => {
                                    setSelected(row)
                                    openReject()
                                }}
                            >
                                <X size={16} />
                            </Button>
                        )}
                        {canCancel(row) && (
                            <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                title={t("vst.cancel", "Bekor qilish")}
                                onClick={() => {
                                    setSelected(row)
                                    openCancel()
                                }}
                            >
                                <Undo2 size={16} />
                            </Button>
                        )}
                    </div>
                }
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
                            <ParamInput searchKey="pr_search" placeholder={t("actions.search")} className="w-44" />
                            <ParamCombobox
                                paramName="pr_type"
                                isSearch={false}
                                label={t("vst.recipient", "Kimga")}
                                options={[
                                    { id: "1", name: t("vst.to_driver_short", "Haydovchi") },
                                    { id: "2", name: t("vst.to_expense", "Garaj xarajati") },
                                ]}
                                addButtonProps={{ className: "!bg-background dark:!bg-secondary min-w-32 justify-start" }}
                            />
                            <ParamCombobox
                                paramName="pr_payer"
                                isSearch={false}
                                label={t("vst.payer", "To'lovchi")}
                                options={payers ?? []}
                                addButtonProps={{ className: "!bg-background dark:!bg-secondary min-w-32 justify-start" }}
                            />
                            <ParamCombobox
                                paramName="pr_status"
                                isSearch={false}
                                label={t("table.status")}
                                options={[
                                    { id: "10", name: t("vst.st_pending", "Kutilmoqda") },
                                    { id: "20", name: t("vst.st_paid", "Berildi") },
                                    { id: "-10", name: t("vst.st_rejected", "Rad etildi") },
                                    { id: "-20", name: t("vst.st_canceled", "Bekor qilindi") },
                                ]}
                                addButtonProps={{ className: "!bg-background dark:!bg-secondary min-w-32 justify-start" }}
                            />
                            <ParamDateRange from="from_date" to="to_date" />
                        </div>
                    </div>
                }
            />
            <Modal modalKey="vst-request-reject" title={t("vst.reject_title", "So'rovni rad etish")} size="max-w-md">
                <DecisionRejectModal
                    modalKey="vst-request-reject"
                    url={selected ? `${KASSA_PAYMENT_REQUESTS}/${selected.id}/reject` : undefined}
                    rejectStatus={-10}
                    refetchKeys={[KASSA_PAYMENT_REQUESTS, KASSA_OVERVIEW]}
                />
            </Modal>
            <DeleteModal
                modalKey="vst-request-cancel"
                path={KASSA_PAYMENT_REQUESTS}
                id={selected?.id}
                refetchKeys={[KASSA_PAYMENT_REQUESTS, KASSA_OVERVIEW]}
            />
        </>
    )
}

export default VstPaymentRequests
