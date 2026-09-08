import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_PETROL_STATIONS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { getRequest, useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { useGlobalStore } from "@/store/global-store"
import { useQueries } from "@tanstack/react-query"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useMemo } from "react"
import {
    AlertTriangle,
    ArrowDownCircle,
    ArrowUpCircle,
    Wallet,
} from "lucide-react"
import { MoneyStat, type MoneyQueryState } from "../../pul-holat"
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

    const statsQ = useGet<PetrolStats>(`${SETTINGS_PETROL_STATIONS}/stats`)
    const stats = statsQ.data

    const columns = usePetrolStationColumns()

    /**
     * ZP-10: qidiruv jadvalni filtrlardi, kartalar esa o'zgarmasdi.
     *
     * "Jizzax" qidirilganda jadval 1 qatorga tushardi, kartalar esa hamon
     * "2 ta zapravka / −296 406 100 so'm" derdi — ya'ni ekranda ko'rinmayotgan
     * Dunyo zapravkasining summasi ham ichida qolardi. Filtrlangan ro'yxat
     * bilan uning ustidagi jami raqamlar mos kelmasligi — o'qishda to'g'ridan
     * to'g'ri xato xulosaga olib keladi.
     *
     * `/petrol-stations/stats/` endpointi `search` ni qabul QILMAYDI (backend
     * `PetrolStationStatsView` hamma stansiyani so'zsiz qo'shadi), shuning
     * uchun qidiruv paytida jami summalar har bir topilgan stansiyaning o'z
     * `/<id>/stats/` javobidan yig'iladi. So'rovlar faqat qidiruv yozilganda
     * yuboriladi — oddiy ko'rinishda qo'shimcha yuk yo'q.
     */
    const searchTerm = String(search.petrol_search ?? "").trim()
    const isSearching = searchTerm.length > 0
    const filteredStations = data?.results ?? []
    // Filtrlangan to'plam bitta sahifaga sig'masa, sahifadagi qatorlardan
    // hisoblangan jami butun natijani ifodalamaydi — bunday holatda raqam
    // ko'rsatmaymiz (yarim haqiqat noldan ham chalg'ituvchi).
    const filteredFitsOnPage =
        data != null && (data.count ?? 0) === filteredStations.length

    const stationStats = useQueries({
        queries:
            isSearching && filteredFitsOnPage
                ? filteredStations.map((st) => ({
                      queryKey: [`${SETTINGS_PETROL_STATIONS}/${st.id}/stats`],
                      queryFn: () =>
                          getRequest(
                              `${SETTINGS_PETROL_STATIONS}/${st.id}/stats`,
                          ),
                      staleTime: 1000 * 60 * 5,
                  }))
                : [],
    })

    const filteredStats = useMemo<PetrolStats | undefined>(() => {
        if (!isSearching || !filteredFitsOnPage) return undefined
        if (stationStats.length === 0) return undefined
        if (stationStats.some((q) => q.isLoading || q.isError)) return undefined
        return stationStats.reduce<PetrolStats>(
            (acc, q) => {
                const s = q.data as
                    | {
                          balance?: number | string
                          total_top_ups?: number | string
                          total_outcomes?: number | string
                      }
                    | undefined
                acc.total_balance += Number(s?.balance ?? 0) || 0
                acc.total_top_ups += Number(s?.total_top_ups ?? 0) || 0
                acc.total_outcomes += Number(s?.total_outcomes ?? 0) || 0
                return acc
            },
            {
                total_balance: 0,
                total_top_ups: 0,
                total_outcomes: 0,
                station_count: filteredStations.length,
            },
        )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isSearching,
        filteredFitsOnPage,
        filteredStations.length,
        stationStats.map((q) => q.dataUpdatedAt).join(","),
        stationStats.map((q) => q.status).join(","),
    ])

    /** Kartalarda ko'rsatiladigan yakuniy manba: qidiruv bo'lsa filtrlangani. */
    const shownStats = isSearching ? filteredStats : stats
    /**
     * R3: raqam FAQAT ma'lumot haqiqatan kelganda chiziladi. Qidiruvda —
     * filtrlangan jami tayyor bo'lganda; oddiy holatda — `stats` so'rovi
     * MUVAFFAQIYATLI tugaganda. Server javob bermay qotib qolsa `isError`
     * yonmaydi, shuning uchun `isSuccess` ga tayanamiz — aks holda ekranda
     * yana yolg'on "0 so'm" paydo bo'ladi.
     */
    const cardsQuery: MoneyQueryState = isSearching
        ? {
              isSuccess: !!filteredStats,
              isLoading: stationStats.some((q) => q.isLoading),
              isError: stationStats.some((q) => q.isError),
              error: stationStats.find((q) => q.isError)?.error,
              refetch: () => stationStats.forEach((q) => q.refetch?.()),
          }
        : statsQ

    // 4.3: kartalar bir-biriga zid son ko'rsatmasin.
    // Balans = Kirim − Chiqim bo'lishi shart; saqlangan `total_balance`
    // reyestrdan chetga chiqsa (backend nuqsoni) buni jimgina ko'rsatmaymiz.
    const totalBalance = Number(shownStats?.total_balance ?? 0)
    const ledgerBalance =
        Number(shownStats?.total_top_ups ?? 0) -
        Number(shownStats?.total_outcomes ?? 0)
    const balanceDrift = totalBalance - ledgerBalance
    const isBalanceInconsistent = !!shownStats && Math.abs(balanceDrift) >= 1

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
            {isBalanceInconsistent && (
                <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                    <span>
                        <span className="font-semibold">
                            Ma’lumot nomuvofiq:
                        </span>{" "}
                        umumiy balans ({formatMoney(totalBalance)} so‘m) kirim
                        va chiqim ayirmasiga ({formatMoney(ledgerBalance)} so‘m)
                        teng emas — farq {formatMoney(balanceDrift)} so‘m.
                        Quyidagi kartalardagi raqamlarga hozircha to‘liq
                        ishonmang, balans serverda qayta hisoblanishi kerak.
                    </span>
                </div>
            )}
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
                                <MoneyStat
                                    query={cardsQuery}
                                    compact
                                    value={() => (
                                        <>
                                            {formatMoney(
                                                Number(shownStats?.total_balance),
                                            )}{" "}
                                            so'm
                                        </>
                                    )}
                                />
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                                {shownStats
                                    ? `${shownStats.station_count} ta zapravka${
                                          isSearching ? " (qidiruv bo'yicha)" : ""
                                      }`
                                    : ""}
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
                                <MoneyStat
                                    query={cardsQuery}
                                    compact
                                    value={() => (
                                        <>
                                            +
                                            {formatMoney(
                                                Number(shownStats?.total_top_ups),
                                            )}{" "}
                                            so'm
                                        </>
                                    )}
                                />
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
                                <MoneyStat
                                    query={cardsQuery}
                                    compact
                                    value={() => (
                                        <>
                                            −
                                            {formatMoney(
                                                Number(shownStats?.total_outcomes),
                                            )}{" "}
                                            so'm
                                        </>
                                    )}
                                />
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
