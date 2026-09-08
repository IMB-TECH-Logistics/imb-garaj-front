import { ParamCombobox } from "@/components/as-params/combobox"
import ParamDateRange from "@/components/as-params/date-picker-range"
import ParamInput from "@/components/as-params/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { MANAGERS_RUNS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { formatMoney } from "@/lib/format-money"
import { useSearch } from "@tanstack/react-router"
import { AlertTriangle, Download, Info } from "lucide-react"
import BuxgalteriyaExcelModal, {
    useBuxgalteriyaExcelModal,
} from "../buxgalteriya/excel-modal"
import { useRunFilterOptions } from "../buxgalteriya/loading-options"
import { ReysOrder, useFlightsColumns } from "./columns"

export default function FlightsPage() {
    const search: any = useSearch({ strict: false })

    const { openModal: openExcelModal } = useBuxgalteriyaExcelModal()

    const currentDate = new Date()
    const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
    )

    const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
    )

    const defaultDateRange =
        !search?.from_date && !search?.to_date ?
            { from: startOfMonth, to: endOfMonth }
        :   undefined

    const {
        loadingOptions,
        unloadingOptions,
        clientOptions,
        cargoTypeOptions,
    } = useRunFilterOptions({
        from_date: search?.from_date,
        to_date: search?.to_date,
        search: search?.search,
    })

    const { data, isLoading } = useGet<ListResponse<ReysOrder>>(MANAGERS_RUNS, {
        params: {
            from_date: search?.from_date,
            to_date: search?.to_date,
            page: search?.page,
            page_size: search?.page_size,
            search: search?.search,
            client: search?.client,
            loading: search?.loading,
            unloading: search?.unloading,
            cargo_type: search?.cargo_type,
            // MR-12: server tomon saralash — backend OrderingFilter qo'shgach ishlaydi
            // (backend-kerak/F2.md). Hozircha DRF uni jimgina e'tiborsiz qoldiradi.
            ...(search?.ordering ? { ordering: search.ordering } : {}),
        },
    })

    const columns = useFlightsColumns()

    // MR-08: teskari sana oralig'i (tugash < boshlanish) hech qanday ogohlantirishsiz
    // qabul qilinardi — natija bo'sh chiqib, foydalanuvchi "ma'lumot yo'q" deb tushunardi.
    const isDateRangeReversed =
        !!search?.from_date &&
        !!search?.to_date &&
        String(search.from_date) > String(search.to_date)

    // MR-02: standart oraliq joriy oy. Bazadagi ma'lumot undan oldin tugasa sahifa
    // bo'sh ochiladi va tizimda reys yo'qdek ko'rinadi. Sababini aytib qo'yamiz.
    const isEmptyForRange =
        !isLoading && !isDateRangeReversed && data?.count === 0

    const comboStyle = {
        className: "!bg-background dark:!bg-secondary min-w-44 justify-start",
    }

    return (
        <div className="space-y-3">
            <DataTable
                columns={columns ?? []}
                loading={isLoading}
                data={data?.results || []}
                numeration
                paginationProps={{
                    totalPages: data?.total_pages,
                    paramName: "page",
                    pageSizeParamName: "page_size",
                    page_sizes: [25, 50, 100, 250, 500, 1000],
                }}
                head={
                    <div className="space-y-3 mb-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg">Reyslar</h1>
                                <Badge>{formatMoney(data?.count ?? 0)}</Badge>
                            </div>

                            <div className="flex items-center justify-end gap-3 flex-wrap">
                                {/* MR-10: sahifada birorta qidiruv maydoni yo'q edi,
                                    holbuki backend `search_fields` ni qo'llab-quvvatlaydi
                                    (avto raqami, firma, yuklash/tushirish joyi). */}
                                <ParamInput
                                    className="!bg-background dark:!bg-secondary w-56"
                                    placeholder="Avto raqami, firma, joy..."
                                />

                                <ParamCombobox
                                    paramName="client"
                                    options={clientOptions}
                                    label="Firma nomi"
                                    addButtonProps={comboStyle}
                                />

                                <ParamCombobox
                                    paramName="loading"
                                    options={loadingOptions}
                                    label="Yuklash joyi"
                                    addButtonProps={comboStyle}
                                />

                                <ParamCombobox
                                    paramName="unloading"
                                    options={unloadingOptions}
                                    label="Tushirish joyi"
                                    addButtonProps={comboStyle}
                                />

                                <ParamCombobox
                                    paramName="cargo_type"
                                    options={cargoTypeOptions}
                                    label="Yuk turi"
                                    addButtonProps={comboStyle}
                                />

                                <ParamDateRange
                                    from="from_date"
                                    to="to_date"
                                    defaultValue={defaultDateRange}
                                    addButtonProps={{
                                        className:
                                            "!bg-background dark:!bg-secondary min-w-44 justify-start",
                                    }}
                                />

                                <Button
                                    icon={<Download width={16} />}
                                    onClick={openExcelModal}
                                >
                                    Excel
                                </Button>
                            </div>
                        </div>

                        {isDateRangeReversed && (
                            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:bg-amber-950/20">
                                <AlertTriangle
                                    size={16}
                                    className="mt-0.5 shrink-0 text-amber-600"
                                />
                                <div>
                                    <div className="font-medium">
                                        Sana oralig'i teskari
                                    </div>
                                    <div className="text-[12px] text-muted-foreground">
                                        Tugash sanasi ({String(search.to_date)})
                                        boshlanish sanasidan (
                                        {String(search.from_date)}) oldin. Shu
                                        sababli ro'yxat bo'sh — oraliqni to'g'rilang.
                                    </div>
                                </div>
                            </div>
                        )}

                        {isEmptyForRange && (
                            <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-sm">
                                <Info
                                    size={16}
                                    className="mt-0.5 shrink-0 text-muted-foreground"
                                />
                                <div className="text-[12px] text-muted-foreground">
                                    Tanlangan sana oralig'ida reys topilmadi. Sahifa
                                    standart ravishda joriy oyni ko'rsatadi — boshqa
                                    davrdagi reyslarni ko'rish uchun oraliqni
                                    kengaytiring.
                                </div>
                            </div>
                        )}
                    </div>
                }
            />

            <BuxgalteriyaExcelModal />
        </div>
    )
}
