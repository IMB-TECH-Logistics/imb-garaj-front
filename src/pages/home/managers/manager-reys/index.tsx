import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { InlineBreadcrumb } from "@/components/header/breadcrumbs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { MANAGERS_ORDERS, MANAGERS_VEHICLES } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { useGlobalStore } from "@/store/global-store"
import { useParams, useSearch } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { useColumnsManagersOrders } from "./cols"
import AddTripOrders from "./create-reys"

export default function ManagerReys() {
    const search = useSearch({ strict: false })
    const { name } = search as any
    const { openModal: openTripModal } = useModal(MANAGERS_ORDERS)
    const { openModal: deleteModal } = useModal(`${MANAGERS_ORDERS}-delete`)
    const { setData, getData, clearKey } = useGlobalStore()
    const item = getData(MANAGERS_VEHICLES)
    const { id } = useParams({ strict: false })
    const currentSelected = getData(MANAGERS_ORDERS)
    const { data } = useGet<ListResponse<ManagerOrders>>(`${MANAGERS_ORDERS}`, {
        params: {
            trip: id,
            page_size: search.page_size,
            page: search.page,
        },
    })
    const cols = useColumnsManagersOrders()
    const handleEdit = (value: ManagerOrders) => {
        setData(MANAGERS_ORDERS, value)
        openTripModal()
    }
    const handleDelete = (value: ManagerOrders) => {
        setData(MANAGERS_ORDERS, value)
        deleteModal()
    }

    const handleAdd = () => {
        clearKey(MANAGERS_ORDERS)
        openTripModal()
    }
    return (
        <>
            <DataTable
                columns={cols}
                data={data?.results || []}
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                onDelete={(row) => handleDelete(row.original)}
                onEdit={(row) => handleEdit(row.original)}
                head={
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <InlineBreadcrumb
                                    trailing={
                                        <>
                                            <Badge>{formatMoney(data?.count)}</Badge>
                                            <span className="text-muted-foreground">/</span>
                                            <span>{name || "nimadir"}</span>
                                        </>
                                    }
                                />
                            </div>
                            <Button onClick={handleAdd}>
                                <Plus size={16} />
                                Qo'shish
                            </Button>
                        </div>
                    </div>
                }
            />

            <Modal
                modalKey={MANAGERS_ORDERS}
                title={
                    currentSelected?.id ? "Reys tahrirlash" : "Reys qo'shish"
                }
            >
                <AddTripOrders />
            </Modal>

            <DeleteModal
                path={MANAGERS_ORDERS}
                modalKey={`${MANAGERS_ORDERS}-delete`}
                id={currentSelected?.id}
            />
        </>
    )
}
