import ParamDateRange from "@/components/as-params/date-picker-range"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SETTINGS_PETROL_STATIONS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import {
    ArrowDownCircle,
    ArrowLeft,
    ArrowUpCircle,
    Droplet,
    MapPin,
    Plus,
    Wallet,
} from "lucide-react"
import {
    type StationCashFlowRow,
    useStationCashFlowColumns,
} from "./cashflow-cols"
import { type PetrolStationRow } from "./cols"
import TopUpModal from "./top-up-modal"

type StationStats = {
    balance: number
    total_top_ups: number
    total_outcomes: number
    total_liters: number
    avg_price_per_liter: number
    top_up_count: number
    expense_count: number
}

const TABS: { key: string; label: string; action: number | null }[] = [
    { key: "all", label: "Hammasi", action: null },
    { key: "topups", label: "Kirim", action: 1 },
    { key: "expenses", label: "Chiqim", action: -1 },
]

const PetrolStationDetail = () => {
    const navigate = useNavigate()
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

    const columns = useStationCashFlowColumns()

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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                            <Droplet size={20} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                Sarflangan litr
                            </div>
                            <div className="text-xl font-semibold tabular-nums truncate text-amber-600">
                                {formatMoney(Number(stats?.total_liters ?? 0))}{" "}
                                L
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                                ~
                                {formatMoney(
                                    Number(stats?.avg_price_per_liter ?? 0),
                                )}{" "}
                                so'm/L
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
                    <Button onClick={openTopUp}>
                        <Plus size={16} className="mr-1" />
                        Kirim qo'shish
                    </Button>
                )}
            </div>

            <DataTable
                loading={isLoading}
                columns={columns}
                data={cashflows?.results}
                numeration
                paginationProps={{
                    totalPages: cashflows?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
            />

            <Modal
                title="Kirim qo'shish"
                modalKey="petrol-top-up"
                size="max-w-md"
            >
                <TopUpModal stationId={stationId} />
            </Modal>
        </div>
    )
}

export default PetrolStationDetail
