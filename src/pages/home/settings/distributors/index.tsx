import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SETTINGS_DISTRIBUTORS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import TableHeader from "../table-header"
import DistributorLocationModal, { DISTRIBUTOR_LOCATION_KEY } from "./distributor-location"
import { useColumnsDistributorsTable } from "./distributors-cols"

const Distributors = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const search = useSearch({ strict: false }) as Record<string, any>
    const onlyMissing = search.distributor_missing === "true" || search.distributor_missing === true
    const canControl = useHasAction("settings_distributors_control")
    const { setData } = useGlobalStore()
    const { openModal } = useModal(DISTRIBUTOR_LOCATION_KEY)
    const { data, isLoading } = useGet<ListResponse<DistributorType>>(
        SETTINGS_DISTRIBUTORS,
        {
            params: {
                search: search.distributor_search,
                page: search.page,
                page_size: search.page_size,
                located: onlyMissing ? 0 : undefined,
            },
        },
    )
    const columns = useColumnsDistributorsTable()

    const editLocation = (row: { original: DistributorType }) => {
        setData(DISTRIBUTOR_LOCATION_KEY, row.original)
        openModal()
    }

    return (
        <>
            <DataTable
                loading={isLoading}
                columns={columns}
                data={data?.results}
                numeration={true}
                onEdit={canControl ? editLocation : undefined}
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                head={
                    <TableHeader
                        fileName={t("nav.distributors")}
                        url="excel"
                        pageKey="page"
                        searchKey="distributor_search"
                        count={data?.count}
                        extraLeft={
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="distributors-missing"
                                    checked={onlyMissing}
                                    onCheckedChange={(checked) =>
                                        navigate({
                                            search: (prev: Record<string, unknown>) => ({
                                                ...prev,
                                                distributor_missing: checked ? "true" : undefined,
                                                page: undefined,
                                            }),
                                        } as any)
                                    }
                                />
                                <Label htmlFor="distributors-missing" className="cursor-pointer whitespace-nowrap">
                                    {t("coordinates.only_missing")}
                                </Label>
                            </div>
                        }
                    />
                }
            />
            <Modal title={t("coordinates.edit_title")} modalKey={DISTRIBUTOR_LOCATION_KEY} size="max-w-2xl">
                <DistributorLocationModal />
            </Modal>
        </>
    )
}

export default Distributors
