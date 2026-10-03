import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { InlineBreadcrumb } from "@/components/header/breadcrumbs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    MANAGERS_ORDERS,
    MANAGERS_ORDERS_INTEGRATION_COUNT,
    MANAGERS_TRIPS,
    MANAGERS_VEHICLES,
} from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { formatMoney } from "@/lib/format-money"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useParams, useSearch } from "@tanstack/react-router"
import { Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useColumnsManagersOrders } from "./cols"
import ApproveTripModal, { APPROVE_TRIP_MODAL_KEY } from "./approve-trip-modal"
import AddTripOrders from "./create-reys"
import ReysFilters, { REYS_FILTER_KEYS } from "./reys-filters"
import AdvanceBadge from "../managers-trips/advance-badge"
import ParamDateRange from "@/components/as-params/date-picker-range"

export default function ManagerReys() {
    const { t } = useTranslation()
    const search = useSearch({ strict: false })
    const { name } = search as any
    const { openModal: openTripModal } = useModal(MANAGERS_ORDERS)
    const { openModal: deleteModal } = useModal(`${MANAGERS_ORDERS}-delete`)
    const { setData, getData, clearKey } = useGlobalStore()
    const item = getData(MANAGERS_VEHICLES)
    const { id } = useParams({ strict: false })
    const tripId = id && id !== "all" ? id : undefined
    const { data: trip, error: tripError } = useGet<{
        driver_name: string | null
        vehicle_number: string | null
        vehicle?: number
        pending_advance?: number | null
        rejected_advance?: { amount: number; reason: string | null } | null
    }>(`${MANAGERS_TRIPS}/${tripId}`, {
        enabled: !!tripId && !name,
        options: { retry: false },
    })
    useEffect(() => {
        if (trip?.vehicle) {
            setData("manager-trips-vehicle-id", trip.vehicle)
        }
    }, [trip?.vehicle, setData])
    const tripLabel =
        name ||
        (id === "all" ? t("reys_bulk.all_label") : null) ||
        [trip?.vehicle_number, trip?.driver_name].filter(Boolean).join(" - ") ||
        (tripError?.response?.status === 404 ? "Reys topilmadi" : "—")
    const currentSelected = getData(MANAGERS_ORDERS)
    const { data } = useGet<ListResponse<ManagerOrders>>(`${MANAGERS_ORDERS}`, {
        params: {
            trip: tripId,
            page_size: search.page_size,
            page: search.page,
            ordering: (search as any).ordering,
            ...Object.fromEntries(
                REYS_FILTER_KEYS.map((key) => [key, (search as any)[key]]),
            ),
        },
    })
    const hasControl = useHasAction("manager_vehicles_control")
    const queryClient = useQueryClient()
    const { mutate: bulkDecide, isPending: bulkPending } = usePost({})
    const canBulk = useHasAction("manager_flights_control")
    const { openModal: openBulkModal, closeModal: closeBulkModal } = useModal(
        `${MANAGERS_ORDERS}-bulk`,
    )
    const [selectedRows, setSelectedRows] = useState<ManagerOrders[]>([])
    const [clearSelectionTick, setClearSelectionTick] = useState(0)
    const [bulkAction, setBulkAction] = useState<"approve" | "cancel">("approve")
    const draftIds = selectedRows.filter((r) => r.status === -1).map((r) => r.id)
    const unconfirmedIds = selectedRows
        .filter((r) => r.trip_confirmed === false)
        .map((r) => r.id)
    const bulkIds = bulkAction === "approve" ? unconfirmedIds : draftIds

    const startBulk = (action: "approve" | "cancel") => {
        setBulkAction(action)
        openBulkModal()
    }

    const handleBulkConfirm = () => {
        bulkDecide(
            `${MANAGERS_ORDERS}/bulk-decision`,
            { action: bulkAction, decision: bulkAction, ids: bulkIds },
            {
                onSuccess: (res: any) => {
                    const done = res?.done?.length ?? 0
                    const skipped = res?.skipped?.length ?? 0
                    const key =
                        bulkAction === "approve"
                            ? "reys_bulk.approved"
                            : "reys_bulk.canceled"
                    toast.success(
                        t(key, { count: done }) +
                            (skipped > 0
                                ? t("reys_bulk.skipped", { count: skipped })
                                : ""),
                    )
                    queryClient.invalidateQueries({ queryKey: [MANAGERS_ORDERS] })
                    queryClient.invalidateQueries({
                        queryKey: [MANAGERS_ORDERS_INTEGRATION_COUNT],
                    })
                    setClearSelectionTick((v) => v + 1)
                    closeBulkModal()
                },
                onError: () => {
                    toast.error(t("reys_bulk.error"))
                },
            },
        )
    }
    const [approveOrder, setApproveOrder] = useState<ManagerOrders | null>(null)
    const { openModal: openApproveModal } = useModal(APPROVE_TRIP_MODAL_KEY)

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
                manualSorting
                stickyActions
                selecteds_row={canBulk}
                onSelectedRowsChange={setSelectedRows}
                clearSelectionTrigger={clearSelectionTick}
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                onDelete={hasControl ? (row) => handleDelete(row.original) : undefined}
                onEdit={hasControl ? (row) => handleEdit(row.original) : undefined}
                rowAction={
                    hasControl
                        ? (order) =>
                              order.trip_confirmed === false ? (
                                  <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-3 p-0"
                                      title={t("reys_confirm.approve")}
                                      icon={<Check className="text-green-600" size={16} />}
                                      onClick={(e) => {
                                          e.stopPropagation()
                                          setApproveOrder(order)
                                          openApproveModal()
                                      }}
                                  />
                              ) : null
                        : undefined
                }
                head={
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <InlineBreadcrumb
                                    trailing={
                                        <>
                                            <Badge>{formatMoney(data?.count)}</Badge>
                                            <span className="text-muted-foreground">/</span>
                                            <span>{tripLabel}</span>
                                        </>
                                    }
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <ParamDateRange
                                    from="from_date"
                                    to="to_date"
                                    addButtonProps={{
                                        className: "!bg-background dark:!bg-secondary min-w-32 justify-start",
                                    }}
                                />
                                {canBulk && unconfirmedIds.length > 0 && (
                                    <Button
                                        variant="outline"
                                        className="text-green-600"
                                        onClick={() => startBulk("approve")}
                                    >
                                        <Check size={16} />
                                        {t("reys_bulk.approve_btn", { count: unconfirmedIds.length })}
                                    </Button>
                                )}
                                {canBulk && draftIds.length > 0 && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => startBulk("cancel")}
                                    >
                                        <X size={16} />
                                        {t("reys_bulk.cancel_btn", { count: draftIds.length })}
                                    </Button>
                                )}
                                {hasControl && tripId && (
                                    <Button onClick={handleAdd}>
                                        <Plus size={16} />
                                        {t("actions.add")}
                                    </Button>
                                )}
                            </div>
                        </div>
                        {(trip?.pending_advance || trip?.rejected_advance) && (
                            <div className="mt-2">
                                <AdvanceBadge pending={trip?.pending_advance} rejected={trip?.rejected_advance} />
                            </div>
                        )}
                        <ReysFilters />
                    </div>
                }
            />

            <Modal
                modalKey={MANAGERS_ORDERS}
                title={
                    currentSelected?.id ? "Reysni tahrirlash" : "Reys qo'shish"
                }
            >
                <AddTripOrders />
            </Modal>

            <Modal
                size="max-w-md"
                modalKey={`${MANAGERS_ORDERS}-bulk`}
                titleInChildren
            >
                <DialogHeader>
                    <DialogTitle className="font-normal max-w-sm">
                        {t(
                            bulkAction === "approve"
                                ? "reys_bulk.confirm_approve"
                                : "reys_bulk.confirm_cancel",
                            { count: bulkIds.length },
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {t(
                            bulkAction === "approve"
                                ? "reys_bulk.confirm_approve_hint"
                                : "reys_bulk.confirm_cancel_hint",
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={closeBulkModal}
                        disabled={bulkPending}
                    >
                        {t("actions.cancel")}
                    </Button>
                    <Button
                        variant={bulkAction === "cancel" ? "destructive" : "default"}
                        onClick={handleBulkConfirm}
                        loading={bulkPending}
                    >
                        {t("actions.confirm")}
                    </Button>
                </DialogFooter>
            </Modal>

            <ApproveTripModal order={approveOrder} />

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
