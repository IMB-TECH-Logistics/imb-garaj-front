import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { formatMoney } from "@/lib/format-money"
import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface OrderTripType {
    date: string
    loading_name: string
    unloading_name: string
    cargo_type_name: string | null
    client_name: string | null
    income_uzs: number
    income_usd: number
    type: number
}

export interface TripDailyStatisticType {
    id: number
    total_expense: number | null
    total_mileage: number
    start_mileage_image: string | null
    end_mileage_image: string | null
    fuel_consume: number
    orders_trip: OrderTripType[]
    is_summary?: boolean // indicator for parent row grouping
}

export const useCostCols = () => {
    return useMemo<ColumnDef<TripDailyStatisticType | OrderTripType>[]>(
        () => [
            {
                header: "Sana / Reys",
                accessorKey: "date",
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original as any;
                    if (data.is_summary) {
                        return (
                            <div className="font-bold text-black text-sm flex items-center gap-1.5">
                                {data.start_date && data.end_date ? 
                                    <>{data.start_date} <ArrowRight size={14} className="opacity-80"/> {data.end_date} jami</> 
                                : "Jami"}
                            </div>
                        )
                    }
                    return <span className="font-medium text-muted-foreground">{data.date}</span>
                },
            },
            {
                header: "Marshrut",
                accessorKey: "route",
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original as any;
                    if (data.is_summary) return null;
                    return (
                        <span>
                            {data.loading_name} - {data.unloading_name}
                        </span>
                    )
                },
            },
            {
                header: "Yuk turi",
                accessorKey: "cargo_type_name",
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original as any;
                    
                    if (data.type === 2) {
                        return <Badge variant="secondary">Bo'sh</Badge>
                    }
                    if (data.type === 1 && !data.cargo_type_name) {
                        return <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/15">Band</Badge>
                    }
                    if (data.is_summary) {
                        return <span className="font-bold text-black">{data.cargo_type_name || "—"}</span>
                    }
                    return <span>{data.cargo_type_name || "—"}</span>
                },
            },
            {
                header: "Firma (Mijoz)",
                accessorKey: "client_name",
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original as any;
                    if (data.is_summary) return null;
                    return <span>{data.client_name || "—"}</span>
                },
            },
            {
                header: "Tushum (UZS)",
                accessorKey: "income_uzs",
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original as any;
                    if (data.is_summary) {
                        return <span className="font-bold text-black">{data.income_uzs ? formatMoney(data.income_uzs) : ""}</span>
                    }
                    return <span className="font-medium text-green-600">{formatMoney(data.income_uzs)}</span>
                },
            },
            {
                header: "Tushum (USD)",
                accessorKey: "income_usd",
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original as any;
                    if (data.is_summary) {
                        return <span className="font-bold text-black">{data.income_usd ? `$${formatMoney(data.income_usd)}` : ""}</span>
                    }
                    return <span className="font-medium text-green-600">{data.income_usd ? `$${formatMoney(data.income_usd)}` : "—"}</span>
                },
            },
            {
                header: "Masofa (Probeg)",
                accessorKey: "total_mileage",
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original as any;
                    if (!data.is_summary) return null;
                    return <span className="font-bold text-black">{data.total_mileage} km</span>
                },
            },
            {
                header: "Yoqilg'i sarfi",
                accessorKey: "fuel_consume",
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original as any;
                    if (!data.is_summary) return null;
                    return <span className="font-bold text-black">{data.fuel_consume}</span>
                },
            },
            {
                header: "Xarajat",
                accessorKey: "total_expense",
                enableSorting: false,
                cell: ({ row }) => {
                    const data = row.original as any;
                    if (!data.is_summary) return null;
                    return <span className="font-bold text-black">{data.total_expense ? formatMoney(data.total_expense) : "—"}</span>
                },
            },
        ],
        [],
    )
}

