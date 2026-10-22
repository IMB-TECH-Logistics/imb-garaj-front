import { DataTable } from "@/components/ui/datatable"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    MONITORING_ROUTE_NORMS,
    MONITORING_ROUTE_NORMS_ORDERS,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import { DeviationLegend } from "./deviation"
import { useRouteNormFilters } from "./filters"
import {
    formatDuration,
    formatFuel,
    formatKm,
    fuelLabel,
} from "./format"
import { useOrderColumns } from "./order-cols"
import { RouteNormListResponse, RouteNormOrder, RouteNormOrdersResponse } from "./types"

type OrdersTab = "in" | "out" | "all" | "flagged"

const STALE_TIME = 60 * 1000

const TAB_KEY = "o_tab"
const PAGE_KEY = "o_page"
const PAGE_SIZE_KEY = "o_page_size"
const LIST_KEYS = ["from_date", "to_date", "fuel_type", "vehicle", "driver", "search", "ordering", "page", "page_size"]

const TAB_PARAMS: Record<OrdersTab, { in_norm?: string; flagged?: string }> = {
    in: { in_norm: "true" },
    out: { in_norm: "false" },
    all: {},
    flagged: { flagged: "true" },
}

const ROW_COLORS: Record<string, string> = {
    red: "!bg-red-500/10 hover:!bg-red-500/15",
    yellow: "!bg-amber-500/10 hover:!bg-amber-500/15",
}

const isTab = (value: unknown): value is OrdersTab =>
    value === "in" || value === "out" || value === "all" || value === "flagged"

const parseRoute = (value: unknown) => {
    const [load, unload] = String(value ?? "").split("-")
    if (!/^\d+$/.test(load ?? "") || !/^\d+$/.test(unload ?? "")) return null
    return { load_point: load, unload_point: unload }
}

export default function RouteNormOrdersPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const search: any = useSearch({ strict: false })
    const { route: routeId } = useParams({ strict: false }) as { route?: string }
    const columns = useOrderColumns()
    const { params, ready } = useRouteNormFilters()
    const route = parseRoute(routeId)

    const normParams = { ...params, ...route }
    const { data: normData } = useGet<RouteNormListResponse>(MONITORING_ROUTE_NORMS, {
        params: normParams,
        enabled: ready && !!route,
        options: {
            queryKey: [MONITORING_ROUTE_NORMS, normParams],
            staleTime: STALE_TIME,
        },
    })
    const norm = normData?.results.find((item) => item.id === routeId)
    const flagged = norm ? norm.flags.yellow + norm.flags.red : undefined

    const defaultTab: OrdersTab = !norm || norm.trips_count > 0 ? "in" : "all"
    const tab: OrdersTab = isTab(search?.[TAB_KEY]) ? search[TAB_KEY] : defaultTab

    const requestParams = {
        ...params,
        ...route,
        ...TAB_PARAMS[tab],
        page: search?.[PAGE_KEY] || undefined,
        page_size: search?.[PAGE_SIZE_KEY] || undefined,
    }

    const { data, isLoading, isError } = useGet<RouteNormOrdersResponse>(
        MONITORING_ROUTE_NORMS_ORDERS,
        {
            params: requestParams,
            enabled: ready && !!route,
            options: {
                queryKey: [MONITORING_ROUTE_NORMS_ORDERS, requestParams],
                staleTime: STALE_TIME,
            },
        },
    )

    const back = () =>
        navigate({
            to: "/route-norms",
            search: Object.fromEntries(
                LIST_KEYS.filter((key) => search?.[key]).map((key) => [key, search[key]]),
            ),
        } as any)

    const changeTab = (value: string) =>
        navigate({
            search: (prev: any) => ({
                ...prev,
                [TAB_KEY]: value,
                [PAGE_KEY]: undefined,
            }),
        } as any)

    const title =
        norm ?
            `${norm.load_point?.name ?? "—"} → ${norm.unload_point?.name ?? "—"}`
        :   t("route_norms.sheet.title")

    const notInNorm = norm ? norm.trips_total - norm.trips_count : undefined
    const countLabel = (count?: number) =>
        count === undefined ? "" : ` (${count})`

    const head = (
        <div className="space-y-3 mb-3">
            <div className="flex items-start gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={back}
                    className="shrink-0"
                    aria-label={t("route_norms.page.back")}
                >
                    <ArrowLeft size={18} />
                </Button>
                <div className="space-y-1 min-w-0">
                    <h1 className="text-xl font-semibold leading-tight">{title}</h1>
                    <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                        {norm?.osrm_km != null && (
                            <span>
                                {t("route_norms.cols.osrm_distance")}:{" "}
                                <span className="text-foreground font-medium">
                                    {formatKm(t, norm.osrm_km)}
                                </span>
                            </span>
                        )}
                        {norm && norm.trips_count > 0 && (
                            <>
                                <span>
                                    {t("route_norms.cols.driven")}:{" "}
                                    {formatKm(t, norm.distance_km?.median)}
                                </span>
                                <span>
                                    {t("route_norms.cols.total_time")}:{" "}
                                    {formatDuration(t, norm.total_minutes?.median)}
                                </span>
                                {norm.fuel.map((item) => (
                                    <span key={item.fuel_type}>
                                        {fuelLabel(t, item.fuel_type)}:{" "}
                                        {formatFuel(t, item.fuel_type, item.per_100km_median)}{" "}
                                        / {t("route_norms.per_100km")}
                                    </span>
                                ))}
                            </>
                        )}
                        <DeviationLegend />
                    </div>
                </div>
            </div>
            <Tabs value={tab} onValueChange={changeTab}>
                <TabsList className="flex gap-2 overflow-x-auto justify-start no-scrollbar-x">
                    <TabsTrigger value="in">
                        {t("route_norms.sheet.tab_in")}
                        {countLabel(norm?.trips_count)}
                    </TabsTrigger>
                    <TabsTrigger value="out">
                        {t("route_norms.sheet.tab_out")}
                        {countLabel(notInNorm)}
                    </TabsTrigger>
                    <TabsTrigger value="flagged">
                        {t("route_norms.sheet.tab_flagged")}
                        {countLabel(flagged)}
                    </TabsTrigger>
                    <TabsTrigger value="all">
                        {t("route_norms.sheet.tab_all")}
                        {countLabel(norm?.trips_total)}
                    </TabsTrigger>
                </TabsList>
            </Tabs>
            {isError && (
                <p className="text-sm text-muted-foreground" role="alert">
                    {t("route_norms.error")}
                </p>
            )}
        </div>
    )

    return (
        <div className="space-y-3 pb-6">
            <DataTable
                columns={columns}
                data={isError ? [] : (data?.results ?? [])}
                loading={isLoading || !ready}
                numeration
                className="min-w-[1450px]"
                skeletonRowCount={8}
                head={head}
                rowColor={(row: RouteNormOrder) =>
                    row.deviation_level ? ROW_COLORS[row.deviation_level] : ""
                }
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: PAGE_KEY,
                    pageSizeParamName: PAGE_SIZE_KEY,
                    page_sizes: [25, 50, 100],
                }}
            />
        </div>
    )
}
