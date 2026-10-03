import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import {
    COMMON_DIRECTIONS,
    SETTINGS_SELECTABLE_PAYMENT_TYPE,
} from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { Button } from "@/components/ui/button"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import TableHeader from "../table-header"
import AddRouteConfigModal from "./add-route"
import { type DirectionPrice, type DirectionRow, useDirectionColumns } from "./cols"

const DEFAULT_ORDERING = "-price_amount"

type Direction = {
    id: number
    owner: number
    owner_name: string
    owner_code: string
    load: number
    load_name: string
    unload: number
    unload_name: string
    load_place?: string | null
    unload_place?: string | null
    load_city_name?: string | null
    unload_city_name?: string | null
    load_place_display?: string | null
    unload_place_display?: string | null
    cargo_type: number
    cargo_type_name: string
    payment_type: number
    currency: 1 | 2
    current_price: DirectionPrice | null
    no_price?: boolean
    prices?: DirectionPrice[]
    created?: string
    updated?: string
}

type SelectItem = { id: number | string; name: string }

const RouteConfigsPage = () => {
    const { t } = useTranslation()
    const hasControl = useHasAction("settings_directions_control")
    const search = useSearch({ strict: false }) as Record<string, any>
    const { getData, setData } = useGlobalStore()
    const item = getData<Direction>(COMMON_DIRECTIONS)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal("create")

    const navigate = useNavigate()
    const ordering = search.ordering ?? DEFAULT_ORDERING
    const onlyNoPrice = search.no_price === "true"

    useEffect(() => {
        if (!search.ordering) {
            navigate({
                replace: true,
                search: (prev: Record<string, unknown>) => ({
                    ...prev,
                    ordering: DEFAULT_ORDERING,
                }),
            } as any)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search.ordering])

    const { data, isLoading } = useGet<ListResponse<Direction>>(
        COMMON_DIRECTIONS,
        {
            params: {
                search: search.route_configs_search,
                page: search.page,
                page_size: search.page_size,
                no_price: onlyNoPrice ? true : undefined,
                ordering,
            },
        },
    )

    // payment_type_name is not joined on the Direction response, so we still
    // need a selectable lookup to display its label.
    const { data: paymentTypeData } = useGet<SelectItem[]>(
        SETTINGS_SELECTABLE_PAYMENT_TYPE,
        { params: { model_name: "payment-type" } },
    )

    const paymentMap = useMemo(
        () =>
            Object.fromEntries(
                (paymentTypeData ?? []).map((i) => [Number(i.id), i.name]),
            ),
        [paymentTypeData],
    )

    const enriched: DirectionRow[] = useMemo(
        () =>
            (data?.results ?? [])
                .map((d) => ({
                id: d.id,
                owner_name: d.owner_name ?? String(d.owner),
                owner_code: d.owner_code ?? "",
                load_name: d.load_name ?? String(d.load),
                unload_name: d.unload_name ?? String(d.unload),
                load_place: d.load_place,
                unload_place: d.unload_place,
                load_city_name: d.load_city_name,
                unload_city_name: d.unload_city_name,
                load_place_display: d.load_place_display,
                unload_place_display: d.unload_place_display,
                distributor_id: d.distributor_id,
                distributor_name: d.distributor_name,
                distributor_code: d.distributor_code,
                distributor_district: d.distributor_district,
                cargo_type_name: d.cargo_type_name ?? String(d.cargo_type),
                payment_type_name:
                    paymentMap[d.payment_type] ?? String(d.payment_type),
                currency: d.currency,
                current_price: d.current_price,
                no_price: d.no_price,
                prices: d.prices,
            })),
        [data, paymentMap],
    )

    const columns = useDirectionColumns()

    const handleEdit = (row: { original: DirectionRow }) => {
        const original = data?.results?.find((d) => d.id === row.original.id)
        if (original) setData(COMMON_DIRECTIONS, original)
        openCreateModal()
    }

    const handleDelete = (row: { original: DirectionRow }) => {
        const original = data?.results?.find((d) => d.id === row.original.id)
        if (original) setData(COMMON_DIRECTIONS, original)
        openDeleteModal()
    }

    return (
        <>
            <DataTable
                loading={isLoading}
                manualSorting
                columns={columns}
                data={enriched}
                onDelete={hasControl ? handleDelete : undefined}
                onEdit={hasControl ? handleEdit : undefined}
                numeration
                paginationProps={{
                    totalPages: onlyNoPrice ? 1 : data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                    page_sizes: [25, 50, 100, 250, 500, 1000],
                }}
                head={
                    <TableHeader
                        fileName={t("nav.directions")}
                        url="excel"
                        storeKey={hasControl ? COMMON_DIRECTIONS : undefined}
                        searchKey="route_configs_search"
                        pageKey="page"
                        count={onlyNoPrice ? enriched.length : data?.count}
                        extraLeft={
                            <Button
                                variant={onlyNoPrice ? "default" : "outline"}
                                onClick={() =>
                                    navigate({
                                        search: (prev: Record<string, unknown>) => ({
                                            ...prev,
                                            no_price: onlyNoPrice ? undefined : "true",
                                            page: undefined,
                                        }),
                                    } as any)
                                }
                            >
                                {t("form.dm_no_price_filter")}
                            </Button>
                        }
                    />
                }
            />
            <DeleteModal
                path={COMMON_DIRECTIONS}
                id={item?.id ? `${item.id}/delete` : undefined}
            />
            <Modal
                title={
                    item?.id ? "Yo'nalishni tahrirlash" : "Yo'nalish qo'shish"
                }
                modalKey="create"
                size="max-w-2xl"
            >
                <AddRouteConfigModal />
            </Modal>
        </>
    )
}

export default RouteConfigsPage
