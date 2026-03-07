import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_EXPENSES } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import TableHeader from "../table-header"
import AddExpensesModal from "./add-expenses"
import { useColumnsExpensesTable } from "./expenses-cols"

const ExpensesTypePage = () => {
    const search = useSearch({ strict: false })
    const { data, isLoading } = useGet<ListResponse<VehicleRoleType>>(
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
    const item = getData<VehicleRoleType>(SETTINGS_EXPENSES)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal(`create`)
    const columns = useColumnsExpensesTable()

    const handleDelete = (row: { original: VehicleRoleType }) => {
        setData(SETTINGS_EXPENSES, row.original)
        openDeleteModal()
    }
    const handleEdit = (item: VehicleRoleType) => {
        setData(SETTINGS_EXPENSES, item)
        openCreateModal()
    }
    return (
        <>
            <DataTable
                loading={isLoading}
                columns={columns}
                data={data?.results}
                onDelete={handleDelete}
                onEdit={({ original }) => handleEdit(original)}
                numeration
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page", 
                    pageSizeParamName: "page_size"
                    
                }}
                head={
                    <TableHeader
                        fileName="Xarajatlar"
                        url="excel"
                        storeKey={SETTINGS_EXPENSES}
                        searchKey="expense_type"
                        pageKey="page"
                    />
                }
            />
            <DeleteModal path={SETTINGS_EXPENSES} id={item?.id} />
            <Modal
                title={
                    item?.id ?
                        "Xarajat turinni tahrirlash"
                    :   " Xarajat qo'shish"
                }
                modalKey="create"
            >
                <AddExpensesModal />
            </Modal>
        </>
    )
}

export default ExpensesTypePage
