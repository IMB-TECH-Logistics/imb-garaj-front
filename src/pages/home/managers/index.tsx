import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import { MANAGERS_VEHICLES } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useColumnsManagersVehicles } from "./cols"
export default function Managers() {
    const search = useSearch({strict:false})
    const { setData, getData } = useGlobalStore()
    const cols = useColumnsManagersVehicles()
    const { data, isLoading } =
        useGet<ListResponse<ManagerVehicles>>(MANAGERS_VEHICLES,{
            params:{
                page_size:search.page_size,
                page:search.page,

                
            }
        })
    const navigate = useNavigate()

    const handleRowClick = (item: ManagerVehicles) => {
        setData(MANAGERS_VEHICLES, item)
        const id = item?.id
        if (!id) return
        navigate({
            to: "/manager-trips/$id",
            params: { id: id.toString() },
            search:{
                name:item?.truck_number 
            } as any
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
                    paramName:"page",
                    pageSizeParamName:"page_size",
                    totalPages:data?.total_pages
                }}
                onRowClick={handleRowClick}
                head={
                    <div className="p-3">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl ">Ro'yxat</h1>
                            <Badge>{formatMoney(data?.count)}</Badge>
                        </div>
                    </div>
                }
            />
        </>
    )
}
