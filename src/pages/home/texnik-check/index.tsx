import { ParamCombobox } from "@/components/as-params/combobox"
import ParamDateRange from "@/components/as-params/date-picker-range"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DataTable } from "@/components/ui/datatable"
import {
    TECHNICAL_INSPECT,
    SETTINGS_EXPENSES,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useTechCheckAlerts } from "@/hooks/use-tech-check-alerts"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useState } from "react"
import { Plus } from "lucide-react"
import { useExpenseCols, type VehicleExpenseRow } from "./cols"
import AddExpenseModal from "./add-expense"
import ExpenseDetailSheet from "./detail-sheet"
import { useTranslation } from "react-i18next"
import ParamTabs from "@/components/as-params/tabs"
import VehiclesTab from "./vehicles-tab"

type SelectItem = { id: number | string; name: string }

const Inspections = () => {
    const search: any = useSearch({ strict: false })
    const navigate = useNavigate()
    const onlyAlerts = search?.ti_alert === "1" || search?.ti_alert === 1
    const { count: alertCount } = useTechCheckAlerts()
    const { setData, getData, clearKey } = useGlobalStore()
    const { openModal } = useModal("add-expense")
    const { openModal: openDeleteModal } = useModal("delete")
    const current = getData<VehicleExpenseRow>(TECHNICAL_INSPECT)
    const [detail, setDetail] = useState<VehicleExpenseRow | null>(null)

    const { data: categoriesData } = useGet<ListResponse<SelectItem>>(
        SETTINGS_EXPENSES,
        { params: { type: 1, page_size: 100 } },
    )
    const expenseCategories = categoriesData?.results

    const currentDate = new Date()
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const defaultDateRange =
        !onlyAlerts && !search?.from_date && !search?.to_date
            ? { from: startOfMonth, to: endOfMonth }
            : undefined

    const { data, isLoading } = useGet<ListResponse<VehicleExpenseRow>>(
        TECHNICAL_INSPECT,
        {
            params: {
                category: search?.category,
                from_date: onlyAlerts ? undefined : search?.from_date,
                to_date: onlyAlerts ? undefined : search?.to_date,
                alert: onlyAlerts ? 1 : undefined,
                page: search?.page,
                page_size: search?.page_size,
                search: search?.vehicle_search,
                ordering: (search as any).ordering,
            },
        },
    )

    const columns = useExpenseCols()

    const toggleAlerts = () =>
        navigate({
            search: {
                ...search,
                ti_alert: onlyAlerts ? undefined : "1",
                page: undefined,
            } as any,
        })

    const handleAdd = () => {
        clearKey(TECHNICAL_INSPECT)
        openModal()
    }

    const handleEdit = (row: { original: VehicleExpenseRow }) => {
        setData(TECHNICAL_INSPECT, row.original)
        openModal()
    }

    const handleDetailEdit = (row: VehicleExpenseRow) => {
        setDetail(null)
        handleEdit({ original: row })
    }

    const handleDelete = (row: { original: VehicleExpenseRow }) => {
        setData(TECHNICAL_INSPECT, row.original)
        openDeleteModal()
    }

    const comboStyle = {
        className: "!bg-background dark:!bg-secondary min-w-44 justify-start",
    }

    const { t } = useTranslation()
    return (
        <div className="space-y-3">
            <DataTable
                columns={columns}
                loading={isLoading}
                data={data?.results || []}
                numeration
                manualSorting
                onRowClick={setDetail}
                onEdit={handleEdit}
                onDelete={handleDelete}
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                    page_sizes: [25, 50, 100, 250, 500],
                }}
                head={
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold">{t("page.expense_list")}</h1>
                            <Badge>{data?.count ?? 0}</Badge>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 shrink-0">
                                <Switch id="ti-alert-switch" checked={onlyAlerts} onCheckedChange={toggleAlerts} />
                                <Label htmlFor="ti-alert-switch" className="cursor-pointer text-sm">
                                    Amal muddati tugayotganlar
                                    {alertCount > 0 && ` (${alertCount})`}
                                </Label>
                            </div>
                            <ParamCombobox
                                paramName="category"
                                options={expenseCategories || []}
                                label={t("form.expense_type")}
                                addButtonProps={comboStyle}
                            />
                            {!onlyAlerts && <ParamDateRange
                                from="from_date"
                                to="to_date"
                                defaultValue={defaultDateRange}
                                addButtonProps={{
                                    className: "!bg-background dark:!bg-secondary min-w-44 justify-start",
                                }}
                            />}
                            <Button onClick={handleAdd}>
                                <Plus size={16} />
                                {t("actions.add")}
                            </Button>
                        </div>
                    </div>
                }
            />

            <Modal
                modalKey="add-expense"
                title={current?.id ? "Xarajatni tahrirlash" : "Xarajat qo'shish"}
                size="max-w-2xl"
            >
                <AddExpenseModal />
            </Modal>

            <ExpenseDetailSheet
                row={detail}
                onClose={() => setDetail(null)}
                onEdit={handleDetailEdit}
            />

            <DeleteModal path={TECHNICAL_INSPECT} id={current?.id} />
        </div>
    )
}

export const TexnikCheck = () => {
    const { t } = useTranslation()
    const search = useSearch({ strict: false }) as Record<string, unknown>
    const tab = search.ti_tab === "vehicles" ? "vehicles" : "expenses"

    return (
        <div className="flex flex-col w-full gap-3">
            <ParamTabs
                paramName="ti_tab"
                options={[
                    { value: "expenses", label: t("texnik.tab_expenses") },
                    { value: "vehicles", label: t("texnik.vehicles.title") },
                ]}
            />
            {tab === "vehicles" ? <VehiclesTab /> : <Inspections />}
        </div>
    )
}
