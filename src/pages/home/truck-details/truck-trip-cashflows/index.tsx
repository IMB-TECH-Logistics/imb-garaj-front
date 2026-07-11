import DeleteModal from "@/components/custom/delete-modal"
import { DataTable } from "@/components/ui/datatable"
import { ORDER_CASHFLOWS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import { useCostCols } from "./cols"

const TruckTripCashflowRow = () => {
    const search = useSearch({ strict: false })
    const orderId = Number(search.order)
    const { data, isLoading } = useGet<ListResponse<CashflowRow>>(
        ORDER_CASHFLOWS,
        {
            params: { order: orderId },
        },
    )

    const { setData } = useGlobalStore()
    const { openModal: openDeleteModal } = useModal("delete-truck-trip-cashflow")
    const item = useGlobalStore.getState().getData<CashflowRow>(ORDER_CASHFLOWS)

    const columns = useCostCols()

    const handleDelete = (row: { original: CashflowRow }) => {
        setData(ORDER_CASHFLOWS, row.original)
        openDeleteModal()
    }

    return (
        <div className="space-y-3 border-t p-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium">Xarajatlar ro'yxati</h3>
                </div>
            </div>

            <DataTable
                loading={isLoading}
                columns={columns}
                data={data?.results}
                numeration
                onDelete={handleDelete}
                paginationProps={{
                    totalPages: data?.total_pages ?? 1,
                }}
            />

            <DeleteModal
                path={ORDER_CASHFLOWS}
                id={item?.id}
                modalKey="delete-truck-trip-cashflow"
                refetchKeys={[ORDER_CASHFLOWS]}
            />
        </div>
    )
}

export default TruckTripCashflowRow
