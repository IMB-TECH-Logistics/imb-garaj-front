import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { SETTINTS_PAYMENT_TYPE } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import TableHeader from "../table-header"
import AddPaymentTypeModal from "./add-payment"
import { useColumnsPaymentTable } from "./payment-cols"

const PaymenTypePage = () => {
    const search = useSearch({ strict: false })
    const { data, isLoading } = useGet<ListResponse<RolesType>>(
        SETTINTS_PAYMENT_TYPE,
        {
            params: {
                search: search.payment_type,
                page: search.page,
                page_size: search.page_size,
            },
        },
    )
    const { getData, setData } = useGlobalStore()
    const item = getData<RolesType>(SETTINTS_PAYMENT_TYPE)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal(`create`)
    const columns = useColumnsPaymentTable()

    const handleDelete = (row: { original: RolesType }) => {
        setData(SETTINTS_PAYMENT_TYPE, row.original)
        openDeleteModal()
    }
    const handleEdit = (item: RolesType) => {
        setData(SETTINTS_PAYMENT_TYPE, item)
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
                    pageSizeParamName: "page_size",
                }}
                head={
                    <TableHeader
                        fileName="To'lov turlari"
                        url="excel"
                        storeKey={SETTINTS_PAYMENT_TYPE}
                        pageKey="page"
                        searchKey="payment_type"
                    />
                }
            />
            <DeleteModal path={SETTINTS_PAYMENT_TYPE} id={item?.id} />
            <Modal
                title={
                    item?.id ?
                        "To'lov turini tahrirlash"
                    :   " To'lov turini qo'shish"
                }
                modalKey="create"
            >
                <AddPaymentTypeModal />
            </Modal>
        </>
    )
}

export default PaymenTypePage
