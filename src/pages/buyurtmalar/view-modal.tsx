import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { MANAGERS_VEHICLES } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { CopyButton } from "@/lib/copy-button"
import { useGlobalStore } from "@/store/global-store"
import { useSearch } from "@tanstack/react-router"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { toast } from "sonner"

const VEHICLE_STATUS_EMPTY = 2

const ViewModal = () => {
    const { closeModal, isOpen } = useModal("view-modal")
    const { getData } = useGlobalStore()
    const orderId = getData("view-key")
    const search = useSearch({ strict: false }) as Record<string, unknown>

    const { data, isLoading } = useGet<ListResponse<ManagerVehicles>>(
        MANAGERS_VEHICLES,
        {
            params: {
                status: VEHICLE_STATUS_EMPTY,
                page: search.candidates_page,
                page_size: search.candidates_page_size,
            },
            enabled: isOpen,
        },
    )

    const handleSelect = (vehicle: ManagerVehicles) => {
        toast.success(
            `${vehicle.driver_name || vehicle.truck_number} buyurtmaga biriktirildi`,
        )
        closeModal()
    }

    const columns = useMemo<ColumnDef<ManagerVehicles>[]>(
        () => [
            {
                header: "№",
                size: 40,
                cell: ({ row }) => (
                    <div className="w-10 text-center">{row.index + 1}</div>
                ),
            },
            {
                accessorKey: "driver_name",
                header: "Haydovchi F.I.Sh",
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {row.original.driver_name || "-"}
                    </span>
                ),
            },
            {
                accessorKey: "truck_number",
                header: "Davlat raqami",
                cell: ({ row }) =>
                    row.original.truck_number
                        ? CopyButton(row.original.truck_number)
                        : "-",
            },
            {
                accessorKey: "type",
                header: "Mashina turi",
                cell: ({ row }) => row.original.type || "-",
            },
            {
                accessorKey: "loading_name",
                header: "Yuklash joyi",
                cell: ({ row }) => row.original.loading_name || "-",
            },
            {
                accessorKey: "unloading_name",
                header: "Yuk tushurish joyi",
                cell: ({ row }) => row.original.unloading_name || "-",
            },
            {
                id: "action",
                header: "",
                cell: ({ row }) => (
                    <Button
                        size="sm"
                        onClick={() => handleSelect(row.original)}
                    >
                        Tanlash
                    </Button>
                ),
            },
        ],
        [orderId],
    )

    return (
        <div className="max-h-[80vh] overflow-y-auto space-y-3">
            <DataTable
                data={data?.results}
                columns={columns}
                loading={isLoading}
                paginationProps={{
                    paramName: "candidates_page",
                    pageSizeParamName: "candidates_page_size",
                    totalPages: data?.total_pages,
                }}
            />
        </div>
    )
}

export default ViewModal
