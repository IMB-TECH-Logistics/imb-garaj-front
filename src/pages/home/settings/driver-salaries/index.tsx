import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { DRIVER_SALARIES } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import TableHeader from "../table-header"
import AddDriverSalaryModal from "./add-edit"
import { SalaryHistoryPopover, useDriverSalaryCols, type DriverSalaryRow } from "./cols"

const DriverSalariesPage = () => {
    const hasControl = useHasAction("settings_driver_salaries_control")
    const search = useSearch({ strict: false }) as any
    const { data, isLoading } = useGet<ListResponse<DriverSalaryRow>>(
        DRIVER_SALARIES,
        {
            params: {
                search: search.salary_search,
                page: search.page,
                page_size: search.page_size,
            },
        },
    )
    const { getData, setData } = useGlobalStore()
    const item = getData<DriverSalaryRow>(DRIVER_SALARIES)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal("create")
    const columns = useDriverSalaryCols()

    const handleDelete = (row: { original: DriverSalaryRow }) => {
        setData(DRIVER_SALARIES, row.original)
        openDeleteModal()
    }
    const handleEdit = (row: DriverSalaryRow) => {
        setData(DRIVER_SALARIES, row)
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
                rowAction={(row) =>
                    (row.amounts?.length ?? 0) > 1 ? (
                        <SalaryHistoryPopover amounts={row.amounts} />
                    ) : null
                }
                numeration
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                head={
                    <TableHeader
                        fileName="Oylik tariflar"
                        url=""
                        storeKey={hasControl ? DRIVER_SALARIES : undefined}
                        pageKey="page"
                        searchKey="salary_search"
                        count={data?.count}
                    />
                }
            />
            <DeleteModal
                path={`${DRIVER_SALARIES}/${item?.id}/delete`}
                id={item?.id}
                refetchKeys={[DRIVER_SALARIES]}
            />
            <Modal
                title={item?.id ? "Oylik tarifini tahrirlash" : "Yangi oylik tarifi"}
                modalKey="create"
                size="max-w-md"
            >
                <AddDriverSalaryModal />
            </Modal>
        </>
    )
}

export default DriverSalariesPage
