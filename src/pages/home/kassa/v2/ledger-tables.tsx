import { DataTable } from "@/components/ui/datatable"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { ColumnDef } from "@tanstack/react-table"
import { ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { DriverExpense, KV2_DRIVERS, KV2_DRIVER_EXPENSES, LedgerRow, usePeriod } from "./api"
import { Money, Party, Note, DateCell } from "./table-cells"

export const LedgerTable = ({ head, driver }: { head: ReactNode; driver: number }) => {
    const { t } = useTranslation()
    const { data, isLoading } = useGet<{ balance: number; rows: LedgerRow[] }>(`${KV2_DRIVERS}/${driver}/ledger`)
    const columns = useMemo<ColumnDef<LedgerRow>[]>(
        () => [
            {
                header: t("form.amount"),
                accessorKey: "amount",
                cell: ({ row }) => <span className={cn(row.original.reversed && "line-through opacity-60")}><Money v={row.original.amount} /></span>,
            },
            { header: t("fin.kv2.col_kind"), accessorKey: "reason" },
            { header: t("fin.kv2.col_turnover"), accessorKey: "trip", cell: ({ row }) => (row.original.trip ? `#${row.original.trip}` : t("fin.kv2.to_balance")) },
            { header: t("form.comment"), accessorKey: "comment", cell: ({ row }) => <Note v={row.original.comment} /> },
            { header: t("form.date"), accessorKey: "date", cell: ({ row }) => <DateCell v={row.original.date} /> },
        ],
        [t],
    )
    return (
        <DataTable
            numeration
            loading={isLoading}
            columns={columns}
            data={data?.rows}
            wrapperClassName="md:h-full flex flex-col"
            tableWrapperClassName="flex-1 min-h-0 overflow-auto"
            head={head}
        />
    )
}

export const DriverExpensesTable = ({ head, kind }: { head: ReactNode; kind: "fuel" | "other" | "trip_cash" | "salary" }) => {
    const { t } = useTranslation()
    const period = usePeriod()
    const { data, isLoading } = useGet<DriverExpense[]>(KV2_DRIVER_EXPENSES, { params: { ...period, kind } })
    const columns = useMemo<ColumnDef<DriverExpense>[]>(
        () => [
            { header: t("form.date"), accessorKey: "date", cell: ({ row }) => <DateCell v={(kind === "trip_cash" && row.original.order_date) || row.original.date} /> },
            ...(kind === "trip_cash"
                ? [
                      { header: t("fin.kv2.col_from"), accessorKey: "loading", cell: ({ row }) => row.original.loading || "—" },
                      { header: t("fin.kv2.col_to"), accessorKey: "unloading", cell: ({ row }) => row.original.unloading || "—" },
                  ] as ColumnDef<DriverExpense>[]
                : [{ header: t("form.expense_type"), accessorKey: "category", cell: ({ row }) => row.original.category || "—" }] as ColumnDef<DriverExpense>[]),
            { header: t("form.amount"), accessorKey: "amount", cell: ({ row }) => <Money v={row.original.amount} dir={kind === "trip_cash" ? "in" : "out"} /> },
            { header: t("fin.kv2.col_who"), accessorKey: "driver", cell: ({ row }) => <Party name={[row.original.driver, row.original.plate].filter(Boolean).join(" · ") || null} trip={row.original.trip} /> },
            { header: t("form.comment"), accessorKey: "comment", cell: ({ row }) => <Note v={row.original.comment} /> },
        ],
        [t, kind],
    )
    return (
        <DataTable
            numeration
            loading={isLoading}
            columns={columns}
            data={data}
            wrapperClassName="md:h-full flex flex-col"
            tableWrapperClassName="flex-1 min-h-0 overflow-auto"
            head={head}
        />
    )
}
