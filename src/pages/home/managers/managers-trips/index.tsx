import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { InlineBreadcrumb } from "@/components/header/breadcrumbs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { MANAGERS_CASHFLOW, MANAGERS_EXPENSES, MANAGERS_TRIPS } from "@/constants/api-endpoints"
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
    const [moliyaOpen, setMoliyaOpen] = useState(false)
    const navigate = useNavigate()
    const { id } = useParams({ strict: false })
    const { name } = useSearch({ strict: false }) as any
    const { driver_id } = useSearch({ strict: false }) as any
    const { data, isLoading } = useGet<ListResponse<ManagerTrips>>(
        MANAGERS_TRIPS,
        {
            params: {
                ...(driver_id ? { driver_id } : { vehicle: id }),
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
        setMoliyaOpen(true)
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
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
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
                            <Button onClick={handleAdd} disabled={hasOngoingTrip}>
                                <Plus size={16} />
                                Boshlash
                            </Button>
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

            <Sheet open={moliyaOpen} onOpenChange={setMoliyaOpen}>
                <SheetContent side="bottom" className="h-[95vh] rounded-t-2xl overflow-hidden">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Kirim va Xarajatlar</SheetTitle>
                    </SheetHeader>
                    <div className="h-[calc(95vh-60px)] flex flex-col overflow-hidden">
                        <KirimXarajatContent />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}
