import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { InlineBreadcrumb } from "@/components/header/breadcrumbs"
import ParamDateRange from "@/components/as-params/date-picker-range"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { MANAGERS_CASHFLOW, MANAGERS_EXPENSES, MANAGERS_TRIPS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { useColumnsManagersTrips } from "./cols"
import CreateManagerTrips from "./create"
import ExpensesModal from "./create-expenses"
import FinishedManagerTrips from "./finished"
import KirimXarajatContent from "./kirim-xarajat-modal"

export default function ManagersTrips() {
    const search = useSearch({ strict: false })
    const { setData, getData, clearKey } = useGlobalStore()
    const { openModal: createTripModal } = useModal(MANAGERS_TRIPS)
    const { openModal: editTripModal } = useModal(`${MANAGERS_TRIPS}-finished`)
    const { openModal: createExpenses } = useModal(MANAGERS_EXPENSES)
    const { openModal: deleteTrip } = useModal(`${MANAGERS_TRIPS}-delete`)
    const hasControl = useHasAction("manager_vehicles_control")
    const [isArchive, setIsArchive] = useState(false)
    const navigate = useNavigate()
    const { id } = useParams({ strict: false })
    const { name } = useSearch({ strict: false }) as any
    const { driver_id } = useSearch({ strict: false }) as any
    const { from_date, to_date, moliya_trip_id } = search as any
    const moliyaOpen = !!moliya_trip_id
    const setMoliyaOpen = (open: boolean) => {
        if (!open) {
            navigate({ search: (prev: any) => { const { moliya_trip_id, ...rest } = prev; return rest } } as any)
        }
    }
    const { data, isLoading } = useGet<ListResponse<ManagerTrips>>(
        MANAGERS_TRIPS,
        {
            params: {
                ...(driver_id ? { driver_id } : { vehicle: id }),
                ...(!isArchive ? { page_size: 2 } : {}),
                ...(isArchive && from_date ? { from_date } : {}),
                ...(isArchive && to_date ? { to_date } : {}),
                ...(isArchive ? { page_size: search.page_size, page: search.page } : {}),
            },
        },
    )
    const currentItem = getData("expense-id")
    const { data: expenses } = useGet(MANAGERS_CASHFLOW, {
        params: {
            trip: currentItem?.id,
            page_size: search.page_size,
            page: search.page,
        },
        enabled: !!currentItem?.id,
    })

    const item = getData(MANAGERS_TRIPS)
    const handleRowClick = (item: ManagerTrips) => {
        setData("manager-trips", item)
        setData("manager-trips-vehicle-id", id)
        const tripId = item?.id
        if (!tripId) return
        navigate({
            to: "/manager-trips/manager-reys/$id",
            params: { id: tripId.toString() },
            search: {
                name: item?.driver_name,
            } as any,
        })
    }
    const handleEdit = (item: ManagerTrips) => {
        setData(MANAGERS_TRIPS, item)
        createTripModal()
    }
    const handleDelete = (item: ManagerTrips) => {
        setData(MANAGERS_TRIPS, item)
        deleteTrip()
    }

    const hasOngoingTrip = useMemo(
        () => data?.results?.some((t: ManagerTrips) => !t.end),
        [data?.results],
    )

    const handleAdd = () => {
        clearKey(MANAGERS_TRIPS)
        createTripModal()
    }
    const handleUndo = (item: ManagerTrips) => {
        setData("expense-id", item)
        createExpenses()
    }
    const handleFinished = (item: ManagerTrips) => {
        setData("finished", item)
        editTripModal()
    }
    const handleMoliya = (item: ManagerTrips) => {
        setData(`${MANAGERS_TRIPS}-moliya`, item)
        navigate({ search: (prev: any) => ({ ...prev, moliya_trip_id: item.id }) } as any)
    }
    const cols = useColumnsManagersTrips({
        onMoliya: handleMoliya,
        onEdit: handleEdit,
        onDelete: handleDelete,
    })
    return (
        <>
            <DataTable
                loading={isLoading}
                numeration
                data={data?.results}
                columns={cols}
                viewAll={!isArchive}
                {...(isArchive ? {
                    paginationProps: {
                        totalPages: data?.total_pages,
                        paramName: "page",
                        pageSizeParamName: "page_size",
                    },
                } : {})}
                onRowClick={handleRowClick}
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
                            <div className="flex items-center gap-3">
                                {isArchive && (
                                    <ParamDateRange
                                        from="from_date"
                                        to="to_date"
                                    />
                                )}
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="archive-switch" className="text-sm cursor-pointer">Arxiv</Label>
                                    <Switch
                                        id="archive-switch"
                                        checked={isArchive}
                                        onCheckedChange={setIsArchive}
                                    />
                                </div>
                                {hasControl && (
                                    <Button onClick={handleAdd} disabled={hasOngoingTrip}>
                                        <Plus size={16} />
                                        Boshlash
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                }
            />

            <Modal
                modalKey={MANAGERS_TRIPS}
                title={item?.id ? "Aylanmani tahrirlash" : "Aylanma boshlash"}
            >
                <CreateManagerTrips />
            </Modal>

            <Modal modalKey={MANAGERS_EXPENSES} title="Xarajat qo'shish">
                <ExpensesModal expenses={expenses?.results} />
            </Modal>
            <Modal modalKey={`${MANAGERS_TRIPS}-finished`} title="Tugatish">
                <FinishedManagerTrips />
            </Modal>
            <DeleteModal
                path={MANAGERS_TRIPS}
                id={item?.id}
                modalKey={`${MANAGERS_TRIPS}-delete`}
            ></DeleteModal>

            {moliyaOpen && (
                <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setMoliyaOpen(false)} />
            )}
            <div
                className={cn(
                    "fixed bottom-0 right-0 z-50 transition-transform duration-300 ease-in-out",
                    moliyaOpen ? "translate-y-0" : "translate-y-full",
                )}
                style={{ height: "100vh", left: "var(--sidebar-width, 14rem)" }}
            >
                <button
                    onClick={() => setMoliyaOpen(false)}
                    className="absolute -left-10 top-2 z-50 bg-gray-500/70 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm hover:bg-gray-500/90"
                >
                    <X size={16} />
                </button>
                <div className="bg-background shadow-2xl h-full flex flex-col overflow-hidden">
                    <div className="h-full flex flex-col overflow-hidden p-4">
                        {moliyaOpen && <KirimXarajatContent />}
                    </div>
                </div>
            </div>
        </>
    )
}
