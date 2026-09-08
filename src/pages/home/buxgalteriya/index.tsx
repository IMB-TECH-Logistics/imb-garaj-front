import Modal from "@/components/custom/modal"
import { DataTable } from "@/components/ui/datatable"
import { MANAGERS_RUNS } from "@/constants/api-endpoints"
import { useRunFilterOptions } from "./loading-options"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useSearch } from "@tanstack/react-router"
import ParamDateRange from "@/components/as-params/date-picker-range"
import { ParamCombobox } from "@/components/as-params/combobox"
import { useAccountingCols, ReysOrder } from "./cols"
import EditReysModal from "./edit-reys"
import BuxgalteriyaExcelModal, {
    useBuxgalteriyaExcelModal,
} from "./excel-modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatSom } from "@/lib/money-format"
import { queryErrorHint, queryErrorMessage } from "@/lib/query-state"
import { CalendarClock, Download } from "lucide-react"

/** BX-12: jami summalar butun filtrlangan to'plam bo'yicha backendda hisoblanishi kerak
 *  (backend-kerak/F1.md). Javobda `totals` kelgan zahoti kartalar avtomatik ko'rinadi. */
type RunTotals = {
    summa_s_nds?: string | number
    naqd_amount?: string | number
    our_share?: string | number
}

const shiftMonth = (iso: string | undefined, months: number) => {
    if (!iso) return undefined
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return undefined
    d.setMonth(d.getMonth() + months)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const BuxgalteriyaPage = () => {
    const search: any = useSearch({ strict: false })
    const navigate = useNavigate()
    const { setData } = useGlobalStore()
    const { openModal } = useModal("edit-reys")
    const { openModal: openExcelModal } = useBuxgalteriyaExcelModal()

    const currentDate = new Date()
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const defaultDateRange =
        !search?.from_date && !search?.to_date
            ? { from: startOfMonth, to: endOfMonth }
            : undefined

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

    const { data, isLoading, isError, error } = useGet<
        ListResponse<ReysOrder> & { totals?: RunTotals }
    >(MANAGERS_RUNS, {
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
            // BX-02: saralash server tomonda bajarilishi kerak. Backend `ordering`
            // ni qo'llab-quvvatlagach (backend-kerak/F1.md) bu parametr ishlay
            // boshlaydi; DataTable tomonidagi manualSorting ulanishi umumiy
            // komponent (components/ui/datatable.tsx) zimmasida.
            ordering: search?.ordering,
        },
    })

    const totals = data?.totals
    // BX-01: sahifa doim joriy oy bilan ochiladi, ma'lumot esa oldingi oyda tugagan —
    // natijada modul "bo'sh" ko'rinadi va foydalanuvchi ma'lumot yo'q deb o'ylaydi.
    const emptyForRange =
        !isLoading &&
        !isError &&
        (data?.count ?? 0) === 0 &&
        Boolean(search?.from_date || search?.to_date)

    const goPreviousMonth = () => {
        navigate({
            search: {
                ...search,
                from_date: shiftMonth(search?.from_date, -1),
                to_date: shiftMonth(search?.to_date, -1),
                page: undefined,
            } as any,
        })
    }

    const columns = useAccountingCols()

    const comboStyle = {
        className: "!bg-background dark:!bg-secondary min-w-44 justify-start",
    }

    const handleEdit = (row: { original: ReysOrder }) => {
        setData(MANAGERS_RUNS, row.original)
        openModal()
    }

    return (
        <div className="space-y-3">
            {emptyForRange && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
                    <CalendarClock className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>
                        Tanlangan sana oralig'ida ({search?.from_date ?? "…"} —{" "}
                        {search?.to_date ?? "…"}) reys topilmadi. Ma'lumot yo'q
                        emas — sana oralig'ini kengaytiring.
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={goPreviousMonth}
                        className="ml-auto"
                    >
                        Oldingi oyni ko'rish
                    </Button>
                </div>
            )}

            {/* YANGI-04: so'rov yiqilsa kartalar "0 so'm" ko'rsatmasin —
                nol summa bilan "ma'lumot berilmadi" bir xil narsa emas. */}
            {isError && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
                    <p className="font-medium text-amber-600 dark:text-amber-500">
                        {queryErrorMessage(error)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {queryErrorHint(error)}
                    </p>
                </div>
            )}

            {totals && !isError && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <TotalCard
                        label="Jami Summa S NDS"
                        value={totals.summa_s_nds}
                    />
                    <TotalCard label="Jami Naqd" value={totals.naqd_amount} />
                    <TotalCard
                        label="Jami Bizning ulush"
                        value={totals.our_share}
                    />
                </div>
            )}

            <DataTable
                columns={columns}
                loading={isLoading}
                error={isError ? error : undefined}
                data={data?.results || []}
                numeration
                onEdit={handleEdit}
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
                                <Badge>{data?.count ?? 0}</Badge>
                            </div>
                            <div className="flex items-center justify-end gap-3 flex-wrap">
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
                                    className: "!bg-background dark:!bg-secondary min-w-44 justify-start",
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
                    </div>
                }
            />

            {/* YANGI-10: `description` berilishi DialogContent'ga
                `aria-describedby` qo'shadi — ekran o'quvchi uchun ham, konsoldagi
                takroriy "Missing Description for {DialogContent}" ogohlantirishi
                uchun ham shu kerak edi. */}
            <Modal
                modalKey="edit-reys"
                title="Reys tahrirlash"
                description="Tanlangan reysning summasi, foizi va naqd qiymatini o'zgartirish"
                size="max-w-4xl"
            >
                <EditReysModal />
            </Modal>

            <BuxgalteriyaExcelModal />
        </div>
    )
}

const TotalCard = ({
    label,
    value,
}: {
    label: string
    value: string | number | undefined
}) => (
    <div className="rounded-lg border bg-card px-4 py-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">
            {formatSom(Number(value ?? 0))} so'm
        </p>
        <p className="text-[10px] text-muted-foreground/80">
            Filtrlangan barcha sahifalar bo'yicha
        </p>
    </div>
)

export default BuxgalteriyaPage
