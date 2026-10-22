import { DataTable } from "@/components/ui/datatable"
import { MONITORING_ROUTE_NORMS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { useRouteNormColumns } from "./cols"
import RouteNormFilters, { useRouteNormFilters } from "./filters"
import SummaryLine from "./summary-line"
import { RouteNorm, RouteNormListResponse } from "./types"

const STALE_TIME = 60 * 1000

export default function RouteNormsPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const search: any = useSearch({ strict: false })
    const columns = useRouteNormColumns()
    const { params, ready } = useRouteNormFilters()

    const requestParams = {
        ...params,
        ordering: search?.ordering || undefined,
        page: search?.page || undefined,
        page_size: search?.page_size || undefined,
    }

    const { data, isLoading, isError } = useGet<RouteNormListResponse>(
        MONITORING_ROUTE_NORMS,
        {
            params: requestParams,
            enabled: ready,
            options: {
                queryKey: [MONITORING_ROUTE_NORMS, requestParams],
                staleTime: STALE_TIME,
            },
        },
    )

    const openRoute = (row: RouteNorm) =>
        navigate({
            to: "/route-norms/$route",
            params: { route: row.id },
            search: (prev: any) => ({ ...prev, route: undefined }),
        } as any)

    return (
        <div className="space-y-3">
            <DataTable
                columns={columns}
                data={data?.results ?? []}
                loading={isLoading || !ready}
                numeration
                manualSorting
                onRowClick={openRoute}
                className="min-w-[1250px]"
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                    page_sizes: [25, 50, 100],
                }}
                head={
                    <div className="mb-1">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <h1 className="text-lg">{t("nav.route_norms")}</h1>
                            <RouteNormFilters
                                params={params}
                                ordering={search?.ordering}
                                ready={ready}
                            />
                        </div>
                        <SummaryLine params={params} ready={ready} />
                        {isError && (
                            <p
                                className="text-sm text-muted-foreground mb-3"
                                role="alert"
                            >
                                {t("route_norms.error")}
                            </p>
                        )}
                    </div>
                }
            />
        </div>
    )
}
