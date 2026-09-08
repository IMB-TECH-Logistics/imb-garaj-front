import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { MANAGERS_VEHICLES } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useColumnsManagersVehicles } from "./cols"
import OutOfRangePageNotice from "./out-of-range-notice"
import { isPageRequestFailed, retryExceptNotFound } from "./page-error"

export default function Managers() {
    const search = useSearch({ strict: false })
    const { ordering, page } = search as any
    const { setData } = useGlobalStore()
    const cols = useColumnsManagersVehicles()
    const query = useGet<ListResponse<ManagerVehicles>>(MANAGERS_VEHICLES, {
        params: {
            page_size: search.page_size,
            page: search.page,
            search: search.search,
            // MT-10: global (server tomon) saralash uchun. Backend OrderingFilter
            // qo'shgach ishlaydi — backend-kerak/F2.md ga qarang.
            ...(ordering ? { ordering } : {}),
        },
        options: { retry: retryExceptNotFound },
    })
    const { data, isLoading } = query
    const navigate = useNavigate()

    // MT-14: ?page=9999 kabi diapazondan tashqari raqamda backend 404 ("Invalid page")
    // qaytaradi va foydalanuvchi "Ro'yxat 0" + bo'sh ekran ko'radi.
    const isPageOutOfRange = isPageRequestFailed(query) && Number(page) > 1

    const handleRowClick = (item: ManagerVehicles) => {
        setData(MANAGERS_VEHICLES, item)
        const id = item?.id
        if (!id) return
        navigate({
            to: "/manager-trips/$id",
            params: { id: id.toString() },
            search: {
                name: item?.truck_number,
            } as any,
        })
    }

    return (
        <>
            <DataTable
                loading={isLoading}
                numeration
                data={data?.results}
                columns={cols}
                paginationProps={{
                    paramName: "page",
                    pageSizeParamName: "page_size",
                    totalPages: data?.total_pages,
                    // MT-03: qator raqami `page_sizes?.[0]` ga tayanadi (datatable.tsx).
                    // Bu prop berilmaganda u DEFAULT_PAGE_SIZE=10 ga tushib qolardi,
                    // backend esa 25 tadan beradi — 2-sahifada 26–33 o'rniga 11–18 chiqardi.
                    page_sizes: [25, 50, 100, 250],
                }}
                onRowClick={handleRowClick}
                head={
                    <div className="p-3">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl ">Ro'yxat</h1>
                            <Badge>{formatMoney(data?.count)}</Badge>
                        </div>
                        {isPageOutOfRange && (
                            <OutOfRangePageNotice
                                onReset={() =>
                                    navigate({
                                        search: (prev: any) => ({
                                            ...prev,
                                            page: undefined,
                                        }),
                                    } as any)
                                }
                            />
                        )}
                    </div>
                }
            />
        </>
    )
}
