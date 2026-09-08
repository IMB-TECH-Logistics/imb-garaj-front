import ParamDateRange from "@/components/as-params/date-picker-range"
import DownloadAsExcel from "@/components/download-as-excel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ParamCombobox } from "@/components/as-params/combobox"
import { CHECKOUT_MAIN, DRIVERS_BALANCE, TRANSACTIONS } from "@/constants/api-endpoints"
import Modal from "@/components/custom/modal"
import CheckoutAdjustModal from "./adjust-modal"
import StornoModal, { STORNO_MODAL_KEY } from "./storno-modal"
import { useTransactionCols, type Transaction } from "./transaction-cols"
import { useGet } from "@/hooks/useGet"
import { useHasAction, useUser } from "@/constants/useUser"
import PermissionNotice from "../permission-notice"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useModal } from "@/hooks/useModal"
import { Plus, Undo2, X } from "lucide-react"
import { useMemo, useState } from "react"

type DriverRow = {
    id?: number
    full_name: string
    balance: string
}

const KassaInner = () => {
    const hasControl = useHasAction("manager_cashflow_control")
    const transactionCols = useTransactionCols()
    const navigate = useNavigate()
    const { openModal: openTopUp } = useModal("checkout-top-up")
    const { openModal: openExpense } = useModal("checkout-expense")
    const { openModal: openStorno } = useModal(STORNO_MODAL_KEY)
    const [stornoRow, setStornoRow] = useState<Transaction | null>(null)
    const search = useSearch({ strict: false }) as any
    const { data: checkout } = useGet<{ id: number; name: string; balance: string }>(CHECKOUT_MAIN)
    const { data: driversData } = useGet<DriverRow[]>(DRIVERS_BALANCE)
    const { data: vehiclesData } = useGet<{ id: number; name: string }[]>(
        "selectable/vehicle",
        { params: { model_name: "vehicle" } },
    )
    const vehicles = vehiclesData ?? []
    const driverFilterId = search.driver ? Number(search.driver) : null
    const typeFilter: "all" | "1" | "-1" =
        search.type === "1" || search.type === "-1" ? search.type : "all"
    const currencyFilter: "all" | "1" | "2" =
        search.currency === "1" || search.currency === "2" ? search.currency : "all"
    const filterParams = {
        page: search.page,
        page_size: search.page_size,
        from_date: search.from_date,
        to_date: search.to_date,
        driver: search.driver,
        vehicle: search.vehicle,
        search: search.tx_search,
        type: typeFilter === "all" ? undefined : Number(typeFilter),
        currency: currencyFilter === "all" ? undefined : Number(currencyFilter),
        // KT-13: saralash server tomonda (backend `ordering_fields`:
        // id, amount, created, type, currency, through, status, executor_name).
        ordering: search.ordering,
    }
    const {
        data: transactionsData,
        isLoading: transactionsLoading,
        error: transactionsError,
    } = useGet<ListResponse<Transaction>>(TRANSACTIONS, { params: filterParams })
    const drivers = driversData ?? []
    const selectedDriver = useMemo(
        () =>
            driverFilterId != null
                ? drivers.find((d) => d.id === driverFilterId)
                : null,
        [drivers, driverFilterId],
    )

    const pageTotals = useMemo(() => {
        const rows = transactionsData?.results ?? []
        return rows.reduce(
            (acc, t) => {
                const amount = Number(t.amount) || 0
                if (t.type === -1) acc.expense += amount
                else acc.income += amount
                return acc
            },
            { income: 0, expense: 0 },
        )
    }, [transactionsData?.results])

    const driversTotal = useMemo(
        () =>
            drivers.reduce(
                (sum, d) => sum + Number(d.balance || 0),
                0,
            ),
        [drivers],
    )

    const handleDriverClick = (driver: DriverRow) => {
        if (!driver.id) return
        const next = driverFilterId === driver.id ? undefined : driver.id
        navigate({
            search: { ...search, driver: next, page: undefined } as any,
        })
    }

    const clearDriverFilter = () => {
        navigate({ search: { ...search, driver: undefined } as any })
    }

    const handleTypeChange = (val: string) => {
        navigate({
            search: {
                ...search,
                type: val === "all" ? undefined : val,
                page: undefined,
            } as any,
        })
    }

    const handleCurrencyChange = (val: string) => {
        navigate({
            search: {
                ...search,
                currency: val === "all" ? undefined : val,
                page: undefined,
            } as any,
        })
    }

    return (
        <div className="flex md:flex-row flex-col w-full gap-3 md:h-[calc(100svh-7.5rem)] md:min-h-0 md:overflow-hidden">
            {/* Left sidebar */}
            <div className="md:max-w-sm md:min-w-sm w-full md:h-full shrink-0">
                <Card className="bg-muted/60 md:h-full flex flex-col overflow-hidden">
                    <CardHeader className="space-y-0 shrink-0">
                        <CardTitle className="font-medium text-lg">
                            Asosiy Balans
                        </CardTitle>
                        <span>
                            <span className="text-xl font-semibold">
                                {formatMoney(Number(checkout?.balance ?? 0))}
                            </span>{" "}
                            <span className="text-base">so'm</span>
                        </span>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3 flex-1 min-h-0 flex flex-col">
                        {hasControl && (
                            <div className="gap-3 flex items-center justify-between shrink-0">
                                <Button
                                    variant="destructive"
                                    type="button"
                                    className="w-full"
                                    onClick={openExpense}
                                >
                                    <Plus size={20} />
                                    Chiqim
                                </Button>
                                <Button
                                    type="button"
                                    className="w-full"
                                    onClick={openTopUp}
                                >
                                    <Plus size={20} />
                                    Balans To'ldirish
                                </Button>
                            </div>
                        )}

                        <div className="border-t pt-3 shrink-0">
                            <p className="text-sm text-muted-foreground">
                                Haydovchilar balansi
                            </p>
                            <p className="text-xl font-semibold mt-0.5">
                                {formatMoney(driversTotal)} so'm
                            </p>
                        </div>

                        <div className="border-t pt-3 flex-1 min-h-0 flex flex-col">
                            <p className="text-sm font-medium text-muted-foreground mb-2 shrink-0">
                                Batafsil
                            </p>
                            <div className="space-y-1 flex-1 min-h-0 overflow-y-auto pr-1">
                                {drivers.map((driver, i) => {
                                    const isActive =
                                        driverFilterId === driver.id
                                    return (
                                        <div
                                            key={driver.id}
                                            onClick={() =>
                                                handleDriverClick(driver)
                                            }
                                            className={cn(
                                                "flex items-center justify-between py-1.5 px-2 rounded-md transition-colors cursor-pointer",
                                                isActive
                                                    ? "bg-primary/10 text-primary"
                                                    : "hover:bg-muted/80",
                                            )}
                                        >
                                            <span className="text-sm flex items-center gap-2 min-w-0 flex-1">
                                                <span className="text-xs text-muted-foreground w-4 text-right shrink-0">
                                                    {i + 1}
                                                </span>
                                                <span className="truncate">
                                                    {driver.full_name}
                                                </span>
                                            </span>
                                            <span className="text-sm font-medium shrink-0 pl-3">
                                                {formatMoney(Number(driver.balance ?? 0))}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right table */}
            <div className="w-full min-w-0 md:h-full min-h-0">
                <DataTable
                    numeration
                    loading={transactionsLoading}
                    error={transactionsError}
                    /**
                     * KT-24: jadvalda birorta amal tugmasi yo'q edi — xato
                     * yozuvni tuzatib bo'lmasdi. O'chirish emas, STORNO
                     * (teskari yozuv) qo'shiladi. Faqat kassaning o'z
                     * yozuvi (`through === "checkout"`) so'ndiriladi: reys
                     * yoki buyurtmaga bog'langan yozuv o'z bo'limidan
                     * o'chiriladi (backend ham shuni talab qiladi).
                     */
                    rowAction={(tx) =>
                        hasControl &&
                        tx.through === "checkout" &&
                        !tx.is_reversed &&
                        !tx.reversal_of ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                title="So'ndirish (storno)"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setStornoRow(tx)
                                    openStorno()
                                }}
                            >
                                <Undo2 size={16} />
                            </Button>
                        ) : null
                    }
                    columns={transactionCols}
                    data={transactionsData?.results}
                    /**
                     * YANGI-03 (regressiya): qator raqami 4 xonali bo'lganda
                     * (69-sahifada 1701) № va Summa ustunlari bir-biriga tegib
                     * ketardi — "17011 265 000". Sabab: `datatable.tsx` № ustuniga
                     * qat'iy `w-8` (32px) beradi va jadval `table-layout: fixed`.
                     * O'sha fayl boshqa agent zonasida, shuning uchun kenglik shu
                     * yerdan kengaytiriladi. Bir vaqtning o'zida № sarlavhasidagi
                     * yolg'on `cursor-pointer` ham olib tashlanadi (MT-12) —
                     * u hech qachon saralamagan.
                     */
                    wrapperClassName={cn(
                        "md:h-full flex flex-col",
                        "[&_thead_th:first-child]:!w-16 [&_tbody_td:first-child]:!w-16",
                        "[&_thead_th:first-child]:!cursor-default",
                    )}
                    tableWrapperClassName="flex-1 min-h-0 overflow-auto"
                    paginationProps={{
                        totalPages: transactionsData?.total_pages,
                        paramName: "page",
                        pageSizeParamName: "page_size",
                    }}
                    head={
                        <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg">Kassa yozuvlari</h1>
                                <Badge>
                                    {(transactionsData?.count ?? 0).toLocaleString(
                                        "ru-RU",
                                    )}{" "}
                                    ta
                                </Badge>
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <span className="text-emerald-600 dark:text-emerald-500">
                                        Kirim {formatMoney(pageTotals.income)}
                                    </span>
                                    <span className="text-rose-600 dark:text-rose-500">
                                        Chiqim {formatMoney(pageTotals.expense)}
                                    </span>
                                    <span className="text-xs">
                                        (shu sahifada)
                                    </span>
                                </span>
                                {selectedDriver && (
                                    <Badge
                                        variant="outline"
                                        className="gap-1 pr-1"
                                    >
                                        Haydovchi: {selectedDriver.full_name}
                                        <button
                                            type="button"
                                            onClick={clearDriverFilter}
                                            className="ml-1 p-0.5 rounded hover:bg-muted"
                                            aria-label="Filterni tozalash"
                                        >
                                            <X size={12} />
                                        </button>
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <ParamCombobox
                                    paramName="vehicle"
                                    options={vehicles}
                                    label="Avtomobil"
                                    addButtonProps={{
                                        className: "!bg-background dark:!bg-secondary min-w-40 justify-start",
                                    }}
                                />
                                <Tabs
                                    value={currencyFilter}
                                    onValueChange={handleCurrencyChange}
                                >
                                    <TabsList className="h-9">
                                        <TabsTrigger value="all">
                                            UZS+USD
                                        </TabsTrigger>
                                        <TabsTrigger value="1">UZS</TabsTrigger>
                                        <TabsTrigger value="2">USD</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <Tabs
                                    value={typeFilter}
                                    onValueChange={handleTypeChange}
                                >
                                    <TabsList className="h-9">
                                        <TabsTrigger value="all">
                                            Hammasi
                                        </TabsTrigger>
                                        <TabsTrigger value="1">
                                            Tushum
                                        </TabsTrigger>
                                        <TabsTrigger value="-1">
                                            Chiqim
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <ParamDateRange
                                    from="from_date"
                                    to="to_date"
                                />
                                <DownloadAsExcel
                                    url={`${TRANSACTIONS}/excel`}
                                    name="Kassa"
                                    params={filterParams}
                                />
                            </div>
                        </div>
                    }
                />
            </div>

            <Modal
                modalKey="checkout-top-up"
                title="Balans to'ldirish"
                size="max-w-md"
            >
                <CheckoutAdjustModal
                    modalKey="checkout-top-up"
                    kind="income"
                />
            </Modal>
            <Modal
                modalKey="checkout-expense"
                title="Chiqim qo'shish"
                size="max-w-md"
            >
                <CheckoutAdjustModal
                    modalKey="checkout-expense"
                    kind="expense"
                />
            </Modal>

            <StornoModal row={stornoRow} />
        </div>
    )
}

/**
 * Ruxsat to'sig'i (2-raund, RBAC yangi Low-4).
 *
 * Ilgari ruxsati yo'q rol `/kassa` ni URL orqali ochganda backend hamma
 * so'rovga 403 qaytarar, sahifa esa "Asosiy Balans 0 so'm" va "Haydovchilar
 * balansi 0 so'm" deb chizardi. NOL — ma'lumot, ya'ni yolg'on javob:
 * foydalanuvchi kassada pul yo'q deb tushunadi. Endi holat ochiq aytiladi.
 */
const Kassa = () => {
    const { data: profile, isLoading } = useUser()
    const hasView = useHasAction([
        "manager_cashflow_view",
        "accounting_view",
        "finance_view",
    ])

    if (isLoading || !profile) return null

    if (!hasView) {
        return (
            <PermissionNotice
                title="Kassani ko'rishga ruxsatingiz yo'q"
                hint="Bu bo'lim pul reyestri va balanslarni ko'rsatadi. Kerak bo'lsa administratordan «Kassa — ko'rish» ruxsatini so'rang."
            />
        )
    }

    return <KassaInner />
}

export default Kassa
