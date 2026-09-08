import { Button } from "@/components/ui/button"
import { MANAGERS_TRIPS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { useGlobalStore } from "@/store/global-store"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { CheckCircle, HandCoins, SquarePen, Trash2 } from "lucide-react"
export const STATUS_LABELS: any = {
    1: "Yukli",
    2: "Yuksiz",
    3: "Ta'mirda",
}

/**
 * Hisoblagich ustunlari uchun: maydon backenddan kelmasa (undefined/null) "—",
 * haqiqiy 0 esa "0" bo'lib ko'rinadi. MT-21 dagi soxta 0 shu bilan oldi olinadi.
 */
const countOrDash = (value: number | string | null | undefined) =>
    value === null || value === undefined || value === "" ? "—" : value

export const STATUS_TRIP: Record<number, string> = {
    0: "Kutilmoqda",
    1: "Boshlandi",
    5: "Yuklanmoqda",
    6: "Yo'lda",
    7: "Tushirilmoqda",
    2: "Tugallandi",
    3: "Bekor qilindi",
    4: "Arxivlangan",
}

export const useColumnsManagersTrips = (opts?: {
    onMoliya?: (item: ManagerTrips) => void
    onEdit?: (item: ManagerTrips) => void
    onDelete?: (item: ManagerTrips) => void
}) => {
    const { onMoliya, onEdit, onDelete } = opts || {}
    const hasControl = useHasAction("manager_vehicles_control")
    const { openModal: openFinished } = useModal(`${MANAGERS_TRIPS}-finished`)
    const { setData, getData } = useGlobalStore()
    const handleFinished = (item: ManagerTrips) => {
        setData("finished", item)
        openFinished()
    }

    return useMemo<ColumnDef<ManagerTrips>[]>(
        () => [
            {
                accessorKey: "start",
                header: "Boshlanish vaqti",
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="">{row.original.start || "-"}</div>
                ),
            },
            {
                accessorKey: "end",
                header: "Tugallangan vaqti",
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="">{row.original.end || "-"}</div>
                ),
            },
            {
                accessorKey: "driver_name",
                header: "Haydovchi",
                enableSorting: true,
                cell: ({ row }) => <div>{row.original.driver_name || "-"}</div>,
            },
            {
                accessorKey: "completed_order_count",
                header: "Yakunlangan reyslar",
                enableSorting: true,
                // MT-21: backend bu maydonni hali qaytarmaydi (backend-kerak/F2.md).
                // Maydon kelmasa "—" ko'rsatiladi — ilgari `as any` bilan soxta 0 chiqardi.
                cell: ({ row }) => <div>{countOrDash(row.original.completed_order_count)}</div>,
            },
            {
                accessorKey: "pending_order_count",
                header: "Kutilayotgan reyslar",
                enableSorting: true,
                cell: ({ row }) => <div>{countOrDash(row.original.pending_order_count)}</div>,
            },
            // {
            //     accessorKey: "status",
            //     header: "Aylanma statusi",
            //     enableSorting: true,
            //     cell: ({ row }) => {
            //         const status = row.original?.status
            //         return <div>{STATUS_LABELS[status] || "-"}</div>
            //     },
            // },

            {
                accessorKey: "start_mileage",
                header: "Boshlash probegi",
                enableSorting: true,
                cell: ({ row }) => {
                    return <div>{formatMoney(row.original.start_mileage)}</div>
                },
            },
            {
                accessorKey: "end_mileage",
                header: "Tugash probegi",
                enableSorting: true,
                cell: ({ row }) => {
                    return <div>{formatMoney(row.original.end_mileage)}</div>
                },
            },
            {
                accessorKey: "start_fuel",
                header: "Boshlang'ich yoqilg'i",
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{formatMoney(row.original.start_fuel ?? undefined)}</div>
                ),
            },
            {
                accessorKey: "end_fuel",
                header: "Yakuniy yoqilg'i",
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{formatMoney(row.original.end_fuel ?? undefined)}</div>
                ),
            },
            {
                id: "fuel_per_100km",
                header: "100 km ga sarf (l)",
                enableSorting: true,
                accessorFn: (row) => {
                    const startFuel = Number(row.start_fuel ?? 0)
                    const endFuel = Number(row.end_fuel ?? 0)
                    const distance = Number(row.end_mileage ?? 0) - Number(row.start_mileage ?? 0)
                    const liters = startFuel - endFuel
                    if (distance <= 0 || liters <= 0) return 0
                    return (liters / distance) * 100
                },
                cell: ({ row }) => {
                    const startFuel = Number(row.original.start_fuel ?? 0)
                    const endFuel = Number(row.original.end_fuel ?? 0)
                    const distance =
                        Number(row.original.end_mileage ?? 0) -
                        Number(row.original.start_mileage ?? 0)
                    const liters = startFuel - endFuel
                    if (distance <= 0 || liters <= 0) return <div>-</div>
                    return <div>{((liters / distance) * 100).toFixed(1)}</div>
                },
            },
            {
                accessorKey: "income_uzs",
                header: "Tushum (uzs)",
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{formatMoney(row.original.income_uzs)}</div>
                ),
            },
            {
                accessorKey: "income_usd",
                header: "Tushum (usd)",
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{formatMoney(row.original.income_usd)}</div>
                ),
            },
            {
                accessorKey: "cash_flow_sum",
                header: "Xarajat",
                enableSorting: true,
                cell: ({ row }) => (
                    <div>{formatMoney(row.original.cash_flow_sum)}</div>
                ),
            },

            {
                id: "actions",
                header: " ",
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-2 py-2">
                        {hasControl && !row.original.end && (
                            <Button
                                size="sm"
                                className="bg-green-500/10 text-green-600 hover:bg-green-500/15"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleFinished(row.original)
                                }}
                            >
                                <CheckCircle size={14} />
                                Tugatish
                            </Button>
                        )}
                        <Button
                            icon={<HandCoins className="text-blue-500" size={16} />}
                            size="sm"
                            className="p-0 h-3"
                            variant="ghost"
                            onClick={(e) => {
                                e.stopPropagation()
                                onMoliya?.(row.original)
                            }}
                        />
                        {hasControl && (
                            <>
                                <Button
                                    icon={<SquarePen className="text-primary" size={16} />}
                                    size="sm"
                                    className="p-0 h-3"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onEdit?.(row.original)
                                    }}
                                />
                                <Button
                                    icon={<Trash2 className="text-red-500" size={16} />}
                                    size="sm"
                                    className="p-0 h-3"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDelete?.(row.original)
                                    }}
                                />
                            </>
                        )}
                    </div>
                ),
            },
        ],
        [onMoliya, onEdit, onDelete],
    )
}
