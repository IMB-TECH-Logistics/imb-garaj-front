import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_CARGO_TYPE } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { ArchiveRestore } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import TableHeader from "../table-header"
import AddCargoModal from "./add-cargo"
import { useColumnsCargoTable } from "./cargo-cols"

const CargoPage = () => {
    const { t } = useTranslation()
    const hasControl = useHasAction("settings_cargo_types_control")
    const search = useSearch({ strict: false })
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [showDeleted, setShowDeleted] = useState(false)

    const { data, isLoading } = useGet<ListResponse<RolesType>>(
        SETTINGS_CARGO_TYPE,
        {
            params: {
                search: search.cargo_search,
                page: search.page,
                page_size: search.page_size,
                deleted: showDeleted || undefined,
            },
        },
    )

    const { getData, setData } = useGlobalStore()
    const item = getData<RolesType>(SETTINGS_CARGO_TYPE)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal(`create`)
    const columns = useColumnsCargoTable()

    const { mutate: restoreCargo } = usePost({
        onSuccess: () => {
            toast.success(t("toast.restored"))
            queryClient.refetchQueries({ queryKey: [SETTINGS_CARGO_TYPE] })
        },
    })

    const handleDelete = (row: { original: RolesType }) => {
        setData(SETTINGS_CARGO_TYPE, row.original)
        openDeleteModal()
    }

    const handleEdit = (item: RolesType) => {
        setData(SETTINGS_CARGO_TYPE, item)
        openCreateModal()
    }

    const handleRestore = (row: { original: RolesType }) => {
        restoreCargo(`${SETTINGS_CARGO_TYPE}/${row.original.id}/restore`, {})
    }

    return (
        <>
            <DataTable
                loading={isLoading}
                columns={columns}
                data={data?.results}
                onDelete={
                    hasControl && !showDeleted ? handleDelete : undefined
                }
                onEdit={
                    hasControl && !showDeleted ?
                        ({ original }) => handleEdit(original)
                    :   undefined
                }
                onUndo={
                    hasControl && showDeleted ? handleRestore : undefined
                }
                numeration
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                head={
                    <TableHeader
                        fileName={
                            showDeleted ?
                                "O'chirilgan yuk turlari"
                            :   "Yuk turi"
                        }
                        url="excel"
                        storeKey={
                            hasControl && !showDeleted ?
                                SETTINGS_CARGO_TYPE
                            :   undefined
                        }
                        searchKey="cargo_search"
                        pageKey="page"
                        count={data?.count}
                        extraRight={
                            hasControl ?
                                <Button
                                    variant={
                                        showDeleted ? "secondary" : "outline"
                                    }
                                    icon={<ArchiveRestore size={18} />}
                                    onClick={() => {
                                        setShowDeleted((v) => !v)
                                        navigate({
                                            search: {
                                                ...search,
                                                page: undefined,
                                            },
                                        })
                                    }}
                                >
                                    {showDeleted ?
                                        t("status.active")
                                    :   t("status.archive")}
                                </Button>
                            :   undefined
                        }
                    />
                }
            />

            <DeleteModal path={SETTINGS_CARGO_TYPE} id={item?.id} name={item?.name ? `«${item?.name}» ` : ""} />

            <Modal
                title={
                    item?.id ? t("actions.edit") + " " + t("nav.cargo_types").toLowerCase() : t("actions.add") + " " + t("nav.cargo_types").toLowerCase()
                }
                modalKey="create"
            >
                <AddCargoModal />
            </Modal>
        </>
    )
}

export default CargoPage
