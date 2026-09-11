import ParamDateRange from "@/components/as-params/date-picker-range"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import TableActions from "@/components/custom/table-actions"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SETTINGS_PETROL_STATIONS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { cn } from "@/lib/utils"
import { formatMoney } from "@/lib/format-money"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import {
    ArrowDownCircle,
    ArrowLeft,
    ArrowUpCircle,
    Flame,
    Fuel,
    MapPin,
    Plus,
    Truck,
    Wallet,
} from "lucide-react"
import AddExpenseModal from "./add-expense-modal"
import {
    type StationCashFlowRow,
    useStationCashFlowColumns,
} from "./cashflow-cols"
import { type PetrolStationRow } from "./cols"
import EditCashFlowModal, {
    useEditCashFlowStore,
} from "./edit-cashflow-modal"
import TopUpModal from "./top-up-modal"

type StationStats = {
    balance: number
    total_top_ups: number
    total_outcomes: number
    total_liters: number
    total_gas: number
    top_up_count: number
    expense_count: number
}

const CASH_FLOW_DELETE_KEY = "petrol-cash-flow-delete"

const TABS: { key: string; label: string; action: number | null }[] = [
    { key: "all", label: "Hammasi", action: null },
    { key: "topups", label: "Kirim", action: 1 },
    { key: "expenses", label: "Chiqim", action: -1 },
]

const PetrolStationDetail = () => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { id } = useParams({ strict: false }) as { id: string }
    const stationId = Number(id)
    const search = useSearch({ strict: false }) as Record<string, any>
    const activeTab = (search.tab as string) ?? "all"
    const activeAction =
        TABS.find((t) => t.key === activeTab)?.action ?? null

    const hasControl = useHasAction("settings_petrol_stations_control")

    const { data: station } = useGet<PetrolStationRow>(
        `${SETTINGS_PETROL_STATIONS}/${stationId}`,
        { enabled: !!stationId },
    )

    const { data: stats } = useGet<StationStats>(
        `${SETTINGS_PETROL_STATIONS}/${stationId}/stats`,
        {
            params: {
                from_date: search.from_date,
                to_date: search.to_date,
            },
            enabled: !!stationId,
        },
    )

    const { data: cashflows, isLoading } = useGet<
        ListResponse<StationCashFlowRow>
    >(`${SETTINGS_PETROL_STATIONS}/${stationId}/cash-flows`, {
        params: {
            search: search.cashflow_search,
            page: search.page,
            page_size: search.page_size,
            action: activeAction,
            from_date: search.from_date,
            to_date: search.to_date,
        },
        enabled: !!stationId,
    })

    const { openModal: openTopUp } = useModal("petrol-top-up")
    const { openModal: openExpense } = useModal("petrol-expense")
    const editCashFlow = useEditCashFlowStore()
    const { openModal: openDeleteCashFlow } = useModal(CASH_FLOW_DELETE_KEY)
    const [deletingCashFlow, setDeletingCashFlow] =
        useState<StationCashFlowRow | null>(null)

    const refetchAll = () => {
        queryClient.refetchQueries({
            predicate: (q) => String(q.queryKey[0]).includes("petrol-stations"),
        })
    }

    const columns = useStationCashFlowColumns()

    // Kelgan natijalarni mashina raqami (vehicle_plate) bo'yicha guruhlash
    const groupedVehicles = useMemo(() => {
        const results = cashflows?.results ?? []
        const groups: Record<
            string,
            {
                vehicle_plate: string
                is_income: boolean
                driver_name: string
                total_liters: number
                total_gas: number
                total_amount: number
                items: StationCashFlowRow[]
            }
        > = {}

        results.forEach((row) => {
            const plate =
                row.vehicle_plate ||
                (row.action === 1 ? "Kirim operatsiyalari" : "Boshqa operatsiyalar")

            if (!groups[plate]) {
                groups[plate] = {
                    vehicle_plate: plate,
                    is_income: row.action === 1,
                    driver_name: row.driver_name || "-",
                    total_liters: 0,
                    total_gas: 0,
                    total_amount: 0,
                    items: [],
                }
            }

            groups[plate].items.push(row)
            groups[plate].total_amount += Number(row.amount || 0)

            if (row.unit === "m3") {
                groups[plate].total_gas += Number(row.liters || 0)
            } else {
                groups[plate].total_liters += Number(row.liters || 0)
            }
        })

        // Sintetik (mashinasiz) guruhlar oxirida, haydovchi mashinalari
        // esa raqami bo'yicha tartiblanadi
        const SYNTHETIC = ["Kirim operatsiyalari", "Boshqa operatsiyalar"]
        return Object.values(groups).sort((a, b) => {
            const aSyn = SYNTHETIC.indexOf(a.vehicle_plate)
            const bSyn = SYNTHETIC.indexOf(b.vehicle_plate)
            if (aSyn !== -1 || bSyn !== -1) {
                if (aSyn === -1) return -1
                if (bSyn === -1) return 1
                return aSyn - bSyn
            }
            return a.vehicle_plate.localeCompare(b.vehicle_plate, "uz", {
                numeric: true,
            })
        })
    }, [cashflows?.results])

    const handleEditCashFlow = (row: StationCashFlowRow) => {
        if (row.action !== 1) return
        editCashFlow.open(row)
    }

    const handleDeleteCashFlow = (row: StationCashFlowRow) => {
        if (row.action !== 1) return
        setDeletingCashFlow(row)
        openDeleteCashFlow()
    }

    const setTab = (key: string) => {
        navigate({
            search: (prev: any) => ({ ...prev, tab: key, page: 1 }),
        } as any)
    }

    return (
        <div className="space-y-4 pb-6">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                            navigate({ to: "/petrol-stations" })
                        }
                        className="shrink-0"
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold leading-tight">
                            {station?.name ?? "Zapravka"}
                        </h1>
                        {station?.address && (
                            <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5 mt-0.5">
                                <MapPin size={12} />
                                {station.address}
                            </span>
                        )}
                    </div>
                </div>
                <div className="w-64 shrink-0 ml-auto">
                    <ParamDateRange from="from_date" to="to_date" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Wallet size={20} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                Hozirgi balans
                            </div>
                            <div className="text-xl font-semibold tabular-nums truncate">
                                {formatMoney(Number(stats?.balance ?? 0))} so'm
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                            <ArrowUpCircle size={20} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                Kirim
                            </div>
                            <div className="text-xl font-semibold tabular-nums truncate text-emerald-600">
                                +
                                {formatMoney(Number(stats?.total_top_ups ?? 0))}{" "}
                                so'm
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                                {stats?.top_up_count ?? 0} ta operatsiya
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                            <ArrowDownCircle size={20} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                Chiqim
                            </div>
                            <div className="text-xl font-semibold tabular-nums truncate text-rose-600">
                                −
                                {formatMoney(
                                    Number(stats?.total_outcomes ?? 0),
                                )}{" "}
                                so'm
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                                {stats?.expense_count ?? 0} ta operatsiya
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                            <Fuel size={20} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                Sarflangan litr
                            </div>
                            <div className="text-xl font-semibold tabular-nums truncate text-amber-600">
                                {formatMoney(Number(stats?.total_liters ?? 0))}{" "}
                                litr
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                                Dizel mashinalar
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                            <Flame size={20} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                Sarflangan gaz
                            </div>
                            <div className="text-xl font-semibold tabular-nums truncate text-sky-600">
                                {formatMoney(Number(stats?.total_gas ?? 0))} m³
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                                Gaz (metan) mashinalar
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-between gap-3">
                <Tabs value={activeTab} onValueChange={setTab}>
                    <TabsList>
                        {TABS.map((t) => (
                            <TabsTrigger key={t.key} value={t.key}>
                                {t.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
                {hasControl && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={openExpense}>
                            <Plus size={16} className="mr-1" />
                            Chiqim qo'shish
                        </Button>
                        <Button onClick={openTopUp}>
                            <Plus size={16} className="mr-1" />
                            Kirim qo'shish
                        </Button>
                    </div>
                )}
            </div>

            {/* Guruh: mashina raqami bo`yicha */}
            {groupedVehicles.length > 0 ?
                <Card className="overflow-hidden">
                    <Accordion type="multiple">
                        {groupedVehicles.map((group) => (
                            <AccordionItem
                                key={group.vehicle_plate}
                                value={group.vehicle_plate}
                                className="px-4 last:border-b-0"
                            >
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex flex-1 items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                <Truck size={18} />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-semibold text-sm flex items-center gap-2">
                                                    {group.vehicle_plate}
                                                    {group.driver_name &&
                                                        group.driver_name !== "-" && (
                                                            <span className="text-xs font-normal text-muted-foreground">
                                                                ({group.driver_name})
                                                            </span>
                                                        )}
                                                </div>
                                                <div className="text-xs font-normal text-muted-foreground">
                                                    {group.items.length} ta operatsiya
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {group.total_gas > 0 && (
                                                <Badge className="hidden border-transparent bg-sky-500/10 text-sky-600 hover:bg-sky-500/10 sm:inline-flex">
                                                    {group.total_gas} m³
                                                </Badge>
                                            )}
                                            {group.total_liters > 0 && (
                                                <Badge className="hidden border-transparent bg-amber-500/10 text-amber-600 hover:bg-amber-500/10 sm:inline-flex">
                                                    {group.total_liters} litr
                                                </Badge>
                                            )}
                                            <Badge
                                                className={cn(
                                                    "border-transparent tabular-nums",
                                                    group.is_income ?
                                                        "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10"
                                                    :   "bg-rose-500/10 text-rose-600 hover:bg-rose-500/10",
                                                )}
                                            >
                                                {group.is_income ? "+" : "-"}
                                                {formatMoney(group.total_amount)} so'm
                                            </Badge>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-0 pb-2">
                                    <DataTable
                                        columns={columns}
                                        data={group.items}
                                        numeration
                                        rowAction={
                                            hasControl ?
                                                (row: StationCashFlowRow) =>
                                                    row.action === 1 ?
                                                        <TableActions
                                                            onEdit={() =>
                                                                handleEditCashFlow(row)
                                                            }
                                                            onDelete={() =>
                                                                handleDeleteCashFlow(row)
                                                            }
                                                        />
                                                    :   null
                                            :   undefined
                                        }
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </Card>
            :   !isLoading && (
                    <div className="text-center py-10 text-muted-foreground border rounded-lg">
                        Ma'lumotlar topilmadi
                    </div>
                )
            }

            <Modal
                title="Kirim qo'shish"
                modalKey="petrol-top-up"
                size="max-w-md"
            >
                <TopUpModal stationId={stationId} />
            </Modal>
            <Modal
                title="Chiqim qo'shish"
                modalKey="petrol-expense"
                size="max-w-md"
            >
                <AddExpenseModal stationId={stationId} />
            </Modal>
            <Modal
                title="Kirimni tahrirlash"
                modalKey="petrol-cash-flow-edit"
                size="max-w-md"
            >
                <EditCashFlowModal />
            </Modal>
            <DeleteModal
                path={`${SETTINGS_PETROL_STATIONS}/cash-flows`}
                id={
                    deletingCashFlow ? `${deletingCashFlow.id}/delete` : undefined
                }
                modalKey={CASH_FLOW_DELETE_KEY}
                onSuccessAction={refetchAll}
                disableRefetch
            />
        </div>
    )
}

export default PetrolStationDetail