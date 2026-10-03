import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import ParamTabs from "@/components/as-params/tabs"
import { formatMoney } from "@/lib/format-money"
import { formatDateTime } from "@/lib/format-date"
import { cn } from "@/lib/utils"
import { ColumnDef } from "@tanstack/react-table"
import { Plus, Truck, User } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { FormCombobox } from "@/components/form/combobox"
import { Combobox } from "@/components/ui/combobox"
import { FormNumberInput } from "@/components/form/number-input"
import { FormDatePicker } from "@/components/form/date-picker"
import FormTextarea from "@/components/form/textarea"
import FileUpload from "@/components/form/file-upload"
import { useModal } from "@/hooks/useModal"
import { useSearch } from "@tanstack/react-router"
import { toast } from "sonner"
import { useGet } from "@/hooks/useGet"
import { usePost } from "@/hooks/usePost"
import { usePatch } from "@/hooks/usePatch"
import { useGlobalStore } from "@/store/global-store"
import { DRIVER_SALARIES, MANAGERS_CASHFLOW, MANAGERS_CASHFLOW_CURRENCY, MANAGERS_CASHFLOW_DRIVER_STAT, MANAGERS_CASHFLOW_TRIP_STAT, MANAGERS_EXPENSE_CATEGORIES, MANAGERS_EXPENSES, MANAGERS_INCOMES, MANAGERS_ORDERS, MANAGERS_TRIPS, SETTINGS_EXPENSES, SETTINGS_PETROL_STATIONS, SETTINGS_REGIONS, SETTINTS_PAYMENT_TYPE } from "@/constants/api-endpoints"
import { useQueryClient } from "@tanstack/react-query"
import FormInput from "@/components/form/input"
import PendingAdvances from "./pending-advances"
import { ADVANCE_ACTION, ADVANCE_DELETE_MODAL, ADVANCE_EDIT_MODAL, ADVANCE_RETURN_MODAL, AdvanceChangeModals, AdvanceReturnModal, RowMarks, SALARY_REQUEST_MODAL, SalaryRequestModal } from "./row-extras"
import { useUser } from "@/constants/useUser"
import { useTranslation } from "react-i18next"
import { isWithinMoneyLimit } from "@/lib/money-limit"

// ──── Types ────

type FinanceRow = {
    id: number
    return_id?: number
    return_status?: number
    trip: number | null
    order: number | null
    loading_name: string | null
    unloading_name: string | null
    amount: number
    executor: number
    executor_name: string
    category: number
    category_name: string
    comment: string | null
    payment_type: number | null
    payment_type_name: string
    receipt: string | null
    quantity: string | null
    created: string
    updated: string
    currency: number
    currency_course: string | null
    petrol_station: number | null
    petrol_station_name: string | null
    added_after_close?: boolean
    action?: number
    category_code?: string | null
    history_count?: number
    pending_change?: { id: number; type: "edit" | "delete" | "return"; amount: number | null } | null
    advance?: number | null
    advance_spent?: number | null
    advance_left?: number | null
    advance_returned?: number | null
}

function formatAmount(row: FinanceRow) {
    if (row.currency === 2 && row.currency_course) {
        const usd = Number(row.amount)
        const uzs = usd * Number(row.currency_course)
        return <>{formatMoney(usd)} USD (={formatMoney(uzs)} UZS)</>
    }
    return formatMoney(row.amount)
}

type Category = {
    id?: number
    name: string
    amount?: number
    total_amount?: number
    total_amount_uzs?: string
    total_amount_usd?: string
    code?: string | null
}

// ──── Category tabs component ────

function CategoryTabs({
    categories,
    selectedId,
    onSelect,
    onAdd,
    prefix = "cat",
}: {
    categories: Category[]
    selectedId: number | null
    onSelect: (cat: Category) => void
    onAdd: () => void
    prefix?: string
}) {
    const { t } = useTranslation()
    return (
        <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar">
            {categories.map((cat, idx) => {
                const isActive = selectedId != null && selectedId === cat.id
                return (
                    <div
                        key={`${prefix}-${cat.id ?? idx}`}
                        onClick={() => onSelect(cat)}
                        className={cn(
                            "px-4 py-3 min-w-36 rounded-md text-center cursor-pointer transition-colors shrink-0",
                            isActive
                                ? "border-2 border-primary bg-primary/5"
                                : "border border-border hover:border-primary",
                        )}
                    >
                        <p className="text-sm">{cat.name}</p>
                        {cat.total_amount_uzs != null ? (
                            <div>
                                <p className="font-semibold">{formatMoney(cat.total_amount_uzs)} <span className="text-xs text-muted-foreground">UZS</span></p>
                                {Number(cat.total_amount_usd) > 0 && (
                                    <p className="font-semibold text-sm">{formatMoney(cat.total_amount_usd)} <span className="text-xs text-muted-foreground">USD</span></p>
                                )}
                            </div>
                        ) : (
                            <p className="font-semibold">{formatMoney(cat.total_amount ?? cat.amount ?? 0)}</p>
                        )}
                    </div>
                )
            })}
            <div
                onClick={onAdd}
                className={cn(
                    "px-2 py-3 min-w-20 border border-dashed border-primary rounded-md text-sm flex items-center justify-center cursor-pointer hover:bg-secondary shrink-0",
                )}
            >
                <Plus className="text-primary size-8" />
            </div>
        </div>
    )
}

// ──── Add category form ────

function AddCategoryForm({ flowType, modalKey = "add-category" }: { flowType: 1 | -1; modalKey?: string }) {
    const { t } = useTranslation()
    const { closeModal } = useModal(modalKey)
    const form = useForm<{ name: string }>()
    const { handleSubmit, control, reset } = form
    const { mutate, isPending } = usePost()
    const queryClient = useQueryClient()

    const onSubmit = (data: { name: string }) => {
        mutate(SETTINGS_EXPENSES, {
            name: data.name,
            type: 3, // TRIP
            flow_type: flowType,
        }, {
            onSuccess: () => {
                toast.success(t("toast.category_added"))
                queryClient.invalidateQueries({ queryKey: [MANAGERS_EXPENSE_CATEGORIES] })
                reset()
                closeModal()
            },
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormInput
                required
                methods={form}
                label={t("form.name")}
                name="name"
                placeholder={t("form.category_label")}
            />
            <Button className="w-full" type="submit" disabled={isPending}>
                {t("actions.save")}
            </Button>
        </form>
    )
}

// ──── Petrol station picker (used in fuel expense) ────

type PetrolStationOption = {
    id: number
    name: string
    address: string
    balance: string | number | null
}

function PetrolStationField({ control }: { control: any }) {
    const { t } = useTranslation()
    const { data } = useGet<ListResponse<PetrolStationOption>>(
        SETTINGS_PETROL_STATIONS,
        { params: { page_size: 1000 } },
    )
    const formatBalance = (n: number) =>
        Math.round(n)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    const options = useMemo(
        () =>
            (data?.results ?? []).map((p) => ({
                id: p.id,
                name: `${p.name} (Balans: ${formatBalance(Number(p.balance ?? 0))} so'm)`,
            })),
        [data],
    )
    return (
        <FormCombobox
            required
            control={control}
            label={t("nav.petrol")}
            name="petrol_station"
            options={options}
            valueKey="id"
            labelKey="name"
            placeholder={t("nav.petrol")}
        />
    )
}

// ──── Add finance form ────

function AddFinanceForm({
    type,
    categoryName,
    isFuel,
    tripId,
    selectedCategoryId,
    selectedCategoryCode,
    action,
    modalKey = "kirim-xarajat-add",
    defaultPaymentMethod,
    advanceId,
}: {
    advanceId?: number
    defaultPaymentMethod?: number
    modalKey?: string
    type: "tushum" | "xarajat"
    categoryName: string
    isFuel: boolean
    tripId?: number
    selectedCategoryId: number | null
    selectedCategoryCode: string | null
    action: 1 | -1
}) {
    const { t } = useTranslation()
    const { closeModal } = useModal(modalKey)
    const { getData, clearKey } = useGlobalStore()
    const queryClient = useQueryClient()
    const editItem = getData(MANAGERS_EXPENSES) as FinanceRow | undefined
    const isEdit = !!editItem?.id

    const isOrderCategory = type === "tushum" && selectedCategoryCode === "order"
    const isCodedExpense = type === "xarajat" && !!selectedCategoryCode
    const showOrderSelect = isOrderCategory || type === "xarajat"
    const orderRequired = isOrderCategory || isCodedExpense

    const form = useForm({
        defaultValues: {
            amount: editItem?.amount ?? "",
            quantity: editItem?.quantity ?? "",
            payment_type: editItem?.payment_type ?? "",
            comment: editItem?.comment ?? "",
            receipt: null as any,
            order: editItem?.order ?? "",
            currency: editItem?.currency ?? 1,
            currency_course: editItem?.currency_course ?? "",
            petrol_station: editItem?.petrol_station ?? "",
            from_region: (editItem as any)?.from_region ?? "",
            to_region: (editItem as any)?.to_region ?? "",
            deduct_from_balance: true,
        },
    })
    const { handleSubmit, control, reset, watch, setValue } = form
    const currency = watch("currency")

    const { data: currencyData } = useGet(MANAGERS_CASHFLOW_CURRENCY, {
        enabled: currency === 2,
        options: { staleTime: 0, gcTime: 0, refetchOnMount: "always" },
    })

    useEffect(() => {
        if (currency === 2 && currencyData?.currency_course && !isEdit) {
            setValue("currency_course", currencyData.currency_course)
        }
    }, [currency, currencyData, isEdit, setValue])

    const { data: paymentTypes } = useGet(SETTINTS_PAYMENT_TYPE, {
        params: { page_size: 1000000 },
    })
    useEffect(() => {
        if (isEdit || !defaultPaymentMethod) return
        const list = ((paymentTypes as any)?.results ?? paymentTypes ?? []) as { id: number; method?: number }[]
        const match = Array.isArray(list) ? list.find((x) => x.method === defaultPaymentMethod) : undefined
        if (match) setValue("payment_type", match.id as any)
    }, [paymentTypes, defaultPaymentMethod, isEdit, setValue])

    const { data: ordersData } = useGet<ListResponse<{ id: number; loading: number; unloading: number; loading_name: string; unloading_name: string; date?: string }>>(
        MANAGERS_ORDERS,
        { params: { trip: tripId, page_size: 100 }, enabled: showOrderSelect && !!tripId },
    )
    const orderOptions = useMemo(() =>
        (ordersData?.results ?? []).map((o) => ({
            ...o,
            label: `${o.date ? `${o.date} · ` : ""}${o.loading_name} → ${o.unloading_name}`,
        })),
        [ordersData],
    )

    const isSalaryExpense = type === "xarajat" && selectedCategoryCode === "salary"
    const selectedOrderId = watch("order")
    const fromRegion = watch("from_region")
    const toRegion = watch("to_region")
    const deductFromBalance = watch("deduct_from_balance")

    useEffect(() => {
        if (!isSalaryExpense || isEdit) return
        const ord = ordersData?.results?.find((o) => Number(o.id) === Number(selectedOrderId))
        if (ord) {
            setValue("from_region", ord.loading as any)
            setValue("to_region", ord.unloading as any)
        }
    }, [isSalaryExpense, isEdit, selectedOrderId, ordersData, setValue])

    const { data: salaryLookup } = useGet<ListResponse<any>>(
        DRIVER_SALARIES,
        {
            params: {
                from_region: fromRegion || undefined,
                to_region: toRegion || undefined,
                page_size: 1,
            },
            enabled: isSalaryExpense && !!fromRegion && !!toRegion,
        },
    )

    useEffect(() => {
        if (!isSalaryExpense || isEdit) return
        const cfg = salaryLookup?.results?.[0]
        const amt = cfg?.current_amount?.amount
        if (amt != null) {
            setValue("amount", amt as any)
        }
    }, [isSalaryExpense, isEdit, salaryLookup, setValue])

    const { data: regionsData } = useGet<ListResponse<{ id: number; name: string }>>(
        SETTINGS_REGIONS,
        { params: { page_size: 1000 }, enabled: isSalaryExpense },
    )
    const regionOptions = regionsData?.results ?? []

    useEffect(() => {
        if (!isSalaryExpense) return
        const targetMethod = deductFromBalance ? 1 : 3
        const match = (paymentTypes as any)?.results?.find(
            (p: any) => p.method === targetMethod,
        )
        if (match) setValue("payment_type", match.id as any)
    }, [isSalaryExpense, deductFromBalance, paymentTypes, setValue])

    
    const { mutate: postMutate, isPending: isPosting } = usePost()
    const { mutate: patchMutate, isPending: isPatching } = usePatch()
    const isPending = isPosting || isPatching

    useEffect(() => {
        if (editItem?.id) {
            reset({
                amount: editItem.amount ?? "",
                quantity: editItem.quantity ?? "",
                payment_type: editItem.payment_type ?? "",
                comment: editItem.comment ?? "",
                receipt: null,
                order: editItem.order ?? "",
                currency: editItem.currency ?? 1,
                currency_course: editItem.currency_course ?? "",
                petrol_station: editItem.petrol_station ?? "",
                from_region: (editItem as any).from_region ?? "",
                to_region: (editItem as any).to_region ?? "",
                deduct_from_balance: true,
            })
        } else {
            reset({
                amount: "",
                quantity: "",
                payment_type: "",
                comment: "",
                receipt: null,
                order: "",
                currency: 1,
                currency_course: "",
                petrol_station: "",
                from_region: "",
                to_region: "",
                deduct_from_balance: true,
            })
        }
    }, [editItem?.id, reset])

    const handleSuccess = () => {
        const msg = isEdit
            ? t("messages.success_edit")
            : t("messages.success_add")
        toast.success(msg)
        queryClient.invalidateQueries({
            predicate: (q) => String(q.queryKey[0]).includes("cashflow"),
        })
        queryClient.invalidateQueries({ queryKey: [MANAGERS_EXPENSE_CATEGORIES] })
        clearKey(MANAGERS_EXPENSES)
        reset()
        closeModal()
    }

    const onSubmit = (data: any) => {
        const fd = new FormData()

        if (tripId != null) fd.append("trip", String(tripId))
        fd.append("amount", String(data.amount))
        if (selectedCategoryId != null) fd.append("category", String(selectedCategoryId))
        fd.append("action", String(action))
        fd.append("currency", String(data.currency || 1))
        if (data.comment) fd.append("comment", data.comment)
        if (data.payment_type && !(isFuel && !isEdit)) fd.append("payment_type", String(data.payment_type))
        if (data.quantity) fd.append("quantity", String(data.quantity))
        if (data.currency === 2 && data.currency_course) fd.append("currency_course", String(data.currency_course))
        if (isFuel && data.petrol_station) fd.append("petrol_station", String(data.petrol_station))
        if (showOrderSelect && data.order) fd.append("order", String(data.order))
        if (data.receipt instanceof File) fd.append("receipt", data.receipt)
        if (advanceId && action === -1) fd.append("advance", String(advanceId))

        if (isEdit) {
            patchMutate(`${MANAGERS_EXPENSES}/${editItem.id}`, fd as any, {
                onSuccess: handleSuccess,
            })
        } else {
            postMutate(MANAGERS_CASHFLOW, fd as any, {
                onSuccess: handleSuccess,
            })
        }
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3 max-h-[75vh] overflow-y-auto pr-1 no-scrollbar-x"
        >
            {isFuel && (
                <>
                    <PetrolStationField control={control} />
                    <FormNumberInput
                        required
                        control={control}
                        label={`${t("form.quantity")} (litr)`}
                        name="quantity"
                        placeholder="Ex: 120.5"
                        decimalScale={2}
                    />
                </>
            )}
            <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                    <FormNumberInput
                        required
                        control={control}
                        label={t("form.amount")}
                        name="amount"
                        placeholder="Ex: 123 000"
                        thousandSeparator=" "
                        decimalScale={currency === 2 ? 2 : 0}
                        registerOptions={{
                            validate: (v) => isWithinMoneyLimit(v) || t("validation.max_amount"),
                        }}
                    />
                </div>
                <div className="w-32 shrink-0">
                    <FormCombobox
                        control={control}
                        label={t("form.currency")}
                        name="currency"
                        isClearIcon={false}
                        options={[
                            { id: 1, name: "UZS" },
                            { id: 2, name: "USD" },
                        ]}
                        valueKey="id"
                        labelKey="name"
                    />
                </div>
            </div>
            {currency === 2 && (
                <FormNumberInput
                    required
                    control={control}
                    label={t("form.currency_rate")}
                    name="currency_course"
                    placeholder="Ex: 12 000"
                    thousandSeparator=" "
                    decimalScale={0}
                />
            )}
                        {isSalaryExpense && (
                <div className="rounded-md border bg-muted/40 p-3 flex flex-col gap-2">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        Oylik (yo'nalish bo'yicha tariff)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <FormCombobox
                            control={control}
                            label={t("form.loading_location")}
                            name="from_region"
                            options={regionOptions}
                            valueKey="id"
                            labelKey="name"
                            placeholder={t("form.region")}
                        />
                        <FormCombobox
                            control={control}
                            label={t("form.unloading_location")}
                            name="to_region"
                            options={regionOptions}
                            valueKey="id"
                            labelKey="name"
                            placeholder={t("form.region")}
                        />
                    </div>
                    {salaryLookup?.results?.[0]?.current_amount?.amount ? (
                        <div className="text-[11px] text-emerald-600">
                            Sozlangan tariff: {formatMoney(salaryLookup.results[0].current_amount.amount)}
                        </div>
                    ) : fromRegion && toRegion ? (
                        <div className="text-[11px] text-amber-600">
                            Bu yo'nalish uchun tariff sozlanmagan
                        </div>
                    ) : null}
                    <label className="flex items-center gap-2 text-sm pt-1 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary"
                            checked={!!deductFromBalance}
                            onChange={(e) =>
                                setValue("deduct_from_balance", e.target.checked as any)
                            }
                        />
                        Haydovchi balansidan ayrilsinmi?
                    </label>
                    <div className="text-[11px] text-muted-foreground">
                        {deductFromBalance
                            ? "Naqd to'lov turi tanlanadi — haydovchi balansidan chiqim qilinadi."
                            : "Kassadan to'g'ridan-to'g'ri to'lov turi tanlanadi — driver balansiga ta'sir qilmaydi."}
                    </div>
                </div>
            )}
            {showOrderSelect && (
                <FormCombobox
                    required={orderRequired}
                    control={control}
                    label={orderRequired ? "Buyurtma" : "Buyurtma (ixtiyoriy)"}
                    name="order"
                    options={orderOptions}
                    valueKey="id"
                    labelKey="label"
                    placeholder={t("form.order_type")}
                />
            )}
            {!(isFuel && !isEdit) && (
                <FormCombobox
                    control={control}
                    label={t("form.payment_type")}
                    name="payment_type"
                    options={paymentTypes?.results ?? []}
                    valueKey="id"
                    labelKey="name"
                />
            )}
            <FormTextarea required label={t("form.comment")} methods={form} name="comment" />
            <FileUpload
                control={control}
                name="receipt"
                multiple={false}
                isPaste={true}
                hideClearable={true}
                label={t("form.receipt_optional")}
            />
            <Button className="w-full" type="submit" disabled={isPending}>
                {isPending ? t("messages.loading") : t("actions.save")}
            </Button>
        </form>
    )
}

// ──── Columns ────

const useIncomeCols = (opts?: { withCategory?: boolean }) => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<FinanceRow>[]>(
        () => [
            {
                header: t("table.loading"),
                accessorKey: "loading_name",
                cell: ({ row }) => row.original.order ? <span>{row.original.loading_name || "-"}</span> : null,
            },
            {
                header: t("table.unloading_short"),
                accessorKey: "unloading_name",
                cell: ({ row }) => row.original.order ? <span>{row.original.unloading_name || "-"}</span> : null,
            },
            ...(opts?.withCategory ? [{
                header: t("table.category"),
                accessorKey: "category_name",
                enableSorting: true,
                cell: ({ row }: { row: any }) => row.original.category_name || <span className="text-muted-foreground">—</span>,
            }] : []),
            {
                header: t("form.amount"),
                accessorKey: "amount",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="text-green-500 font-medium">
                        {formatAmount(row.original)}
                    </span>
                ),
            },
            { header: t("form.payment_type"), accessorKey: "payment_type_name", enableSorting: true },
            { header: t("form.comment"), accessorKey: "comment", enableSorting: true },
            {
                header: t("table.created_at"),
                accessorKey: "created",
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        {formatDateTime(row.original.created)}
                        <RowMarks row={row.original} />
                    </div>
                ),
            },
        ],
        [opts?.withCategory, t],
    )
}

const useExpenseCols = (opts?: { isFuel?: boolean; withCategory?: boolean }) => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<FinanceRow>[]>(
        () => [
            ...(opts?.withCategory ? [{
                header: t("table.category"),
                accessorKey: "category_name",
                enableSorting: true,
                cell: ({ row }: { row: any }) => row.original.category_name || <span className="text-muted-foreground">—</span>,
            }] : []),
            { header: t("form.comment"), accessorKey: "comment", enableSorting: true },
            {
                header: t("form.amount"),
                accessorKey: "amount",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="text-red-500 font-medium">
                        - {formatAmount(row.original)}
                    </span>
                ),
            },
            ...(opts?.isFuel ? [{
                header: t("form.quantity"),
                accessorKey: "quantity",
                enableSorting: true,
                cell: ({ row }: { row: any }) => {
                    const q = row.original.quantity
                    return q ? <span className="font-medium">{q}</span> : <span className="text-muted-foreground">—</span>
                },
            }] : []),
            { header: t("form.payment_type"), accessorKey: "payment_type_name", enableSorting: true },
            {
                header: t("table.created_at"),
                accessorKey: "created",
                enableSorting: true,
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        {formatDateTime(row.original.created)}
                        <RowMarks row={row.original} />
                        {row.original.added_after_close && (
                            <Badge variant="outline" className="border-amber-500 text-amber-600 whitespace-nowrap">
                                {t("page.added_after_close")}
                            </Badge>
                        )}
                    </div>
                ),
            },
        ],
        [opts?.isFuel, opts?.withCategory, t],
    )
}

// ──── Tab content components ────

function IncomeTab({ tripId, onCategoryChange, onCategoryIdChange, onCategoryCodeChange }: { tripId?: number; onCategoryChange: (name: string | null) => void; onCategoryIdChange: (id: number | null) => void; onCategoryCodeChange: (code: string | null) => void }) {
    const { t } = useTranslation()
    const { setData, clearKey } = useGlobalStore()
    const { openModal } = useModal("kirim-xarajat-add")
    const { openModal: openDeleteModal } = useModal(`${MANAGERS_EXPENSES}-delete`)
    const { openModal: openAddCategory } = useModal("add-category")

    const { data: categoriesData } = useGet<ListResponse<Category>>(
        MANAGERS_EXPENSE_CATEGORIES,
        { params: { page_size: 100000, action: 1, trip_id: tripId }, enabled: !!tripId },
    )
    const categories = categoriesData?.results ?? []
    const [selectedCatId, setSelectedCatId] = useState<number | null>(null)

    useEffect(() => {
        if (categories.length > 0 && !categories.some((c) => c.id === selectedCatId)) {
            const first = categories[0]
            setSelectedCatId(first.id ?? null)
            onCategoryChange(first.name)
            onCategoryIdChange(first.id ?? null)
            onCategoryCodeChange(first.code ?? null)
        }
    }, [categoriesData])

    const { data: expensesData } = useGet<ListResponse<FinanceRow>>(
        MANAGERS_CASHFLOW,
        {
            params: { trip: tripId, category: selectedCatId, action: 1, page_size: 100 },
            enabled: selectedCatId != null,
            options: { queryKey: [MANAGERS_CASHFLOW, "income", tripId, selectedCatId] },
        },
    )
    const rows = expensesData?.results ?? []

    const handleDelete = (item: FinanceRow) => {
        setData(MANAGERS_EXPENSES, item)
        openDeleteModal()
    }

    const columns = useIncomeCols()

    const handleSelect = (cat: Category) => {
        setSelectedCatId(cat.id ?? null)
        onCategoryChange(cat.name)
        onCategoryIdChange(cat.id ?? null)
        onCategoryCodeChange(cat.code ?? null)
    }

    const handleAdd = () => {
        clearKey(MANAGERS_EXPENSES)
        openModal()
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="shrink-0">
                <CategoryTabs
                    prefix="income"
                    categories={categories}
                    selectedId={selectedCatId}
                    onSelect={handleSelect}
                    onAdd={openAddCategory}
                />
            </div>
            <div className="mt-4 flex-1 overflow-y-auto min-h-0">
                <DataTable
                    columns={columns}
                    data={rows}
                    numeration
                    viewAll
                    onDelete={({ original }) => handleDelete(original)}
                    onEdit={({ original }) => { setData(MANAGERS_EXPENSES, original); openModal() }}
                    head={
                        <div className="flex mb-3 justify-between items-center gap-3">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl">{t("page.income_history")}</h1>
                                <Badge className="text-sm">{rows.length}</Badge>
                            </div>
                            <Button onClick={handleAdd}>
                                <Plus size={18} />
                                {t("page.add_income")}
                            </Button>
                        </div>
                    }
                />
            </div>
            <DeleteModal
                path={MANAGERS_INCOMES}
                id={useGlobalStore.getState().getData(MANAGERS_EXPENSES)?.id}
                modalKey={`${MANAGERS_EXPENSES}-delete`}
                refetchKeys={[MANAGERS_CASHFLOW, MANAGERS_EXPENSE_CATEGORIES]}
            />
            <Modal modalKey="add-category" title={`${t("actions.add")} ${t("table.category")}`} size="max-w-sm">
                <AddCategoryForm flowType={1} />
            </Modal>
        </div>
    )
}

function ExpenseTab({ tripId, onCategoryChange, onCategoryIdChange }: { tripId?: number; onCategoryChange: (name: string | null) => void; onCategoryIdChange: (id: number | null) => void }) {
    const { t } = useTranslation()
    const { setData, clearKey } = useGlobalStore()
    const { openModal } = useModal("kirim-xarajat-add")
    const { openModal: openDeleteModal } = useModal(`${MANAGERS_EXPENSES}-xarajat-delete`)
    const { openModal: openAddCategory } = useModal("add-category-expense")

    const { data: categoriesData } = useGet<ListResponse<Category>>(
        MANAGERS_EXPENSE_CATEGORIES,
        { params: { page_size: 100000, action: -1, trip_id: tripId }, enabled: !!tripId },
    )
    const categories = categoriesData?.results ?? []
    const [selectedCatId, setSelectedCatId] = useState<number | null>(null)

    useEffect(() => {
        if (categories.length > 0 && !categories.some((c) => c.id === selectedCatId)) {
            const first = categories[0]
            setSelectedCatId(first.id ?? null)
            onCategoryChange(first.name)
            onCategoryIdChange(first.id ?? null)
        }
    }, [categoriesData])

    const { data: expensesData } = useGet<ListResponse<FinanceRow>>(
        MANAGERS_CASHFLOW,
        {
            params: { trip: tripId, category: selectedCatId, action: -1, page_size: 100 },
            enabled: selectedCatId != null,
            options: { queryKey: [MANAGERS_CASHFLOW, "expense", tripId, selectedCatId] },
        },
    )
    const rows = expensesData?.results ?? []

    const handleDelete = (item: FinanceRow) => {
        setData(MANAGERS_EXPENSES, item)
        openDeleteModal()
    }

    const selectedCatName = categories.find((c) => c.id === selectedCatId)?.name ?? ""
    const isFuel = /yoqilg['ʻ']i|fuel|solyarka|metan|dizel|benzin/i.test(selectedCatName)
    const columns = useExpenseCols({ isFuel })

    const handleSelect = (cat: Category) => {
        setSelectedCatId(cat.id ?? null)
        onCategoryChange(cat.name)
        onCategoryIdChange(cat.id ?? null)
    }

    const handleAdd = () => {
        clearKey(MANAGERS_EXPENSES)
        openModal()
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="shrink-0">
                <CategoryTabs
                    prefix="expense"
                    categories={categories}
                    selectedId={selectedCatId}
                    onSelect={handleSelect}
                    onAdd={openAddCategory}
                />
            </div>
            <div className="mt-4 flex-1 overflow-y-auto min-h-0">
                <DataTable
                    columns={columns}
                    data={rows}
                    numeration
                    viewAll
                    onDelete={({ original }) => handleDelete(original)}
                    onEdit={({ original }) => { setData(MANAGERS_EXPENSES, original); openModal() }}
                    head={
                        <div className="flex mb-3 justify-between items-center gap-3">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl">{t("page.expense_history")}</h1>
                                <Badge className="text-sm">{rows.length}</Badge>
                            </div>
                            <Button onClick={handleAdd}>
                                <Plus size={18} />
                                {t("page.add_expense")}
                            </Button>
                        </div>
                    }
                />
            </div>
            <DeleteModal
                path={MANAGERS_EXPENSES}
                id={useGlobalStore.getState().getData(MANAGERS_EXPENSES)?.id}
                modalKey={`${MANAGERS_EXPENSES}-xarajat-delete`}
                refetchKeys={[MANAGERS_CASHFLOW, MANAGERS_EXPENSE_CATEGORIES]}
            />
            <Modal modalKey="add-category-expense" title={`${t("actions.add")} ${t("table.category")}`} size="max-w-sm">
                <AddCategoryForm flowType={-1} modalKey="add-category-expense" />
            </Modal>
        </div>
    )
}

// ──── Avans form ────

function AvansForm({ tripId }: { tripId?: number }) {
    const { t } = useTranslation()
    const { closeModal } = useModal("avans-berish")
    const form = useForm({ defaultValues: { amount: "", payment_type: "", comment: "", date: "", currency: 1, currency_course: "" } })
    const { handleSubmit, control, reset, watch, setValue } = form
    const { mutate, isPending } = usePost()
    const queryClient = useQueryClient()
    const currency = watch("currency")

    const { data: currencyData } = useGet(MANAGERS_CASHFLOW_CURRENCY, {
        enabled: currency === 2,
        options: { staleTime: 0, gcTime: 0, refetchOnMount: "always" },
    })

    useEffect(() => {
        if (currency === 2 && currencyData?.currency_course) {
            setValue("currency_course", currencyData.currency_course)
        }
    }, [currency, currencyData, setValue])

    const { data: paymentTypes } = useGet(SETTINTS_PAYMENT_TYPE, {
        params: { page_size: 1000000 },
    })

    const onSubmit = (data: any) => {
        mutate(MANAGERS_CASHFLOW, {
            trip: tripId ?? null,
            amount: Number(data.amount),
            payment_type: data.payment_type || null,
            comment: data.comment || null,
            date: data.date || null,
            action: 2,
            currency: data.currency || 1,
            currency_course: data.currency === 2 ? data.currency_course || null : null,
        }, {
            onSuccess: () => {
                toast.success(t("toast.advance_given"))
                queryClient.invalidateQueries({
                    predicate: (q) => {
                        const k = String(q.queryKey[0])
                        return k.includes("cashflow") || k.startsWith("checkout/kassa-v2") || k.startsWith(MANAGERS_TRIPS)
                    },
                })
                reset()
                closeModal()
            },
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                    <FormNumberInput
                        required
                        control={control}
                        label={t("form.amount")}
                        name="amount"
                        placeholder="Ex: 5 000 000"
                        thousandSeparator=" "
                        decimalScale={currency === 2 ? 2 : 0}
                        registerOptions={{
                            validate: (v) => isWithinMoneyLimit(v) || t("validation.max_amount"),
                        }}
                    />
                </div>
                <div className="w-32 shrink-0">
                    <FormCombobox
                        control={control}
                        label={t("form.currency")}
                        name="currency"
                        isClearIcon={false}
                        options={[
                            { id: 1, name: "UZS" },
                            { id: 2, name: "USD" },
                        ]}
                        valueKey="id"
                        labelKey="name"
                    />
                </div>
            </div>
            {currency === 2 && (
                <FormNumberInput
                    required
                    control={control}
                    label={t("form.currency_rate")}
                    name="currency_course"
                    placeholder="Ex: 12 000"
                    thousandSeparator=" "
                    decimalScale={0}
                />
            )}
            <FormCombobox
                control={control}
                required
                labelKey="name"
                valueKey="id"
                name="payment_type"
                options={paymentTypes?.results ?? []}
                label={t("form.payment_type")}
            />
            <FormDatePicker
                required
                label={t("form.date")}
                control={control}
                name="date"
            />
            <FormTextarea label={t("form.comment")} methods={form} name="comment" />
            <Button className="w-full" type="submit" disabled={isPending}>
                {isPending ? t("messages.loading") : t("actions.save")}
            </Button>
        </form>
    )
}

// ──── T hisob mode toggle ────

function ModeToggle({
    mode,
    onToggle,
}: {
    mode: "aylanma" | "haydovchi"
    onToggle: (mode: "aylanma" | "haydovchi") => void
}) {
    const { t } = useTranslation()
    const isHaydovchi = mode === "haydovchi"
    return (
        <div className="w-full max-w-sm mx-auto">
            <div className="flex items-center rounded-lg bg-muted p-1 relative">
                <div
                    className={cn(
                        "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md bg-background shadow-sm transition-all duration-300 ease-in-out pointer-events-none",
                        isHaydovchi ? "left-[calc(50%+2px)]" : "left-1",
                    )}
                />
                <button
                    onClick={() => onToggle("aylanma")}
                    className={cn(
                        "relative z-10 flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200",
                        !isHaydovchi
                            ? "text-primary"
                            : "text-muted-foreground",
                    )}
                >
                    <Truck size={16} />
                    {t("page.turnovers")}
                </button>
                <button
                    onClick={() => onToggle("haydovchi")}
                    className={cn(
                        "relative z-10 flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200",
                        isHaydovchi
                            ? "text-primary"
                            : "text-muted-foreground",
                    )}
                >
                    <User size={16} />
                    {t("nav.drivers")}
                </button>
            </div>
        </div>
    )
}

// ──── Summary card ────

function SummaryCard({
    label,
    amountUzs,
    amountUsd,
    variant,
    unitUzs = "UZS",
    active,
    onClick,
    sub,
}: {
    sub?: React.ReactNode
    label: string
    amountUzs: number
    amountUsd?: number
    variant: "income" | "expense" | "balance"
    unitUzs?: string
    active?: boolean
    onClick?: () => void
}) {
    return (
        <div
            onClick={onClick}
            role={onClick ? "button" : undefined}
            className={cn(
                "px-4 py-3 rounded-md border min-w-36 text-center",
                onClick && "cursor-pointer transition hover:brightness-110",
                active && "ring-2 ring-inset ring-primary",
                variant === "income" && "bg-green-500/10 border-transparent",
                variant === "expense" && "bg-red-600/10 border-transparent",
                variant === "balance" && "bg-primary/10 border-transparent",
            )}
        >
            <p className="text-sm text-muted-foreground">{label}</p>
            <p
                className={cn(
                    "font-semibold text-lg",
                    variant === "income" && "text-green-600",
                    variant === "expense" && "text-red-600",
                    variant === "balance" && "text-primary",
                )}
            >
                {formatMoney(amountUzs)}{unitUzs && <> <span className="text-xs text-muted-foreground">{unitUzs}</span></>}
                {sub && <span className="whitespace-nowrap"> · {sub}</span>}
            </p>
            {amountUsd != null && Number(amountUsd) > 0 && (
                <p
                    className={cn(
                        "font-semibold text-sm",
                        variant === "income" && "text-green-600",
                        variant === "expense" && "text-red-600",
                        variant === "balance" && "text-primary",
                    )}
                >
                    {formatMoney(amountUsd)} <span className="text-xs text-muted-foreground">USD</span>
                </p>
            )}
        </div>
    )
}

// ──── Returnable breakdown ────

// ──── Add from T hisob ────

function AddFromTAccount({ type, tripId, presetCategoryCode, defaultPaymentMethod, advanceId }: { type: "tushum" | "xarajat"; tripId?: number; presetCategoryCode?: string; defaultPaymentMethod?: number; advanceId?: number }) {
    const action: 1 | -1 = type === "xarajat" ? -1 : 1
    const { data: categoriesData } = useGet<ListResponse<Category>>(
        MANAGERS_EXPENSE_CATEGORIES,
        {
            params: { page_size: 100000, action, trip_id: tripId },
            enabled: !!tripId,
            options: { queryKey: [MANAGERS_EXPENSE_CATEGORIES, "t-hisob-add", action, tripId] },
        },
    )
    const categories = (categoriesData?.results ?? []).filter((c) => c.code !== "salary")
    const [catId, setCatId] = useState<number | null>(null)
    useEffect(() => {
        if (categories.length && !categories.some((c) => c.id === catId)) {
            const preset = presetCategoryCode ? categories.find((c) => c.code === presetCategoryCode) : undefined
            setCatId((preset ?? categories[0]).id ?? null)
        }
    }, [categoriesData, presetCategoryCode])
    const cat = categories.find((c) => c.id === catId)
    const isFuel = type === "xarajat" && (cat?.code === "fuel" || /yoqilg['ʻ']i|fuel|solyarka|metan|dizel|benzin/i.test(cat?.name ?? ""))

    return (
        <div className="flex flex-col gap-3">
            {!(presetCategoryCode && cat?.code === presetCategoryCode) && (
            <div className="flex flex-col gap-1.5 text-sm font-medium">
                {type === "xarajat" ? "Xarajat turi" : "Tushum turi"}
                <Combobox
                    label={type === "xarajat" ? "Xarajat turi" : "Tushum turi"}
                    options={categories}
                    value={catId}
                    setValue={(v: any) => v != null && v !== "" && setCatId(Number(v))}
                    labelKey="name"
                    valueKey="id"
                    isClearIcon={false}
                    isSearch={false}
                />
            </div>
            )}
            {cat && (
                <AddFinanceForm
                    key={`${type}-${cat.id}`}
                    modalKey="t-hisob-add"
                    type={type}
                    categoryName={cat.name}
                    isFuel={isFuel}
                    tripId={tripId}
                    selectedCategoryId={cat.id ?? null}
                    selectedCategoryCode={cat.code ?? null}
                    action={action}
                    defaultPaymentMethod={defaultPaymentMethod}
                    advanceId={advanceId}
                />
            )}
        </div>
    )
}

// ──── T hisob tab ────

function TAccountTab({ mode, onToggle, tripId, hideToggle }: { mode: "aylanma" | "haydovchi"; onToggle: (m: "aylanma" | "haydovchi") => void; tripId?: number; hideToggle?: boolean }) {
    const { t } = useTranslation()
    const { openModal: openAvansModal } = useModal("avans-berish")
    const { setData } = useGlobalStore()
    const { data: me } = useUser()
    const isKassaV2 = me?.kassa_mode === "driver_cash" && me?.kassa_version === 2
    const { openModal: openDeleteIncomeModal } = useModal(`${MANAGERS_INCOMES}-thisob-delete`)
    const { openModal: openDeleteExpenseModal } = useModal(`${MANAGERS_EXPENSES}-thisob-delete`)
    const { openModal: openAdvEdit } = useModal(ADVANCE_EDIT_MODAL)
    const { openModal: openAdvDelete } = useModal(ADVANCE_DELETE_MODAL)
    const { openModal: openRowEdit } = useModal("t-hisob-edit")
    const [advRow, setAdvRow] = useState<FinanceRow | null>(null)
    const [editRow, setEditRow] = useState<FinanceRow | null>(null)
    const [addType, setAddType] = useState<"tushum" | "xarajat">("tushum")
    const [addPreset, setAddPreset] = useState<{ category?: string; method?: number; advance?: number }>({})
    const [selectedAdvance, setSelectedAdvance] = useState<number | null>(null)
    const { openModal: openAdd } = useModal("t-hisob-add")
    const { openModal: openSalaryRequest } = useModal(SALARY_REQUEST_MODAL)
    const { openModal: openReturn } = useModal(ADVANCE_RETURN_MODAL)
    const { clearKey } = useGlobalStore()
    const startAdd = (type: "tushum" | "xarajat", preset: { category?: string; method?: number; advance?: number } = {}) => {
        clearKey(MANAGERS_EXPENSES)
        setAddType(type)
        setAddPreset(preset)
        openAdd()
    }
    const [filter, setFilter] = useState<"tushum" | "avans" | "zapravka" | "oylik">("avans")
    const { mutate: postReturnAction } = usePost({ meta: { skipGlobalError: true } })
    const { data: returnsData, refetch: refetchReturns } = useGet<{ results: { id: number; status: number; amount: string; comment: string | null; created: string; target_cash_flow?: number | null }[] }>(
        "checkout/kassa-v2/requests",
        { params: { trip: tripId, kind: "avans_qaytarish", status: "10,-10,20" }, enabled: !!tripId && !!hideToggle },
    )
    const returnRowsOf = (advanceId: number): FinanceRow[] =>
        (returnsData?.results ?? [])
            .filter((r) => r.target_cash_flow === advanceId)
            .map((r) => ({
                id: -r.id,
                return_id: r.id,
                return_status: r.status,
                action: 1,
                amount: Number(r.amount),
                category_name: "Qoldiq kassaga qaytarildi",
                comment: r.comment,
                payment_type_name: "Naqd",
                created: r.created,
            }) as unknown as FinanceRow)
    const returnRowAction = (row: FinanceRow, kind: "edit" | "delete") => {
        if (row.return_status === 20) return toast.info("Kassir qabul qilgan. Bekor qilish faqat kassir storno qilishi orqali")
        if (kind === "edit") return toast.info("Bekor qilib, qaytadan yuboring")
        postReturnAction(`checkout/kassa-v2/requests/${row.return_id}/cancel`, {}, {
            onSuccess: () => {
                toast.success("Qaytarish so'rovi bekor qilindi")
                refetchReturns()
            },
            onError: () => toast.error("Bekor qilib bo'lmadi"),
        })
    }
    const startEdit = (row: FinanceRow) => {
        if (row.return_id) return returnRowAction(row, "edit")
        if (row.action === ADVANCE_ACTION) {
            setAdvRow(row)
            openAdvEdit()
            return
        }
        setData(MANAGERS_EXPENSES, row)
        setEditRow(row)
        openRowEdit()
    }

    const handleDeleteIncome = (row: FinanceRow) => {
        setData(MANAGERS_INCOMES, row)
        openDeleteIncomeModal()
    }
    const handleDeleteExpense = (row: FinanceRow) => {
        setData(MANAGERS_EXPENSES, row)
        openDeleteExpenseModal()
    }

    // Trip statistic (aylanma mode)
    const { data: tripStat } = useGet(
        `${MANAGERS_CASHFLOW_TRIP_STAT}/${tripId}/statistic`,
        { enabled: mode === "aylanma" && !!tripId },
    )

    // Driver statistic (haydovchi mode)
    const { data: driverStat } = useGet(
        `${MANAGERS_CASHFLOW_DRIVER_STAT}/${tripId}/statistic`,
        { enabled: mode === "haydovchi" && !!tripId },
    )

    // Cashflow list for the two-column view
    const isDriver = mode === "haydovchi"
    const { data: incomeData } = useGet<ListResponse<FinanceRow>>(
        MANAGERS_CASHFLOW,
        {
            params: { trip: tripId, action: isDriver ? "1,2" : 1, page_size: 100000, ...(isDriver ? { driver: true } : {}) },
            enabled: !!tripId,
            options: { queryKey: [MANAGERS_CASHFLOW, "t-hisob-income", tripId, isDriver] },
        },
    )
    const { data: expenseData } = useGet<ListResponse<FinanceRow>>(
        MANAGERS_CASHFLOW,
        {
            params: { trip: tripId, action: -1, page_size: 100000, ...(isDriver ? { driver: true } : {}) },
            enabled: !!tripId,
            options: { queryKey: [MANAGERS_CASHFLOW, "t-hisob-expense", tripId, isDriver] },
        },
    )

    const incomeRows = incomeData?.results ?? []
    const { data: allExpenseData } = useGet<ListResponse<FinanceRow>>(
        MANAGERS_CASHFLOW,
        {
            params: { trip: tripId, action: -1, page_size: 100000 },
            enabled: !!tripId && !!hideToggle,
            options: { queryKey: [MANAGERS_CASHFLOW, "t-hisob-all-expense", tripId] },
        },
    )
    const sumOf = (rows: FinanceRow[]) => rows.reduce((a, r) => a + Number(r.amount || 0), 0)
    const avansSum = sumOf(incomeRows.filter((r) => r.action === ADVANCE_ACTION))
    const allExpenses = allExpenseData?.results ?? []
    const transferFuelSum = sumOf(allExpenses.filter((r) => r.category_code === "fuel" && /o.?tkaz/i.test(r.payment_type_name ?? "")))
    const salarySum = sumOf(allExpenses.filter((r) => r.category_code === "salary"))
    const expenseRows = expenseData?.results ?? []

    const incomeCols = useIncomeCols({ withCategory: true })
    const mixedCols = useMemo<ColumnDef<FinanceRow>[]>(
        () => [
            {
                header: "Summa",
                accessorKey: "amount",
                cell: ({ row }) => {
                    const out = row.original.action === -1
                    return (
                        <span className={cn("font-medium whitespace-nowrap", out ? "text-red-500" : "text-green-600")}>
                            {out ? "− " : "+ "}{formatAmount(row.original)}
                        </span>
                    )
                },
            },
            {
                header: "Nima uchun",
                accessorKey: "category_name",
                cell: ({ row }) => row.original.category_name || (row.original.action === ADVANCE_ACTION ? (row.original.comment?.toLowerCase().includes("qo'shimcha") ? "Qo'shimcha pul" : "Avans") : "—"),
            },
            {
                header: "Reys",
                id: "route",
                cell: ({ row }) => row.original.order ? `${row.original.loading_name ?? ""} → ${row.original.unloading_name ?? ""}` : "—",
            },
            { header: "Izoh", accessorKey: "comment", cell: ({ row }) => <span className="text-muted-foreground">{row.original.comment || "—"}</span> },
            { header: "To'lov turi", accessorKey: "payment_type_name", cell: ({ row }) => row.original.payment_type_name || "—" },
            {
                header: "Sana",
                accessorKey: "created",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        {formatDateTime(row.original.created)}
                        {row.original.return_id ?
                            <Badge variant={(row.original.return_status === 20 ? "default" : row.original.return_status === -10 ? "destructive" : "orange") as any} className="w-fit whitespace-nowrap">
                                {row.original.return_status === 20 ? "Qaytarildi" : row.original.return_status === -10 ? "Rad etildi" : "Kassir tasdig'i kutilmoqda"}
                            </Badge>
                        :   <RowMarks row={row.original} />}
                    </div>
                ),
            },
        ],
        [],
    )
    const expenseCols = useExpenseCols({ withCategory: true })

    const moliyaTrip = useGlobalStore.getState().getData(`${MANAGERS_TRIPS}-moliya`) as any
    const fuelKind = String(moliyaTrip?.fuel_type ?? moliyaTrip?.vehicle_fuel ?? "").toLowerCase()
    const fuelUnit = fuelKind.includes("methane") || fuelKind.includes("metan") ? "m³" : "litr"
    const stat = mode === "aylanma" ? tripStat : driverStat
    const incomeUzs = Number(stat?.income_uzs ?? 0)
    const incomeUsd = Number(stat?.income_usd ?? 0)
    const expenseUzs = Number(stat?.expense_uzs ?? 0)
    const expenseUsd = Number(stat?.expense_usd ?? 0)
    const balanceUzs = incomeUzs - expenseUzs
    const balanceUsd = incomeUsd - expenseUsd

    return (
        <div className="flex flex-col h-full overflow-hidden gap-4">
            <div className="shrink-0 flex flex-col gap-3">
                {/* Mode switch */}
                {!hideToggle && <ModeToggle mode={mode} onToggle={onToggle} />}

                {/* Summary row */}
                <div className="flex items-center justify-between gap-3">
                    <div className={cn("flex items-stretch gap-3 overflow-x-auto no-scrollbar", hideToggle && "flex-1")}>
                        {hideToggle ?
                            <>
                                <SummaryCard label="Avans" amountUzs={avansSum} variant="expense" active={filter === "avans"} onClick={() => setFilter("avans")} />
                                <SummaryCard label="Zapravka (pul o'tkazish)" amountUzs={transferFuelSum} variant="expense" active={filter === "zapravka"} onClick={() => setFilter("zapravka")} />
                                <SummaryCard label="Oylik" amountUzs={salarySum} variant="expense" active={filter === "oylik"} onClick={() => setFilter("oylik")} />
                                <SummaryCard label="Tushum reys" amountUzs={incomeUzs - avansSum} variant="income" active={filter === "tushum"} onClick={() => setFilter("tushum")} />
                            </>
                        :   <SummaryCard label={t("page.all_income")} amountUzs={incomeUzs} amountUsd={incomeUsd} variant="income" />}
                        {hideToggle ? null
                        :   <SummaryCard label={t("page.all_expense")} amountUzs={expenseUzs} amountUsd={expenseUsd} variant="expense" />}
                        {hideToggle && <div className="ml-auto" />}
                        <SummaryCard label={mode === "haydovchi" ? t("form.balance") : t("table.profit")} amountUzs={balanceUzs} amountUsd={balanceUsd} variant="balance" />
                        {mode === "haydovchi" && driverStat && (
                            <>
                                <SummaryCard
                                    label="Bakdagi yoqilg'i"
                                    amountUzs={Number(driverStat.return_fuel_amount_uzs ?? 0)}
                                    amountUsd={Number(driverStat.return_fuel_amount_usd ?? 0)}
                                    variant="balance"
                                    sub={Number(driverStat.return_fuel ?? 0) > 0 ? <>{formatMoney(Number(driverStat.return_fuel))} {fuelUnit}</> : undefined}
                                />
                            </>
                        )}
                    </div>
                    {mode === "haydovchi" && !hideToggle && (
                        <Button
                            onClick={() => openAvansModal()}
                            variant="outline"
                            className="gap-1.5 shrink-0"
                        >
                            <Plus size={16} />
                            {isKassaV2 ? "Avans berish" : t("actions.give_advance")}
                        </Button>
                    )}
                </div>
            </div>

            {hideToggle ? (() => {
                const byDate = (rows: FinanceRow[]) => [...rows].sort((x, y) => String(y.created).localeCompare(String(x.created)))
                const isTransferFuel = (r: FinanceRow) => r.category_code === "fuel" && /o.?tkaz/i.test(r.payment_type_name ?? "")
                if (filter === "avans") {
                    const advances = byDate(incomeRows.filter((r) => r.action === ADVANCE_ACTION))
                    const spentOf = (a: FinanceRow) =>
                        a.advance_spent != null ? Number(a.advance_spent) : sumOf((allExpenses.length ? allExpenses : expenseRows).filter((e) => e.advance === a.id))
                    const returnedOf = (a: FinanceRow) => Number(a.advance_returned ?? 0)
                    const leftOf = (a: FinanceRow) =>
                        a.advance_left != null ? Number(a.advance_left) : Number(a.amount) - spentOf(a) - returnedOf(a)
                    const advanceCols: ColumnDef<FinanceRow>[] = [
                        { header: "Summa", accessorKey: "amount", cell: ({ row }) => <span className="font-medium whitespace-nowrap text-red-500">− {formatAmount(row.original)}</span> },
                        { header: "Nima uchun", id: "kind", cell: ({ row }) => (row.original.comment?.toLowerCase().includes("qo'shimcha") ? "Qo'shimcha pul" : "Avans") },
                        { header: "Ishlatildi", id: "spent", cell: ({ row }) => <span className="text-red-500 whitespace-nowrap">{formatMoney(spentOf(row.original))}</span> },
                        {
                            header: "Qoldi",
                            id: "left",
                            cell: ({ row }) => {
                                const left = leftOf(row.original)
                                return <span className={cn("font-medium whitespace-nowrap", left < 0 ? "text-red-500" : "text-primary")}>{formatMoney(left)}</span>
                            },
                        },
                        { header: "Izoh", accessorKey: "comment", cell: ({ row }) => <span className="text-muted-foreground">{row.original.comment || "—"}</span> },
                        {
                            header: "Sana",
                            accessorKey: "created",
                            cell: ({ row }) => (
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    {formatDateTime(row.original.created)}
                                    <RowMarks row={row.original} />
                                </div>
                            ),
                        },
                    ]
                    const sel = advances.find((a) => a.id === selectedAdvance)
                    const deleteRow = (original: FinanceRow) => {
                        if (original.return_id) return returnRowAction(original, "delete")
                        if (original.action === ADVANCE_ACTION) {
                            setAdvRow(original)
                            openAdvDelete()
                            return
                        }
                        handleDeleteExpense(original)
                    }
                    if (sel) {
                        const linked = byDate([...(allExpenses.length ? allExpenses : expenseRows).filter((e) => e.advance === sel.id), ...returnRowsOf(sel.id)])
                        const left = leftOf(sel)
                        return (
                            <div className="flex-1 min-h-0 overflow-y-auto">
                                <DataTable
                                    columns={mixedCols}
                                    data={linked}
                                    numeration
                                    viewAll
                                    onEdit={({ original }) => startEdit(original)}
                                    onDelete={({ original }) => deleteRow(original)}
                                    head={
                                        <>
                                        <div className="flex flex-wrap mb-3 items-center gap-3">
                                            <Badge className="gap-1.5 cursor-pointer text-sm" onClick={() => setSelectedAdvance(null)}>
                                                {sel.comment?.toLowerCase().includes("qo'shimcha") ? "Qo'shimcha pul" : "Avans"} · {formatDateTime(sel.created)} ✕
                                            </Badge>
                                            <div className="ml-auto flex items-center gap-2">
                                                <Button size="sm" variant="outline" className="gap-1" onClick={() => openReturn()}>
                                                    Qoldiqni qaytarish
                                                </Button>
                                                <Button size="sm" className="gap-1" onClick={() => startAdd("xarajat", { advance: sel.id })}>
                                                    <Plus size={16} />
                                                    Chiqim qo'shish
                                                </Button>
                                            </div>
                                        </div>
                                        <AdvanceReturnModal advanceId={sel.id} left={left} />
                                        </>
                                    }
                                />
                            </div>
                        )
                    }
                    return (
                        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4">
                            <DataTable
                                columns={advanceCols}
                                data={advances}
                                numeration
                                viewAll
                                onRowClick={(row: FinanceRow) => setSelectedAdvance(row.id)}
                                onEdit={({ original }) => startEdit(original)}
                                onDelete={({ original }) => deleteRow(original)}
                                head={
                                    <>
                                        <div className="flex mb-3 items-center gap-3">
                                            <h1 className="text-lg font-semibold">Avanslar</h1>
                                            <Badge className="text-sm">{advances.length}</Badge>
                                            <span className="text-xs text-muted-foreground">Avans ustiga bosing — undan qilingan xarajatlar ochiladi</span>
                                            <div className="ml-auto">
                                                <Button size="sm" className="gap-1" onClick={() => openAvansModal()}><Plus size={16} />Avans berish</Button>
                                            </div>
                                        </div>
                                        <PendingAdvances tripId={tripId} />
                                    </>
                                }
                            />
                        </div>
                    )
                }
                const rows =
                    filter === "tushum" ? incomeRows.filter((r) => r.action === 1)
                    : filter === "zapravka" ? allExpenses.filter(isTransferFuel)
                    : allExpenses.filter((r) => r.category_code === "salary")
                const title = { tushum: "Tushum", avans: "Avans va undan qilingan naqd xarajatlar", zapravka: "Zapravka (pul o'tkazish)", oylik: "Oylik" }[filter]
                const actions =
                    filter === "tushum" ?
                        <Button size="sm" className="gap-1" onClick={() => startAdd("tushum")}><Plus size={16} />Tushum qo'shish</Button>
                    : filter === "zapravka" ?
                        <Button size="sm" className="gap-1" onClick={() => startAdd("xarajat", { category: "fuel", method: 3 })}><Plus size={16} />Yoqilg'i quyish</Button>
                    :   <Button size="sm" className="gap-1" onClick={() => openSalaryRequest()}><Plus size={16} />Oylik so'rash</Button>
                return (
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        <DataTable
                            columns={mixedCols}
                            data={rows}
                            numeration
                            viewAll
                            onEdit={({ original }) => startEdit(original)}
                            onDelete={({ original }) => {
                                if (original.action === ADVANCE_ACTION) {
                                    setAdvRow(original)
                                    openAdvDelete()
                                    return
                                }
                                if (original.action === 1) handleDeleteIncome(original)
                                else handleDeleteExpense(original)
                            }}
                            head={
                                <>
                                    <div className="flex mb-3 items-center gap-3">
                                        <h1 className="text-lg font-semibold">{title}</h1>
                                        <Badge className="text-sm">{rows.length}</Badge>
                                        <div className="ml-auto flex items-center gap-2">{actions}</div>
                                    </div>
                                </>
                            }
                        />
                    </div>
                )
            })() : (
            <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 overflow-hidden">
                <div className="overflow-y-auto min-h-0">
                    <DataTable
                        columns={incomeCols}
                        data={incomeRows}
                        numeration
                        viewAll
                        onDelete={({ original }) => {
                            if (original.action === ADVANCE_ACTION) {
                                setAdvRow(original)
                                openAdvDelete()
                                return
                            }
                            handleDeleteIncome(original)
                        }}
                        onEdit={({ original }) => startEdit(original)}
                        head={
                            <>
                                <div className="flex mb-3 items-center gap-3">
                                    <h1 className="text-xl text-green-600">{t("form.income")}</h1>
                                    <Badge className="text-sm">{incomeRows.length}</Badge>
                                    <Button size="sm" className="ml-auto gap-1" onClick={() => startAdd("tushum")}>
                                        <Plus size={16} />
                                        Tushum qo'shish
                                    </Button>
                                </div>
                                {isDriver && <PendingAdvances tripId={tripId} />}
                            </>
                        }
                    />
                </div>
                <div className="overflow-y-auto min-h-0">
                    <DataTable
                        columns={expenseCols}
                        data={expenseRows}
                        numeration
                        viewAll
                        onDelete={({ original }) => handleDeleteExpense(original)}
                        onEdit={({ original }) => startEdit(original)}
                        head={
                            <div className="flex mb-3 items-center gap-3">
                                <h1 className="text-xl text-red-600">{t("form.expense")}</h1>
                                <Badge className="text-sm">{expenseRows.length}</Badge>
                                <Button size="sm" className="ml-auto gap-1" onClick={() => startAdd("xarajat")}>
                                    <Plus size={16} />
                                    Chiqim qo'shish
                                </Button>
                            </div>
                        }
                    />
                </div>
            </div>
            )}

            <AdvanceChangeModals row={advRow} />
            <Modal modalKey="t-hisob-add" title={addType === "xarajat" ? (addPreset.category === "fuel" ? "Yoqilg'i quyish" : "Chiqim qo'shish") : "Tushum qo'shish"} size="max-w-md">
                <AddFromTAccount type={addType} tripId={tripId} presetCategoryCode={addPreset.category} defaultPaymentMethod={addPreset.method} advanceId={addPreset.advance} />
            </Modal>
            <SalaryRequestModal tripId={tripId} driverId={moliyaTrip?.driver} />
            <Modal
                modalKey="t-hisob-edit"
                title={editRow?.action === -1 ? "Xarajatni tahrirlash" : "Kirimni tahrirlash"}
                size="max-w-md"
            >
                {editRow && (
                    <AddFinanceForm
                        modalKey="t-hisob-edit"
                        advanceId={editRow.advance ?? undefined}
                        type={editRow.action === -1 ? "xarajat" : "tushum"}
                        categoryName={editRow.category_name ?? ""}
                        isFuel={editRow.category_code === "fuel"}
                        tripId={tripId}
                        selectedCategoryId={editRow.category ?? null}
                        selectedCategoryCode={editRow.category_code ?? null}
                        action={editRow.action === -1 ? -1 : 1}
                    />
                )}
            </Modal>
            <Modal modalKey="avans-berish" title={isKassaV2 ? "Avans berish (kassirga so'rov)" : t("actions.give_advance")} size="max-w-md">
                <AvansForm tripId={tripId} />
            </Modal>
            <DeleteModal
                path={MANAGERS_INCOMES}
                id={useGlobalStore.getState().getData(MANAGERS_INCOMES)?.id}
                modalKey={`${MANAGERS_INCOMES}-thisob-delete`}
                refetchKeys={[
                    MANAGERS_CASHFLOW,
                    MANAGERS_EXPENSE_CATEGORIES,
                    `${MANAGERS_CASHFLOW_TRIP_STAT}/${tripId}/statistic`,
                    `${MANAGERS_CASHFLOW_DRIVER_STAT}/${tripId}/statistic`,
                ]}
            />
            <DeleteModal
                path={MANAGERS_EXPENSES}
                id={useGlobalStore.getState().getData(MANAGERS_EXPENSES)?.id}
                modalKey={`${MANAGERS_EXPENSES}-thisob-delete`}
                refetchKeys={[
                    MANAGERS_CASHFLOW,
                    MANAGERS_EXPENSE_CATEGORIES,
                    `${MANAGERS_CASHFLOW_TRIP_STAT}/${tripId}/statistic`,
                    `${MANAGERS_CASHFLOW_DRIVER_STAT}/${tripId}/statistic`,
                ]}
            />
        </div>
    )
}

// ──── Main export ────

export default function KirimXarajatContent() {
    const { t } = useTranslation()
    const { getData } = useGlobalStore()
    const search = useSearch({ strict: false }) as any
    const tripItem = getData(`${MANAGERS_TRIPS}-moliya`)
    const tripId = tripItem?.id ?? search.moliya_trip_id

    const initialTab = (search.moliya_tab as string) || "tushum"
    const [currentType, setCurrentType] = useState<"tushum" | "xarajat" | "t_hisob">(initialTab as any)
    const [tAccountMode, setTAccountMode] = useState<"aylanma" | "haydovchi">("aylanma")
    const [selectedCategoryName, setSelectedCategoryName] = useState<string>("")
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
    const [selectedCategoryCode, setSelectedCategoryCode] = useState<string | null>(null)

    const isFuel = currentType === "xarajat" && /yoqilg['ʻ']i|fuel|solyarka|metan|dizel|benzin/i.test(selectedCategoryName)
    const action: 1 | -1 = currentType === "xarajat" ? -1 : 1

    const handleCategoryChange = (name: string | null) => {
        setSelectedCategoryName(name ?? "")
    }

    const handleCategoryIdChange = (id: number | null) => {
        setSelectedCategoryId(id)
    }

    const handleCategoryCodeChange = (code: string | null) => {
        setSelectedCategoryCode(code)
    }

    const { data: me } = useUser()
    if (me?.kassa_mode === "driver_cash" && me?.kassa_version === 2) {
        return (
            <div className="flex flex-col h-full overflow-hidden gap-3">
                <div className="h-7 shrink-0" aria-hidden />
                <TAccountTab mode="haydovchi" onToggle={() => {}} tripId={tripId} hideToggle />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full overflow-hidden [&>div]:flex [&>div]:flex-col [&>div]:flex-1 [&>div]:min-h-0 [&>div>div[role=tabpanel]]:flex-1 [&>div>div[role=tabpanel]]:min-h-0">
            <ParamTabs
                paramName="moliya_tab"
                className="shrink-0"
                onValueChange={(val) => {
                    setCurrentType(val as "tushum" | "xarajat" | "t_hisob")
                    setSelectedCategoryName("")
                    setSelectedCategoryId(null)
                    setSelectedCategoryCode(null)
                }}
                options={[
                    {
                        value: "tushum",
                        label: t("page.income_list"),
                        content: <IncomeTab tripId={tripId} onCategoryChange={handleCategoryChange} onCategoryIdChange={handleCategoryIdChange} onCategoryCodeChange={handleCategoryCodeChange} />,
                    },
                    {
                        value: "xarajat",
                        label: t("page.expense_list"),
                        content: <ExpenseTab tripId={tripId} onCategoryChange={handleCategoryChange} onCategoryIdChange={handleCategoryIdChange} />,
                    },
                    {
                        value: "t_hisob",
                        label: "T hisob",
                        content: <TAccountTab mode={tAccountMode} onToggle={setTAccountMode} tripId={tripId} />,
                    },
                ]}
            />

            <Modal
                modalKey="kirim-xarajat-add"
                title={currentType === "tushum" ? t("page.add_income") : t("page.add_expense")}
                size="max-w-md"
            >
                <AddFinanceForm
                    type={currentType as "tushum" | "xarajat"}
                    categoryName={selectedCategoryName}
                    isFuel={isFuel}
                    tripId={tripId}
                    selectedCategoryId={selectedCategoryId}
                    selectedCategoryCode={selectedCategoryCode}
                    action={action as 1 | -1}
                />
            </Modal>
        </div>
    )
}
