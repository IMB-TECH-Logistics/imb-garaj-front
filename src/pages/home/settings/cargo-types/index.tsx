import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_CARGO_TYPE } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import TableHeader from "../table-header"
import AddCargoModal from "./add-cargo"
import { useColumnsCargoTable } from "./cargo-cols"

const CargoPage = () => {
    const hasControl = useHasAction("settings_cargo_types_control")
    const search = useSearch({ strict: false })

    // page / page_size uzatilmasa sahifalash umuman ishlamaydi va 25 tadan
    // keyingi yuk turlari UI orqali ochib bo'lmaydigan bo'lib qoladi (S3-15).
    const { data, isLoading } = useGet<ListResponse<RolesType>>(
        SETTINGS_CARGO_TYPE,
        {
            params: {
                search: search.cargo_search,
                page: search.page,
                page_size: search.page_size,
            },
        },
    )

    const { getData, setData } = useGlobalStore()
    const item = getData<RolesType>(SETTINGS_CARGO_TYPE)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal(`create`)
    const columns = useColumnsCargoTable()

    const handleDelete = (row: { original: RolesType }) => {
        setData(SETTINGS_CARGO_TYPE, row.original)
        openDeleteModal()
    }

    const handleEdit = (item: RolesType) => {
        setData(SETTINGS_CARGO_TYPE, item)
        openCreateModal()
    }

    return (
        <>
            <DataTable
                loading={isLoading}
                columns={columns}
                data={data?.results}
                onDelete={hasControl ? handleDelete : undefined}
                onEdit={
                    hasControl ?
                        ({ original }) => handleEdit(original)
                    :   undefined
                }
                numeration
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                head={
                    <TableHeader
                        fileName="Yuk turi"
                        url="excel"
                        storeKey={hasControl ? SETTINGS_CARGO_TYPE : undefined}
                        searchKey="cargo_search"
                        pageKey="page"
                        count={data?.count}
                    />
                }
            />

            {/*
              Yuk turi backendda "yumshoq" o'chiriladi va band ekani
              tekshirilmaydi — ishlatilayotgan tur ham jimgina yo'qoladi (S3-11).
              Backend PROTECT qo'ygunicha hech bo'lmasa tasdiq oynasi
              qaysi yozuv o'chirilayotganini va xavfni aniq aytadi.
            */}
            <DeleteModal
                path={SETTINGS_CARGO_TYPE}
                id={item?.id}
                name={
                    item?.name ?
                        <span className="block mb-1">
                            <span className="font-medium">
                                Yuk turi: «{item.name}»
                            </span>
                            <span className="block text-destructive text-sm font-normal mt-1">
                                Diqqat: bu tur buyurtma va yo'nalishlarda
                                ishlatilayotgan bo'lishi mumkin. O'chirilsa u
                                ma'lumotnomadan yo'qoladi, lekin eski
                                yozuvlar unga bog'langanicha qoladi va turni
                                qayta tiklab bo'lmaydi.
                            </span>
                        </span>
                    :   ""
                }
            />

            <Modal
                title={
                    item?.id ? "Yuk turini tahrirlash" : "Yuk turi qo'shish"
                }
                modalKey="create"
            >
                <AddCargoModal />
            </Modal>
        </>
    )
}

export default CargoPage
