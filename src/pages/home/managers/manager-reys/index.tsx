import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { InlineBreadcrumb } from "@/components/header/breadcrumbs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import { MANAGERS_ORDERS, MANAGERS_VEHICLES } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { useGlobalStore } from "@/store/global-store"
import { useParams, useSearch } from "@tanstack/react-router"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { useState } from "react"
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
    const hasControl = useHasAction("manager_vehicles_control")

    const [previewImages, setPreviewImages] = useState<{ id: number; image: string }[]>([])
    const [previewIndex, setPreviewIndex] = useState<number | null>(null)

    const cols = useColumnsManagersOrders({
        onImageClick: (images) => {
            setPreviewImages(images)
            setPreviewIndex(0)
        },
    })

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
                onDelete={hasControl ? (row) => handleDelete(row.original) : undefined}
                onEdit={hasControl ? (row) => handleEdit(row.original) : undefined}
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
                            {hasControl && (
                                <Button onClick={handleAdd}>
                                    <Plus size={16} />
                                    Qo'shish
                                </Button>
                            )}
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

            <Dialog
                open={previewIndex !== null}
                onOpenChange={() => setPreviewIndex(null)}
            >
                <DialogContent className="max-w-3xl p-2">
                    {previewIndex !== null && previewImages[previewIndex] && (
                        <div className="relative flex items-center justify-center">
                            {previewImages.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPreviewIndex(
                                            (previewIndex - 1 + previewImages.length) %
                                                previewImages.length,
                                        )
                                    }
                                    className="absolute left-2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:bg-accent transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                            )}
                            <img
                                src={previewImages[previewIndex].image.replace("http://", "https://")}
                                alt="preview"
                                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                            />
                            {previewImages.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPreviewIndex(
                                            (previewIndex + 1) % previewImages.length,
                                        )
                                    }
                                    className="absolute right-2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:bg-accent transition-colors"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            )}
                            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm text-sm px-3 py-1 rounded-full">
                                {previewIndex + 1} / {previewImages.length}
                            </span>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
