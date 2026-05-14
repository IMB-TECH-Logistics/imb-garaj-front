import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { DRIVERS_BALANCE, SETTINGS_DRIVERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { ColumnDef } from "@tanstack/react-table"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useMemo } from "react"
import { formatPhoneNumber } from "@/pages/home/settings/customers/phone-number"

type DriverBalance = { id: number; full_name: string; balance: string }

type DriverRow = DriversType & { _balance?: string }

const useCols = () =>
    useMemo<ColumnDef<DriverRow>[]>(
        () => [
            {
                header: "Ism",
                accessorKey: "first_name",
                cell: ({ row }) => (
                    <span className="font-medium">
                        {row.original.first_name} {row.original.last_name}
                    </span>
                ),
            },
            {
                header: "Telefon",
                accessorKey: "phone",
                cell: ({ row }) =>
                    formatPhoneNumber(row.original?.driver?.phone || "—"),
            },

            {
                header: "Balans",
                accessorKey: "_balance",
                cell: ({ row }) => {
                    const v = Number(row.original._balance ?? 0)
                    return (
                        <span
                            className={
                                v < 0
                                    ? "text-red-500 font-medium"
                                    : v > 0
                                      ? "text-green-500 font-medium"
                                      : ""
                            }
                        >
                            {formatMoney(v)} so'm
                        </span>
                    )
                },
            },
        ],
        [],
    )

export default function HaydovchilarList() {
    const navigate = useNavigate()
    const search = useSearch({ strict: false }) as any
    const cols = useCols()

    const { data, isLoading } = useGet<ListResponse<DriversType>>(
        SETTINGS_DRIVERS,
        {
            params: {
                search: search.driver_search,
                page: search.page,
                page_size: search.page_size,
            },
        },
    )
    const { data: balances } = useGet<DriverBalance[]>(DRIVERS_BALANCE)

    const rows = useMemo<DriverRow[]>(() => {
        const map = new Map<number, string>(
            (balances ?? []).map((b) => [b.id, b.balance]),
        )
        return (data?.results ?? []).map((d) => ({
            ...d,
            _balance: map.get(d.id) ?? "0",
        }))
    }, [data?.results, balances])

    const handleRowClick = (row: DriverRow) => {
        navigate({
            to: "/haydovchilar/$id",
            params: { id: row.id.toString() },
            search: {
                name: `${row.first_name} ${row.last_name}`.trim(),
            } as any,
        })
    }

    return (
        <DataTable
            loading={isLoading}
            columns={cols}
            data={rows}
            numeration
            onRowClick={handleRowClick}
            head={
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-semibold">Haydovchilar</h1>
                        <Badge>{data?.count ?? 0}</Badge>
                    </div>
                </div>
            }
            paginationProps={{
                totalPages: data?.total_pages,
                paramName: "page",
                pageSizeParamName: "page_size",
            }}
        />
    )
}
