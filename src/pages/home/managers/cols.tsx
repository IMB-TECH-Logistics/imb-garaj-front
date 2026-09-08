import { Badge } from "@/components/ui/badge"
import { SortableHeader } from "../sortable-header"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowRight } from "lucide-react"
import { useMemo } from "react"

const STATUS_COLORS: Record<number, string> = {
    1: "bg-green-500/10 text-green-600 border-transparent",
    2: "bg-gray-500/10 text-gray-500 border-transparent",
    3: "bg-orange-500/10 text-orange-600 border-transparent",
}

const STATUS_LABELS: Record<number, string> = {
    1: "Yukli",
    2: "Yuksiz",
    3: "Ta'mirda",
}

export const useColumnsManagersVehicles = () => {
    return useMemo<ColumnDef<ManagerVehicles>[]>(
        () => [
            {
                accessorKey: "truck_number",
                header: () => (
                    <SortableHeader field="truck_number" label="Avto raqami" />
                ),
                cell: ({ row }) => (
                    <div>{row.original.truck_number || "-"}</div>
                ),
            },
            {
                accessorKey: "type",
                header: () => (
                    <SortableHeader field="type" label="Transport turi" />
                ),
                cell: ({ row }) => (
                    <div>{row.original.type || "-"}</div>
                ),
            },
            {
                accessorKey: "driver_name",
                header: () => (
                    <SortableHeader field="driver_name" label="Haydovchi" />
                ),
                cell: ({ row }) => (
                    <div>{row.original.driver_name || "-"}</div>
                ),
            },
            {
                accessorKey: "status",
                header: () => (
                    <SortableHeader field="status" label="Avtomobil statusi" />
                ),
                cell: ({ row }) => {
                    const status = row.original?.status
                    const colorClass = STATUS_COLORS[status] || "bg-gray-500/10 text-gray-500 border-gray-200"
                    return (
                        <Badge variant="outline" className={colorClass}>
                            {STATUS_LABELS[status] || "-"}
                        </Badge>
                    )
                },
            },
            {
                accessorKey: "loading_name",
                header: "Joylashuv",
                enableSorting: false,
                cell: ({ row }) => {
                    const { loading_name, unloading_name } = row.original

                    if (loading_name && unloading_name) {
                        return (
                            <div className="flex items-center gap-1.5">
                                <span>{loading_name}</span>
                                <ArrowRight size={14} className="text-muted-foreground" />
                                <span>{unloading_name}</span>
                            </div>
                        )
                    }

                    return <span className="text-muted-foreground">{loading_name || unloading_name || "-"}</span>
                },
            },
            {
                accessorKey: "pending_orders",
                header: () => (
                    <SortableHeader
                        field="pending_orders"
                        label="Kutilayotgan reyslar"
                    />
                ),
            },
        ],
        [],
    )
}
