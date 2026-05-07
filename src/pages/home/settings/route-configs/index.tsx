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
import { useSearch } from "@tanstack/react-router"
import { useMemo } from "react"
import TableHeader from "../table-header"
import AddRouteConfigModal from "./add-route"
import { type DirectionRow, useDirectionColumns } from "./cols"

type Direction = {
    id: number
    owner: number
    owner_name: string
    load: number
    load_name: string
    unload: number
    unload_name: string
    cargo_type: number
    cargo_type_name: string
    payment_type: number
    currency: 1 | 2
    amount: string | null
    current_price: string | number | null
    created?: string
    updated?: string
}

type SelectItem = { id: number | string; name: string }

const RouteConfigsPage = () => {
    const hasControl = useHasAction("settings_directions_control")
    const search = useSearch({ strict: false }) as Record<string, any>
    const { getData, setData } = useGlobalStore()
    const item = getData<Direction>(COMMON_DIRECTIONS)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal("create")

    const { data, isLoading } = useGet<ListResponse<Direction>>(
        COMMON_DIRECTIONS,
        {
            params: {
                search: search.route_configs_search,
                page: search.page,
                page_size: search.page_size,
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
            (data?.results ?? []).map((d) => ({
                id: d.id,
                owner_name: d.owner_name ?? String(d.owner),
                load_name: d.load_name ?? String(d.load),
                unload_name: d.unload_name ?? String(d.unload),
                cargo_type_name: d.cargo_type_name ?? String(d.cargo_type),
                payment_type_name:
                    paymentMap[d.payment_type] ?? String(d.payment_type),
                currency: d.currency,
                amount: d.amount,
                current_price: d.current_price,
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
                columns={columns}
                data={enriched}
                onDelete={hasControl ? handleDelete : undefined}
                onEdit={hasControl ? handleEdit : undefined}
                numeration
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                    page_sizes: [25, 50, 100, 250, 500, 1000],
                }}
                head={
                    <TableHeader
                        fileName="Yo'nalishlar"
                        url="excel"
                        storeKey={hasControl ? COMMON_DIRECTIONS : undefined}
                        searchKey="route_configs_search"
                        pageKey="page"
                    />
                }
            />
            <DeleteModal path={COMMON_DIRECTIONS} id={item?.id} />
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
