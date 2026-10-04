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
import {
    MANAGERS_ORDERS,
    MANAGERS_TRIPS,
    MANAGERS_VEHICLES,
} from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { useGlobalStore } from "@/store/global-store"
import { useParams, useSearch } from "@tanstack/react-router"
import { Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useColumnsManagersOrders } from "./cols"
import ApproveTripModal, { APPROVE_TRIP_MODAL_KEY } from "./approve-trip-modal"
import AddTripOrders from "./create-reys"
import ReysFilters, { REYS_FILTER_KEYS } from "./reys-filters"
import AdvanceBadge from "../managers-trips/advance-badge"
import ParamDateRange from "@/components/as-params/date-picker-range"

type EmptyLeg = {
    before_order: number
    first: boolean
    from_place: string | null
    to_place: string | null
    start: string
    end: string
    minutes: number
    distance_km: number | null
}

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
    const crumbVehicle = trip?.vehicle ?? getData("manager-trips-vehicle-id")
    const { data: vehiclesCount } = useGet<ListResponse<ManagerVehicles>>(MANAGERS_VEHICLES, { params: { page_size: 1 } })
    const { data: tripsCount } = useGet<ListResponse<ManagerTrips>>(MANAGERS_TRIPS, {
        params: { vehicle: crumbVehicle, page_size: 1 },
        enabled: !!crumbVehicle,
    })
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

    const { data: legs } = useGet<EmptyLeg[]>(`${MANAGERS_TRIPS}/${tripId}/empty-legs`, { enabled: !!tripId })
    const rows = useMemo(() => {
        const list = data?.results ?? []
        if (!legs?.length) return list
        const byOrder = new Map(legs.map((l) => [l.before_order, l]))
        const ordering = String((search as any).ordering ?? "")
        const desc = !ordering || ordering.startsWith("-")
        const out: ManagerOrders[] = []
        for (const r of list) {
            const leg = byOrder.get(r.id)
            const legRow = leg && ({
                id: -leg.before_order,
                __leg: leg,
                date: leg.start,
                activity: 0,
                activity_display: "Bo'sh yurish",
                loading_name: leg.from_place || "Aylanma boshi",
                unloading_name: leg.to_place,
                loading_time: leg.start,
                completed_time: leg.end,
                incomes: [],
                images: [],
            } as unknown as ManagerOrders)
            if (legRow && !desc) out.push(legRow)
            out.push(r)
            if (legRow && desc) out.push(legRow)
        }
        return out
    }, [data, legs, search])
    const handleAdd = () => {
        clearKey(MANAGERS_ORDERS)
        openTripModal()
    }
    return (
        <>
            <DataTable
                columns={cols}
                data={rows}
                isRowLocked={(r: ManagerOrders) => !!(r as any).__leg}
                rowColor={(r: ManagerOrders) => ((r as any).__leg ? "text-muted-foreground italic" : "")}
                manualSorting
                stickyActions
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
                                    counts={[vehiclesCount?.count, tripsCount?.count, data?.count]}
                                    trailing={<span>{tripLabel}</span>}
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
