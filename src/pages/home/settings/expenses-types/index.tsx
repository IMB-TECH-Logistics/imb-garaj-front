import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_EXPENSES } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import TableHeader from "../table-header"
import AddExpensesModal, { type ExpenseCategoryType } from "./add-expenses"
import { useColumnsExpensesTable } from "./expenses-cols"

const ExpensesTypePage = () => {
    const hasControl = useHasAction("settings_expense_types_control")
    const search = useSearch({ strict: false })
    const { data, isLoading } = useGet<ListResponse<ExpenseCategoryType>>(
        SETTINGS_EXPENSES,
        {
            params: {
                search: search.expense_type,
                page: search.page , 
                page_size: search.page_size 
            },
        },
    )
    const { getData, setData } = useGlobalStore()
    const item = getData<ExpenseCategoryType>(SETTINGS_EXPENSES)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal(`create`)
    const columns = useColumnsExpensesTable()

    const handleDelete = (row: { original: ExpenseCategoryType }) => {
        setData(SETTINGS_EXPENSES, row.original)
        openDeleteModal()
    }
    const handleEdit = (item: ExpenseCategoryType) => {
        setData(SETTINGS_EXPENSES, item)
        openCreateModal()
    }
    return (
        <>
            <DataTable
                loading={isLoading}
                columns={columns}
                data={data?.results}
                onDelete={hasControl ? handleDelete : undefined}
                onEdit={hasControl ? ({ original }) => handleEdit(original) : undefined}
                numeration
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page", 
                    pageSizeParamName: "page_size"
                    
                }}
                head={
                    <TableHeader
                        fileName="Xarajat turlari"
                        url="excel"
                        storeKey={hasControl ? SETTINGS_EXPENSES : undefined}
                        searchKey="expense_type"
                        pageKey="page"
                        count={data?.count}
                    />
                }
            />
            <DeleteModal
                path={SETTINGS_EXPENSES}
                id={item?.id}
                name={
                    item?.name ?
                        <span className="block font-medium mb-1">
                            Xarajat turi: «{item.name}»
                        </span>
                    :   ""
                }
            />
            <Modal
                title={
                    item?.id ?
                        "Xarajat turini tahrirlash"
                    :   "Xarajat turi qo'shish"
                }
                modalKey="create"
            >
                <AddExpensesModal />
            </Modal>
        </>
    )
}

export default ExpensesTypePage
