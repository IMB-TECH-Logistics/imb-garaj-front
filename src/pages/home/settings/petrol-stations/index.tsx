import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_PETROL_STATIONS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react"
import TableHeader from "../table-header"
import AddPetrolStationModal from "./add-petrol"
import { type PetrolStationRow, usePetrolStationColumns } from "./cols"

type PetrolStats = {
    total_balance: number
    total_top_ups: number
    total_outcomes: number
    station_count: number
}

const PetrolStationsPage = () => {
    const hasControl = useHasAction("settings_petrol_stations_control")
    const search = useSearch({ strict: false }) as Record<string, any>
    const navigate = useNavigate()
    const { getData, setData } = useGlobalStore()
    const item = getData<PetrolStationRow>(SETTINGS_PETROL_STATIONS)

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal("create")

    const { data, isLoading } = useGet<ListResponse<PetrolStationRow>>(
        SETTINGS_PETROL_STATIONS,
        {
            params: {
                search: search.petrol_search,
                page: search.page,
                page_size: search.page_size,
            },
        },
    )

    const { data: stats } = useGet<PetrolStats>(
        `${SETTINGS_PETROL_STATIONS}/stats`,
    )

    const columns = usePetrolStationColumns()

    const handleEdit = (row: { original: PetrolStationRow }) => {
        setData(SETTINGS_PETROL_STATIONS, row.original)
        openCreateModal()
    }

    const handleDelete = (row: { original: PetrolStationRow }) => {
        setData(SETTINGS_PETROL_STATIONS, row.original)
        openDeleteModal()
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Wallet size={20} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                Umumiy balans
                            </div>
                            <div className="text-xl font-semibold tabular-nums truncate">
                                {formatMoney(Number(stats?.total_balance ?? 0))}{" "}
                                so'm
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                                {stats?.station_count ?? 0} ta zapravka
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                            <ArrowUpCircle size={20} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                Kirim
                            </div>
                            <div className="text-xl font-semibold tabular-nums truncate text-emerald-600">
                                +{formatMoney(Number(stats?.total_top_ups ?? 0))}{" "}
                                so'm
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                            <ArrowDownCircle size={20} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                Chiqim
                            </div>
                            <div className="text-xl font-semibold tabular-nums truncate text-rose-600">
                                −{formatMoney(Number(stats?.total_outcomes ?? 0))}{" "}
                                so'm
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <DataTable
                loading={isLoading}
                columns={columns}
                data={data?.results}
                onDelete={hasControl ? handleDelete : undefined}
                onEdit={hasControl ? handleEdit : undefined}
                onRowClick={(row) =>
                    navigate({
                        to: "/petrol-stations/$id",
                        params: { id: String(row.id) },
                    })
                }
                numeration
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                }}
                head={
                    <TableHeader
                        fileName="Zapravkalar"
                        url="excel"
                        storeKey={
                            hasControl ? SETTINGS_PETROL_STATIONS : undefined
                        }
                        searchKey="petrol_search"
                        pageKey="page"
                    />
                }
            />
            <DeleteModal
                path={SETTINGS_PETROL_STATIONS}
                id={item?.id}
                refetchKeys={[
                    SETTINGS_PETROL_STATIONS,
                    `${SETTINGS_PETROL_STATIONS}/stats`,
                ]}
            />
            <Modal
                title={
                    item?.id ? "Zapravkani tahrirlash" : "Zapravka qo'shish"
                }
                modalKey="create"
                size="max-w-2xl"
            >
                <AddPetrolStationModal />
            </Modal>
        </>
    )
}

export default PetrolStationsPage
