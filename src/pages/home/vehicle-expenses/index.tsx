import { ParamCombobox } from "@/components/as-params/combobox"
import ParamDateRange from "@/components/as-params/date-picker-range"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_SELECTABLE_EXPENSE_CATEGORY, VEHICLES_CASHFLOWS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { useSearch } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import AddVehicleExpenseModal, { VEHICLE_EXPENSE_MODAL, type VehicleExpense } from "./add-expense"

type SelectItem = { id: number | string; name: string }

const filterButtonProps = {
    className: "w-auto gap-2 whitespace-nowrap font-normal !bg-background dark:!bg-secondary",
}

export const VehicleExpenses = () => {
    const { t } = useTranslation()
    const search = useSearch({ strict: false }) as Record<string, any>
    const canControl = useHasAction("manager_cashflow_control")
    const { openModal } = useModal(VEHICLE_EXPENSE_MODAL)
    const { openModal: openDelete } = useModal("delete-vehicle-expense")
    const [editing, setEditing] = useState<VehicleExpense | null>(null)
    const [deleting, setDeleting] = useState<VehicleExpense | null>(null)

    const { data: vehicles } = useGet<SelectItem[]>("selectable/vehicle", { params: { model_name: "vehicle" } })
    const { data: categories } = useGet<SelectItem[]>(SETTINGS_SELECTABLE_EXPENSE_CATEGORY, { params: { type: 1 } })
    const { data, isLoading } = useGet<ListResponse<VehicleExpense>>(VEHICLES_CASHFLOWS, {
        params: {
            vehicle: search.vehicle,
            category: search.category,
            from_date: search.from_date,
            to_date: search.to_date,
            page: search.page,
            page_size: search.page_size,
        },
    })
    const total = useMemo(() => (data?.results ?? []).reduce((s, r) => s + Number(r.amount || 0), 0), [data])

    const columns = useMemo<ColumnDef<VehicleExpense>[]>(
        () => [
            {
                header: t("form.date"),
                accessorKey: "date",
                cell: ({ row }) => <span className="whitespace-nowrap">{row.original.date ? format(new Date(row.original.date), "dd.MM.yyyy") : "—"}</span>,
            },
            { header: t("form.truck_number"), accessorKey: "vehicle_number" },
            { header: t("form.expense_type"), accessorKey: "category_name" },
            {
                header: t("table.amount"),
                accessorKey: "amount",
                cell: ({ row }) => <span className="whitespace-nowrap tabular-nums text-destructive">{formatMoney(Number(row.original.amount || 0))}</span>,
            },
            {
                header: t("form.comment"),
                accessorKey: "comment",
                cell: ({ row }) => <span className="text-muted-foreground line-clamp-2 max-w-64">{row.original.comment || "—"}</span>,
            },
            {
                header: t("table.user_col"),
                accessorKey: "executor_name",
                cell: ({ row }) => <span className="text-muted-foreground">{row.original.executor_name || "—"}</span>,
            },
        ],
        [t],
    )

    return (
        <>
            <DataTable
                numeration
                loading={isLoading}
                columns={columns}
                data={data?.results}
                onEdit={canControl ? ({ original }) => { setEditing(original); openModal() } : undefined}
                onDelete={canControl ? ({ original }) => { setDeleting(original); openDelete() } : undefined}
                paginationProps={{ totalPages: data?.total_pages, paramName: "page", pageSizeParamName: "page_size" }}
                head={
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-semibold">{t("nav.vehicle_expenses")}</h1>
                            <span className="text-sm text-muted-foreground">
                                {t("fin.vehicle_expenses.total")}: <b className="tabular-nums text-foreground">{formatMoney(total)} {t("page.som")}</b>
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <ParamCombobox paramName="vehicle" label={t("form.truck_number")} options={vehicles ?? []} valueKey="id" labelKey="name" addButtonProps={filterButtonProps} />
                            <ParamCombobox paramName="category" label={t("form.expense_type")} options={categories ?? []} valueKey="id" labelKey="name" isSearch={false} addButtonProps={filterButtonProps} />
                            <ParamDateRange from="from_date" to="to_date" addButtonProps={{ className: "w-auto gap-2 whitespace-nowrap justify-start !bg-background dark:!bg-secondary" }} />
                            {canControl && (
                                <Button onClick={() => { setEditing(null); openModal() }}>
                                    <Plus size={16} />
                                    {t("actions.add")}
                                </Button>
                            )}
                        </div>
                    </div>
                }
            />
            <Modal modalKey={VEHICLE_EXPENSE_MODAL} title={editing ? t("page.edit_record") : t("fin.vehicle_expenses.add")} size="max-w-md">
                <AddVehicleExpenseModal editing={editing} vehicles={vehicles ?? []} categories={categories ?? []} />
            </Modal>
            <DeleteModal
                modalKey="delete-vehicle-expense"
                path={VEHICLES_CASHFLOWS}
                id={deleting?.id}
                refetchKeys={[VEHICLES_CASHFLOWS]}
            />
        </>
    )
}
