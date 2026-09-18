import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SETTINGS_PETROL_STATIONS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { cn } from "@/lib/utils"
import axiosInstance from "@/services/axios-instance"
import { formatMoney } from "@/lib/format-money"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { toast } from "sonner"
import { ArrowDownCircle, ArrowUpCircle, ChevronLeft, ChevronRight, Download, Wallet } from "lucide-react"
import { useState } from "react"
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
    const [isDownloading, setIsDownloading] = useState(false)
    const [reportOpen, setReportOpen] = useState(false)
    const [reportYear, setReportYear] = useState(new Date().getFullYear())

    const MONTHS = [
        ["Yan", "Fev", "Mart", "Apr"],
        ["May", "Iyun", "Iyul", "Avg"],
        ["Sen", "Okt", "Noy", "Dek"],
    ]

    const handleMonthSelect = async (monthIdx: number) => {
        const now = new Date()
        const isFuture = reportYear > now.getFullYear() ||
            (reportYear === now.getFullYear() && monthIdx > now.getMonth())
        if (isFuture) {
            toast.warning("Kelajakdagi oy uchun ma'lumot yo'q")
            return
        }
        const month = `${reportYear}-${String(monthIdx + 1).padStart(2, "0")}`
        setReportOpen(false)
        setIsDownloading(true)
        try {
            const response = await axiosInstance.get("petrol-stations/fuel-report/", {
                responseType: "blob",
                params: { month },
            })
            const blob = new Blob([response.data])
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `zapravka-${month}.xlsx`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
        } finally {
            setIsDownloading(false)
        }
    }

    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal("create")

    const { data, isLoading } = useGet<ListResponse<PetrolStationRow>>(
        SETTINGS_PETROL_STATIONS,
        {
            params: {
                search: search.petrol_search,
                page: search.page,
                page_size: search.page_size,
                ordering: search.ordering,
            },
        },
    )

    const { data: stats } = useGet<PetrolStats>(
        `${SETTINGS_PETROL_STATIONS}/stats`,
        { params: { search: search.petrol_search } },
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
                                {Number(stats?.total_outcomes ?? 0) > 0 ? "−" : ""}{formatMoney(Number(stats?.total_outcomes ?? 0))}{" "}
                                so'm
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="flex justify-end mb-4">
                <Popover open={reportOpen} onOpenChange={setReportOpen}>
                    <PopoverTrigger asChild>
                        <Button size="sm" variant="outline" disabled={isDownloading} loading={isDownloading}>
                            <Download size={16} className="mr-1" />
                            Yuklab olish
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-3" align="end">
                        <div className="flex justify-center relative items-center mb-2">
                            <span className="text-sm font-medium">{reportYear}</span>
                            <button
                                onClick={() => setReportYear(y => y - 1)}
                                className={cn(buttonVariants({ variant: "outline" }), "absolute left-0 h-7 w-7 p-0 flex items-center justify-center")}
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                onClick={() => setReportYear(y => y + 1)}
                                className={cn(buttonVariants({ variant: "outline" }), "absolute right-0 h-7 w-7 p-0 flex items-center justify-center")}
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                        <table className="w-full border-collapse">
                            <tbody>
                                {MONTHS.map((row, ri) => (
                                    <tr key={ri} className="flex w-full">
                                        {row.map((name, ci) => {
                                            const idx = ri * 4 + ci
                                            return (
                                                <td key={idx} className="h-10 w-1/4 text-center p-0">
                                                    <button
                                                        onClick={() => handleMonthSelect(idx)}
                                                        className={cn(buttonVariants({ variant: "ghost" }), "h-full w-full p-0 font-normal text-sm")}
                                                    >
                                                        {name}
                                                    </button>
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </PopoverContent>
                </Popover>
            </div>
            <DataTable
                loading={isLoading}
                manualSorting
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
                        pageKey="page"
                        count={data?.count}
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
