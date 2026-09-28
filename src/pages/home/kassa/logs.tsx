import { ParamCombobox } from "@/components/as-params/combobox"
import ParamDateRange from "@/components/as-params/date-picker-range"
import ParamInput from "@/components/as-params/input"
import DownloadAsExcel from "@/components/download-as-excel"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { CHECKOUT_LOGS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"

type CheckoutLogEvent = "created" | "updated" | "deleted"

type CheckoutLog = {
    id: number
    created: string
    event: CheckoutLogEvent
    event_label: string
    through: string | null
    source: string | null
    type: number | null
    checkout_kind: "cash" | "card" | null
    amount: string
    balance_before: string | null
    balance_after: string | null
    comment: string | null
    actor: number | null
    actor_name: string | null
    actor_username: string | null
    transaction: number | null
}

const EVENT_VARIANT: Record<CheckoutLogEvent, "default" | "secondary" | "destructive"> = {
    created: "default",
    updated: "secondary",
    deleted: "destructive",
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

const useCheckoutLogCols = () => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<CheckoutLog>[]>(
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
                header: t("kassa_log.event"),
                accessorKey: "event",
                enableSorting: true,
                cell: ({ row }) => (
                    <Badge variant={EVENT_VARIANT[row.original.event] ?? "secondary"}>
                        {t(`log.${row.original.event}`, row.original.event_label)}
                    </Badge>
                ),
            },
            {
                header: t("kassa.checkout_kind"),
                accessorKey: "checkout_kind",
                cell: ({ row }) =>
                    row.original.checkout_kind === "card" ?
                        t("kassa.card")
                    : row.original.checkout_kind === "cash" ?
                        t("kassa.cash")
                    :   "—",
            },
            {
                header: t("table.source"),
                accessorKey: "source",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {row.original.source || "—"}
                        {row.original.type != null && (
                            <span className="text-muted-foreground">
                                {" · "}
                                {row.original.type === -1 ? t("form.expense") : t("form.income")}
                            </span>
                        )}
                    </span>
                ),
            },
            {
                header: t("form.amount"),
                accessorKey: "amount",
                enableSorting: true,
                cell: ({ row }) => {
                    const value = Number(row.original.amount)
                    return (
                        <span
                            className={cn(
                                "font-medium whitespace-nowrap",
                                value > 0 ? "text-green-600" : "text-destructive",
                            )}
                        >
                            {value > 0 ? "+" : ""}
                            {formatMoney(value)}
                        </span>
                    )
                },
            },
            {
                header: t("kassa_log.balance_before"),
                accessorKey: "balance_before",
                enableSorting: true,
                cell: ({ row }) =>
                    row.original.balance_before == null ?
                        "—"
                    :   formatMoney(Number(row.original.balance_before)),
            },
            {
                header: t("kassa_log.balance_after"),
                accessorKey: "balance_after",
                enableSorting: true,
                cell: ({ row }) =>
                    row.original.balance_after == null ?
                        "—"
                    :   formatMoney(Number(row.original.balance_after)),
            },
            {
                header: t("kassa_log.performed_by"),
                accessorKey: "actor_name",
                enableSorting: true,
                cell: ({ row }) =>
                    row.original.actor_name ||
                    row.original.actor_username ||
                    t("kassa_log.system"),
            },
            {
                header: t("form.comment"),
                accessorKey: "comment",
                cell: ({ row }) => (
                    <span className="flex flex-col">
                        <span>{row.original.comment || "—"}</span>
                        {row.original.transaction != null && (
                            <span className="text-xs text-muted-foreground">
                                #{row.original.transaction}
                            </span>
                        )}
                    </span>
                ),
            },
        ],
        [t],
    )
}

type Props = {
    switcher: ReactNode
}

const CheckoutLogs = ({ switcher }: Props) => {
    const { t } = useTranslation()
    const search = useSearch({ strict: false }) as any
    const columns = useCheckoutLogCols()

    const eventOptions = useMemo(
        () => [
            { id: "created", name: t("log.created") },
            { id: "updated", name: t("log.updated") },
            { id: "deleted", name: t("log.deleted") },
        ],
        [t],
    )
    const typeOptions = useMemo(
        () => [
            { id: "1", name: t("form.income") },
            { id: "-1", name: t("form.expense") },
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
        from_date: search.from_date,
        to_date: search.to_date,
        event: search.log_event,
        type: search.log_type,
        checkout_kind: search.log_kind,
        search: search.log_search,
        ordering: search.ordering,
    }

    const { data, isLoading } = useGet<ListResponse<CheckoutLog>>(
        CHECKOUT_LOGS,
        { params },
    )

    return (
        <DataTable
            numeration
            manualSorting
            loading={isLoading}
            columns={columns}
            data={data?.results}
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
                            searchKey="log_search"
                            placeholder={t("kassa_log.search")}
                            className="w-48"
                        />
                        <ParamCombobox
                            paramName="log_kind"
                            options={kindOptions}
                            isSearch={false}
                            label={t("kassa.checkout_kind")}
                            addButtonProps={{
                                className: "!bg-background dark:!bg-secondary min-w-36 justify-start",
                            }}
                        />
                        <ParamCombobox
                            paramName="log_event"
                            options={eventOptions}
                            isSearch={false}
                            label={t("kassa_log.event")}
                            addButtonProps={{
                                className: "!bg-background dark:!bg-secondary min-w-36 justify-start",
                            }}
                        />
                        <ParamCombobox
                            paramName="log_type"
                            options={typeOptions}
                            isSearch={false}
                            label={t("table.type")}
                            addButtonProps={{
                                className: "!bg-background dark:!bg-secondary min-w-32 justify-start",
                            }}
                        />
                        <ParamDateRange from="from_date" to="to_date" />
                        <DownloadAsExcel
                            url={`${CHECKOUT_LOGS}/excel`}
                            name={t("kassa_log.title")}
                            params={params}
                        />
                    </div>
                </div>
            }
        />
    )
}

export default CheckoutLogs
