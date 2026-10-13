import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SETTINGS_CUSTOMERS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import TableHeader from "../table-header"
import AddCustomersModal from "./add-customers"
import { useColumnsCustomersTable } from "./customers-cols"

const Customers = () => {
    const { t } = useTranslation()
    const hasControl = useHasAction("settings_customers_control")
    const search = useSearch({ strict: false })
    const navigate = useNavigate()
    const onlyMissing = (search as any).customer_missing === "true" || (search as any).customer_missing === true
    const { data, isLoading } = useGet<ListResponse<CustomersType>>(
        SETTINGS_CUSTOMERS,
        {
            params: {
                search: search.customer_search,
                page: search.page,
                page_size: search.page_size,
                ordering: (search as any).ordering,
                lat__isnull: onlyMissing ? true : undefined,
            },
        },
    )
    const { getData, setData } = useGlobalStore()
    const item = getData<CustomersType>(SETTINGS_CUSTOMERS)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal("create")
    const columns = useColumnsCustomersTable()

    const handleDelete = (row: { original: CustomersType }) => {
        setData(SETTINGS_CUSTOMERS, row.original)
        openDeleteModal()
    }
    const handleEdit = (item: CustomersType) => {
        setData(SETTINGS_CUSTOMERS, item)
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
                manualSorting={true}
                numeration={true}
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                head={
                    <TableHeader
                        fileName={t("nav.customers")}
                        url="excel"
                        storeKey={hasControl ? SETTINGS_CUSTOMERS : undefined}
                        pageKey="page"
                        searchKey="customer_search"
                        count={data?.count}
                        extraLeft={
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="customers-missing"
                                    checked={onlyMissing}
                                    onCheckedChange={(checked) =>
                                        navigate({
                                            search: (prev: Record<string, unknown>) => ({
                                                ...prev,
                                                customer_missing: checked ? "true" : undefined,
                                                page: undefined,
                                            }),
                                        } as any)
                                    }
                                />
                                <Label htmlFor="customers-missing" className="cursor-pointer whitespace-nowrap">
                                    {t("coordinates.only_missing")}
                                </Label>
                            </div>
                        }
                    />
                }
            />
            <DeleteModal
                path={SETTINGS_CUSTOMERS}
                id={item?.id}
                name={item?.name}
            />
            <Modal
                size="max-w-2xl"
                title={
                    item?.id ?
                        t("settings.customers.edit_title")
                    :   t("settings.customers.add_title")
                }
                modalKey={"create"}
            >
                <AddCustomersModal />
            </Modal>
        </>
    )
}

export default Customers
