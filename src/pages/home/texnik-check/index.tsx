import { ParamCombobox } from "@/components/as-params/combobox"
import ParamDateRange from "@/components/as-params/date-picker-range"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import {
    TECHNICAL_INSPECT,
    SETTINGS_EXPENSES,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { useExpenseCols, type VehicleExpenseRow } from "./cols"
import AddExpenseModal from "./add-expense"

type SelectItem = { id: number | string; name: string }

export const TexnikCheck = () => {
    const search: any = useSearch({ strict: false })
    const { setData, getData, clearKey } = useGlobalStore()
    const { openModal } = useModal("add-expense")
    const { openModal: openDeleteModal } = useModal("delete")
    const current = getData<VehicleExpenseRow>(TECHNICAL_INSPECT)

    const { data: categoriesData } = useGet<ListResponse<SelectItem>>(
        SETTINGS_EXPENSES,
        { params: { type: 1, page_size: 100 } },
    )
    const expenseCategories = categoriesData?.results

    const currentDate = new Date()
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const defaultDateRange =
        !search?.from_date && !search?.to_date
            ? { from: startOfMonth, to: endOfMonth }
            : undefined

    const { data, isLoading } = useGet<ListResponse<VehicleExpenseRow>>(
        TECHNICAL_INSPECT,
        {
            params: {
                category: search?.category,
                from_date: search?.from_date,
                to_date: search?.to_date,
                page: search?.page,
                page_size: search?.page_size,
                search: search?.vehicle_search,
            },
        },
    )

    const columns = useExpenseCols()

    const handleAdd = () => {
        clearKey(TECHNICAL_INSPECT)
        openModal()
    }

    const handleEdit = (row: { original: VehicleExpenseRow }) => {
        setData(TECHNICAL_INSPECT, row.original)
        openModal()
    }

    const handleDelete = (row: { original: VehicleExpenseRow }) => {
        setData(TECHNICAL_INSPECT, row.original)
        openDeleteModal()
    }

    const comboStyle = {
        className: "!bg-background dark:!bg-secondary min-w-44 justify-start",
    }

    return (
        <div className="space-y-3">
            <DataTable
                columns={columns}
                loading={isLoading}
                data={data?.results || []}
                numeration
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
                            <h1 className="text-lg font-semibold">Xarajatlar</h1>
                            <Badge>{data?.count ?? 0}</Badge>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <ParamCombobox
                                paramName="category"
                                options={expenseCategories || []}
                                label="Xarajat turi"
                                addButtonProps={comboStyle}
                            />
                            <ParamDateRange
                                from="from_date"
                                to="to_date"
                                defaultValue={defaultDateRange}
                                addButtonProps={{
                                    className: "!bg-background dark:!bg-secondary min-w-44 justify-start",
                                }}
                            />
                            <Button onClick={handleAdd}>
                                <Plus size={16} />
                                Qo'shish
                            </Button>
                        </div>
                    </div>
                }
            />

            <Modal
                modalKey="add-expense"
                title={current?.id ? "Xarajat tahrirlash" : "Xarajat qo'shish"}
                size="max-w-xl"
            >
                <AddExpenseModal />
            </Modal>

            <DeleteModal path={TECHNICAL_INSPECT} id={current?.id} />
        </div>
    )
}
