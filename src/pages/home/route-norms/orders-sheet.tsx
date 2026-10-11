import { DataTable } from "@/components/ui/datatable"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MONITORING_ROUTE_NORMS_ORDERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { RouteNormFilterParams } from "./filters"
import {
    formatDuration,
    formatFuel,
    formatKm,
    fuelLabel,
} from "./format"
import { useOrderColumns } from "./order-cols"
import { RouteNorm, RouteNormOrdersResponse } from "./types"

type OrdersTab = "in" | "out" | "all"

type Props = {
    norms: RouteNorm[]
    params: RouteNormFilterParams
    ready: boolean
}

const STALE_TIME = 60 * 1000

const TAB_KEY = "o_tab"
const PAGE_KEY = "o_page"
const PAGE_SIZE_KEY = "o_page_size"
export const ROUTE_KEY = "route"

const IN_NORM_BY_TAB: Record<OrdersTab, string | undefined> = {
    in: "true",
    out: "false",
    all: undefined,
}

const isTab = (value: unknown): value is OrdersTab =>
    value === "in" || value === "out" || value === "all"

const parseRoute = (value: unknown) => {
    const [load, unload] = String(value ?? "").split("-")
    if (!/^\d+$/.test(load ?? "") || !/^\d+$/.test(unload ?? "")) return null
    return { load_point: load, unload_point: unload }
}

export default function OrdersSheet({ norms, params, ready }: Props) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const search: any = useSearch({ strict: false })
    const columns = useOrderColumns()

    const route = parseRoute(search?.[ROUTE_KEY])
    const norm = norms.find((item) => item.id === search?.[ROUTE_KEY])
    const defaultTab: OrdersTab = !norm || norm.trips_count > 0 ? "in" : "all"
    const tab: OrdersTab = isTab(search?.[TAB_KEY]) ? search[TAB_KEY] : defaultTab

    const requestParams = {
        ...params,
        ...route,
        in_norm: IN_NORM_BY_TAB[tab],
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

    const close = () =>
        navigate({
            search: (prev: any) => ({
                ...prev,
                [ROUTE_KEY]: undefined,
                [TAB_KEY]: undefined,
                [PAGE_KEY]: undefined,
                [PAGE_SIZE_KEY]: undefined,
            }),
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

    return (
        <Sheet open={!!route} onOpenChange={(open) => !open && close()}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-6xl overflow-y-auto"
            >
                <SheetHeader>
                    <SheetTitle>{title}</SheetTitle>
                    <SheetDescription asChild>
                        <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                            {norm && norm.trips_count > 0 && (
                                <>
                                    <span>
                                        {t("route_norms.cols.distance")}:{" "}
                                        {formatKm(t, norm.distance_km?.median)}
                                    </span>
                                    <span>
                                        {t("route_norms.cols.total_time")}:{" "}
                                        {formatDuration(
                                            t,
                                            norm.total_minutes?.median,
                                        )}
                                    </span>
                                    {norm.fuel.map((item) => (
                                        <span key={item.fuel_type}>
                                            {fuelLabel(t, item.fuel_type)}:{" "}
                                            {formatFuel(
                                                t,
                                                item.fuel_type,
                                                item.per_100km_median,
                                            )}{" "}
                                            / {t("route_norms.per_100km")}
                                        </span>
                                    ))}
                                </>
                            )}
                        </div>
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-3">
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
                            <TabsTrigger value="all">
                                {t("route_norms.sheet.tab_all")}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    {isError ?
                        <p className="text-sm text-muted-foreground" role="alert">
                            {t("route_norms.error")}
                        </p>
                    :   <DataTable
                            columns={columns}
                            data={data?.results ?? []}
                            loading={isLoading}
                            numeration
                            className="min-w-[1250px]"
                            wrapperClassName="p-0 bg-transparent"
                            skeletonRowCount={8}
                            paginationProps={{
                                totalPages: data?.total_pages,
                                paramName: PAGE_KEY,
                                pageSizeParamName: PAGE_SIZE_KEY,
                                page_sizes: [25, 50, 100],
                            }}
                        />
                    }
                </div>
            </SheetContent>
        </Sheet>
    )
}
