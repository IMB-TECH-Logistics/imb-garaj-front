import ParamInput from "@/components/as-params/input"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_DRIVERS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { PlusCircle } from "lucide-react"
import { useCallback } from "react"
import AddDriverModal from "./add-driver"
import { useColumnsDriverTable } from "./driver-cols"

const Drivers = () => {
    const hasControl = useHasAction("settings_drivers_control")
    const navigate = useNavigate()
    const search = useSearch({ strict: false })

    const { data, isLoading } = useGet<ListResponse<DriversType>>(
        SETTINGS_DRIVERS,
        {
            params: {
                search: search.driver_search,
                page: search.page,
                page_size: search.page_size,
                /**
                 * Server tomon saralash (B-70/B-71, 5-raund): sarlavha
                 * bosilganda `?ordering=` URL'ga yoziladi va shu yerdan
                 * so'rovga qo'shiladi. Ilgari tanstack faqat ko'rinib turgan
                 * 25 qatorni tartiblardi va javob butun to'plamniki emas edi.
                 */
                ordering: search.ordering,
            },
        },
    )

    const { getData, setData, clearKey } = useGlobalStore()
    const item = getData<DriversType>(SETTINGS_DRIVERS)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal(`create`)

    // Opening a driver's trips is an explicit action on the name cell, not a
    // click anywhere on the row — see driver-cols.tsx (UI audit S1-33).
    const handleOpenTrips = useCallback(
        (driver: DriversType) => {
            navigate({
                to: "/manager-trips/$id",
                params: { id: driver.id.toString() },
                search: {
                    driver_id: driver.id,
                    name: `${driver.first_name} ${driver.last_name}`,
                } as any,
            })
        },
        [navigate],
    )

    const columns = useColumnsDriverTable(handleOpenTrips)

    const handleDelete = (row: { original: DriversType }) => {
        setData(SETTINGS_DRIVERS, row.original)
        openDeleteModal()
    }

    const handleEdit = (item: DriversType) => {
        setData(SETTINGS_DRIVERS, item)
        openCreateModal()
    }

    const handleAdd = () => {
        clearKey(SETTINGS_DRIVERS)
        openCreateModal()
    }

    return (
        <>
            <DataTable
                loading={isLoading}
                numeration
                columns={columns}
                data={data?.results}
                onDelete={hasControl ? handleDelete : undefined}
                onEdit={
                    hasControl ?
                        ({ original }) => handleEdit(original)
                    :   undefined
                }
                head={
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold">
                                Haydovchilar
                            </h1>

                            <Badge className="text-sm">
                                {formatMoney(data?.count ?? 0)}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-3">
                            <ParamInput
                                searchKey="driver_search"
                                pageKey="page"
                            />

                            {hasControl && (
                                <Button
                                    className="flex items-center gap-2"
                                    onClick={handleAdd}
                                    icon={<PlusCircle size={18} />}
                                >
                                    Qo'shish
                                </Button>
                            )}
                        </div>
                    </div>
                }
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
            />

            <DeleteModal
                path={SETTINGS_DRIVERS}
                refetchKeys={[SETTINGS_DRIVERS]}
                id={item?.id}
                name={
                    item?.id ? (
                        <span className="block mb-2">
                            <b>
                                {`${item.first_name ?? ""} ${item.last_name ?? ""}`.trim()}
                            </b>
                            {" haydovchisi ro'yxatdan olib tashlanadi. "}
                            <span className="text-muted-foreground">
                                {`Yozuv bazadan butunlay o'chmaydi — faqat faolsizlantiriladi, shuning uchun "${item.username ?? ""}" logini band bo'lib qoladi va shu login bilan yangi haydovchi ochib bo'lmaydi.`}
                            </span>
                        </span>
                    ) : (
                        ""
                    )
                }
            />

            <Modal
                size="max-w-2xl"
                title={
                    item?.id ? " Haydovchini tahrirlash" : " Haydovchi qo'shish"
                }
                modalKey="create"
            >
                <AddDriverModal />
            </Modal>
        </>
    )
}

export default Drivers
