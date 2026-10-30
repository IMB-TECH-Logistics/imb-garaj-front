import { Combobox } from "@/components/ui/combobox"
import { DataTable } from "@/components/ui/datatable"
import { useGet } from "@/hooks/useGet"
import { cn } from "@/lib/utils"
import { ColumnDef } from "@tanstack/react-table"
import { ReactNode, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { DriverExpense, KV2_DRIVERS, KV2_DRIVER_EXPENSES, LedgerRow, n, usePeriod } from "./api"
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

export const DriverExpensesTable = ({ head, kind }: { head: (total: number | null, filters: ReactNode) => ReactNode; kind: "fuel" | "other" | "trip_cash" | "salary" }) => {
    const { t } = useTranslation()
    const period = usePeriod()
    const { data, isLoading } = useGet<DriverExpense[]>(KV2_DRIVER_EXPENSES, { params: { ...period, kind } })
    const [who, setWho] = useState<string | null>(null)
    const [plate, setPlate] = useState<string | null>(null)
    const uniq = (list: (string | null)[]) => [...new Set(list.map((v) => v || "—"))].sort((a, b) => a.localeCompare(b))
    const drivers = useMemo(() => uniq((data ?? []).filter((r) => !plate || (r.plate || "—") === plate).map((r) => r.driver)), [data, plate])
    const plates = useMemo(() => uniq((data ?? []).filter((r) => !who || (r.driver || "—") === who).map((r) => r.plate)), [data, who])
    const rows = useMemo(
        () => (who || plate ? (data ?? []).filter((r) => (!who || (r.driver || "—") === who) && (!plate || (r.plate || "—") === plate)) : data),
        [data, who, plate],
    )
    const total = (rows ?? []).reduce((sum, r) => sum + n(r.amount), 0)
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
            data={rows}
            wrapperClassName="md:h-full flex flex-col"
            tableWrapperClassName="flex-1 min-h-0 overflow-auto"
            head={head(
                who || plate ? (kind === "trip_cash" ? total : -total) : null,
                <>
                        <Combobox
                            label={t("table.driver")}
                            options={drivers.map((d) => ({ id: d, name: d }))}
                            value={who}
                            setValue={(v: any) => setWho(v ? String(v) : null)}
                            labelKey="name"
                            valueKey="id"
                            className="h-10 w-56"
                        />
                        <Combobox
                            label={t("table.vehicle")}
                            options={plates.map((d) => ({ id: d, name: d }))}
                            value={plate}
                            setValue={(v: any) => setPlate(v ? String(v) : null)}
                            labelKey="name"
                            valueKey="id"
                            className="h-10 w-44"
                        />
                </>,
            )}
        />
    )
}
