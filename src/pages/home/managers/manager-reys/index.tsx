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
import ReysFilters, { REYS_FILTER_KEYS, REYS_KIND_PARAMS } from "./reys-filters"
import AdvanceBadge from "../managers-trips/advance-badge"
import TripFuelSummary, { type TripFuel } from "./trip-fuel-summary"
import EmptyLegPayModal, { EMPTY_LEG_PAY_MODAL_KEY, type EmptyLeg } from "./empty-leg-pay-modal"
import ExtraPayModal, { EXTRA_PAY_MODAL_KEY, type ExtraPayTarget } from "./extra-pay-modal"

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
        cash_closed?: boolean
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
        (tripError?.response?.status === 404 ? t("trips.reys_page.not_found") : "—")
    const crumbVehicle = trip?.vehicle ?? getData("manager-trips-vehicle-id")
    const { data: vehiclesCount } = useGet<ListResponse<ManagerVehicles>>(MANAGERS_VEHICLES, { params: { page_size: 1 } })
    const { data: tripsCount } = useGet<ListResponse<ManagerTrips>>(MANAGERS_TRIPS, {
        params: { vehicle: crumbVehicle, page_size: 1 },
        enabled: !!crumbVehicle,
    })
    const currentSelected = getData(MANAGERS_ORDERS)
    const kind = (search as any).kind as string | undefined
    const { data } = useGet<ListResponse<ManagerOrders>>(`${MANAGERS_ORDERS}`, {
        params: {
            trip: tripId,
            page_size: search.page_size,
            page: search.page,
            ordering: (search as any).ordering,
            ...Object.fromEntries(
                REYS_FILTER_KEYS.filter((key) => key !== "kind").map((key) => [key, (search as any)[key]]),
            ),
            ...(kind ? REYS_KIND_PARAMS[kind] : {}),
        },
    })
    const canEditOrder = useHasAction("manager_flights_edit_control")
    const canDeleteOrder = useHasAction("manager_flights_delete_control")
    const hasControl = useHasAction("manager_vehicles_control")
    const locked = !!trip?.cash_closed
    const lockedTitle = locked ? t("trips.reys_cols.trip_locked") : undefined
    const [approveOrder, setApproveOrder] = useState<ManagerOrders | null>(null)
    const { openModal: openApproveModal } = useModal(APPROVE_TRIP_MODAL_KEY)

    const [previewImages, setPreviewImages] = useState<{ id: number; image: string }[]>([])
    const [previewIndex, setPreviewIndex] = useState<number | null>(null)

    const [payLeg, setPayLeg] = useState<EmptyLeg | null>(null)
    const { openModal: openPayModal } = useModal(EMPTY_LEG_PAY_MODAL_KEY)
    const [extraPay, setExtraPay] = useState<ExtraPayTarget | null>(null)
    const { openModal: openExtraPayModal } = useModal(EXTRA_PAY_MODAL_KEY)

    const cols = useColumnsManagersOrders({
        onLegPay: hasControl
            ? (leg) => {
                  setPayLeg(leg)
                  openPayModal()
              }
            : undefined,
        onExtraPay: hasControl
            ? (target) => {
                  setExtraPay(target)
                  openExtraPayModal()
              }
            : undefined,
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

    const { data: allLegs } = useGet<EmptyLeg[]>(`${MANAGERS_TRIPS}/${tripId}/empty-legs`, { enabled: !!tripId })
    const legs = useMemo(() => allLegs?.filter((l) => l.kind !== "to_garage"), [allLegs])
    const backLegs = useMemo(() => allLegs?.filter((l) => l.kind === "to_garage") ?? [], [allLegs])
    const { data: fuel } = useGet<TripFuel>(`${MANAGERS_TRIPS}/${tripId}/fuel`, { enabled: !!tripId })
    const { data: garageVisits } = useGet<GarageVisit[]>(`${MANAGERS_TRIPS}/${tripId}/garage-visits`, { enabled: !!tripId })
    const rows = useMemo(() => {
        const list = data?.results ?? []
        if ((search as any).cargo_type || (search as any).client) return list
        const desc0 = !String((search as any).ordering ?? "") || String((search as any).ordering).startsWith("-")
        const garage = (rows: ManagerOrders[], desc: boolean) =>
            withGarageRows(rows, garageVisits, backLegs, desc, {
                inGarage: t("trips.managers.in_garage"),
                waiting: t("trips.managers.in_garage_waiting"),
                noCargo: t("trips.managers.no_cargo"),
                emptyRun: t("trips.managers.empty_run"),
            })
        if (!legs?.length) {
            if (!kind) return garage(list, desc0)
            return kind === "empty" ? withGarageRows(list, [], backLegs, desc0, { inGarage: "", waiting: "", noCargo: t("trips.managers.no_cargo"), emptyRun: t("trips.managers.empty_run") }) : list
        }
        const legKey = (leg: EmptyLeg) => leg.before_order ?? 500_000_000 + (leg.id ?? 0)
        const legRowOf = (leg: EmptyLeg) => ({
            id: -legKey(leg),
            __leg: leg,
            date: leg.start,
            activity: 0,
            activity_display: leg.before_order == null ? t("trips.empty_leg.before_trip") : t("trips.managers.empty_run"),
            loading_name: leg.from_place || t("trips.empty_leg.turnover_start"),
            unloading_name: leg.to_place,
            cargo_type_name: t("trips.managers.no_cargo"),
            loading_time: leg.start,
            completed_time: leg.end,
            incomes: [],
            images: [],
        } as unknown as ManagerOrders)
        const idleRowOf = (leg: EmptyLeg) => ({
            id: -legKey(leg) - 1_000_000_000,
            __idle: true,
            __idleLeg: leg,
            date: leg.idle_start,
            activity: 4,
            activity_display: t("status.idle_stop"),
            loading_name: leg.from_place,
            unloading_name: leg.from_place,
            loading_time: leg.idle_start,
            completed_time: leg.start,
            incomes: [],
            images: [],
        } as unknown as ManagerOrders)
        const byOrder = new Map(legs.filter((l) => l.before_order != null).map((l) => [l.before_order, l]))
        const beforeTripLegs = legs.filter((l) => l.before_order == null)
        const isEmptyRun = (r: ManagerOrders) => r.activity === 1 && r.type === 2
        const emptyRunIds = new Set(list.filter(isEmptyRun).map((r) => r.id))
        const byAfter = new Map(
            legs
                .filter((l) => l.after_order != null && !l.idle_start && emptyRunIds.has(l.after_order))
                .map((l) => [l.after_order, l]),
        )
        const ordering = String((search as any).ordering ?? "")
        const desc = !ordering || ordering.startsWith("-")
        const merge = (r: ManagerOrders) => {
            if (!isEmptyRun(r)) return r
            const before = byOrder.get(r.id)
            const after = byAfter.get(r.id)
            if (!before && !after) return r
            return {
                ...r,
                __legs: [before, after].filter(Boolean),
                __merged: true,
                __start: before?.start,
                loading_name: before?.from_place || r.loading_name,
                unloading_name: after?.to_place || r.unloading_name,
                completed_time: after?.end ?? r.completed_time,
            } as unknown as ManagerOrders
        }
        if (kind) {
            const extra =
                kind === "empty"
                    ? legs
                          .filter((l) => l.minutes > 0 && (l.before_order == null || !emptyRunIds.has(l.before_order)) && !(l.after_order != null && emptyRunIds.has(l.after_order)))
                          .map(legRowOf)
                    : kind === "idle"
                      ? legs.filter((l) => l.idle_start).map(idleRowOf)
                      : []
            if (kind !== "empty" && kind !== "idle") return list
            const startAt = (r: ManagerOrders) => {
                const row = r as any
                return new Date(row.__start ?? r.loading_time ?? r.pending_time ?? r.date ?? 0).getTime()
            }
            const sorted = [...list.map(merge), ...extra].sort((a, b) => (desc ? startAt(b) - startAt(a) : startAt(a) - startAt(b)))
            return kind === "empty"
                ? withGarageRows(sorted, [], backLegs, desc, { inGarage: "", waiting: "", noCargo: t("trips.managers.no_cargo"), emptyRun: t("trips.managers.empty_run") })
                : sorted
        }
        const out: ManagerOrders[] = []
        if (!desc) out.push(...beforeTripLegs.map(legRowOf))
        for (const r of list) {
            const leg = byOrder.get(r.id)
            const emptyRun = isEmptyRun(r)
            const mergedIntoPrev = !!leg && leg.after_order != null && byAfter.get(leg.after_order) === leg
            const legRow = leg && leg.minutes > 0 && !emptyRun && !mergedIntoPrev && legRowOf(leg)
            const idleRow = leg?.idle_start && idleRowOf(leg)
            const row = merge(r)
            if (!desc) {
                if (idleRow) out.push(idleRow)
                if (legRow) out.push(legRow)
            }
            out.push(row)
            if (desc) {
                if (legRow) out.push(legRow)
                if (idleRow) out.push(idleRow)
            }
        }
        if (desc) out.push(...beforeTripLegs.map(legRowOf))
        return garage(out, desc)
    }, [data, legs, backLegs, garageVisits, search, kind, t])
    const handleAdd = () => {
        clearKey(MANAGERS_ORDERS)
        openTripModal()
    }
    return (
        <>
            <DataTable
                columns={cols}
                data={rows}
                isRowLocked={(r: ManagerOrders) => isVirtualRow(r)}
                rowColor={(r: ManagerOrders) => (isVirtualRow(r) ? "text-muted-foreground italic" : "")}
                manualSorting
                stickyActions
                numeration
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                actionsDisabled={locked}
                actionsDisabledTitle={lockedTitle}
                onDelete={canDeleteOrder ? (row) => handleDelete(row.original) : undefined}
                onEdit={canEditOrder ? (row) => handleEdit(row.original) : undefined}
                rowEditDisabledTitle={(row) => (row.is_integration ? t("trips.reys_cols.logistics_locked") : undefined)}
                rowAction={
                    hasControl
                        ? (order) =>
                              order.trip_confirmed === false ? (
                                  <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-3 p-0"
                                      title={lockedTitle ?? t("reys_confirm.approve")}
                                      disabled={locked}
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
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <InlineBreadcrumb
                                counts={[vehiclesCount?.count, tripsCount?.count, data?.count]}
                                trailing={<span>{tripLabel}</span>}
                            />
                            <ReysFilters
                                trailing={
                                    hasControl && tripId ? (
                                        <Button disabled={locked} title={lockedTitle} onClick={handleAdd}>
                                            <Plus size={16} />
                                            {t("actions.add")}
                                        </Button>
                                    ) : null
                                }
                            />
                        </div>
                        {fuel && <TripFuelSummary fuel={fuel} />}
                        {(trip?.pending_advance || trip?.rejected_advance) && (
                            <div className="mt-2">
                                <AdvanceBadge pending={trip?.pending_advance} rejected={trip?.rejected_advance} />
                            </div>
                        )}
                    </div>
                }
            />

            <Modal
                modalKey={MANAGERS_ORDERS}
                title={
                    currentSelected?.id ? t("trips.reys_page.edit_trip") : t("trips.reys_page.add_trip")
                }
            >
                <AddTripOrders />
            </Modal>

            <ApproveTripModal order={approveOrder} />

            <EmptyLegPayModal leg={payLeg} />
            <ExtraPayModal target={extraPay} />

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
                                    aria-label={t("trips.common.previous")}
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
                                alt={t("trips.common.preview")}
                                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                            />
                            {previewImages.length > 1 && (
                                <button
                                    type="button"
                                    aria-label={t("trips.common.next")}
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

const isVirtualRow = (r: ManagerOrders) => {
    const row = r as any
    return !!row.__idle || !!row.__garage || (!!row.__leg && !row.__merged)
}

type GarageVisit = { id: string; area_name: string | null; entered_at: string; left_at: string | null; minutes: number; waiting: boolean }

type GarageLabels = { inGarage: string; waiting: string; noCargo: string; emptyRun: string }

const rowStart = (r: ManagerOrders) => {
    const row = r as any
    return new Date(row.__start ?? r.loading_time ?? r.pending_time ?? r.date ?? 0).getTime()
}

const withGarageRows = (
    rows: ManagerOrders[],
    visits: GarageVisit[] | undefined,
    backLegs: EmptyLeg[],
    desc: boolean,
    labels: GarageLabels,
) => {
    const extra = [
        ...backLegs.map(
            (leg) =>
                ({
                    id: -(600_000_000 + (leg.id ?? 0)),
                    __leg: leg,
                    date: leg.start,
                    activity: 0,
                    activity_display: labels.emptyRun,
                    loading_name: leg.from_place,
                    unloading_name: leg.to_place,
                    cargo_type_name: labels.noCargo,
                    loading_time: leg.start,
                    completed_time: leg.end,
                    incomes: [],
                    images: [],
                }) as unknown as ManagerOrders,
        ),
        ...(visits ?? []).map(
            (visit, i) =>
                ({
                    id: -2_000_000_000 - i,
                    __garage: true,
                    date: visit.entered_at,
                    activity: 2,
                    activity_display: visit.waiting ? labels.waiting : labels.inGarage,
                    loading_name: visit.area_name,
                    loading_time: visit.entered_at,
                    completed_time: visit.left_at ?? undefined,
                    incomes: [],
                    images: [],
                }) as unknown as ManagerOrders,
        ),
    ]
    if (!extra.length) return rows
    const out = [...rows]
    for (const row of extra) {
        const at = rowStart(row)
        const index = out.findIndex((r) => (desc ? rowStart(r) < at : rowStart(r) > at))
        out.splice(index === -1 ? out.length : index, 0, row)
    }
    return out
}
