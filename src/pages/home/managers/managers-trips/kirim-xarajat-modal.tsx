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
import { ArrowLeftRight, Plus, SquarePen, Trash2, Truck, User } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { FormCombobox } from "@/components/form/combobox"
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
import { MANAGERS_CASHFLOW, MANAGERS_CASHFLOW_DRIVER_STAT, MANAGERS_CASHFLOW_TRIP_STAT, MANAGERS_EXPENSE_CATEGORIES, MANAGERS_EXPENSES, MANAGERS_ORDERS, MANAGERS_TRIPS, SETTINGS_EXPENSES, SETTINTS_PAYMENT_TYPE } from "@/constants/api-endpoints"
import { useQueryClient } from "@tanstack/react-query"
import FormInput from "@/components/form/input"

// ──── Types ────

type FinanceRow = {
    id: number
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
}

type Category = {
    id?: number
    name: string
    amount?: number
    total_amount?: number
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
                        <p className="font-semibold">{formatMoney(cat.total_amount ?? cat.amount ?? 0)}</p>
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
                toast.success("Kategoriya muvaffaqiyatli qo'shildi")
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
                label="Nomi"
                name="name"
                placeholder="Kategoriya nomi"
            />
            <Button className="w-full" type="submit" disabled={isPending}>
                Saqlash
            </Button>
        </form>
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
}: {
    type: "tushum" | "xarajat"
    categoryName: string
    isFuel: boolean
    tripId?: number
    selectedCategoryId: number | null
    selectedCategoryCode: string | null
    action: 1 | -1
}) {
    const { closeModal } = useModal("kirim-xarajat-add")
    const { getData, clearKey } = useGlobalStore()
    const queryClient = useQueryClient()
    const editItem = getData(MANAGERS_EXPENSES) as FinanceRow | undefined
    const isEdit = !!editItem?.id

    const isOrderCategory = type === "tushum" && selectedCategoryCode === "order"

    const form = useForm({
        defaultValues: {
            amount: editItem?.amount ?? "",
            quantity: editItem?.quantity ?? "",
            payment_type: editItem?.payment_type ?? "",
            comment: editItem?.comment ?? "",
            receipt: null as any,
            order: editItem?.order ?? "",
        },
    })
    const { handleSubmit, control, reset } = form

    const { data: paymentTypes } = useGet(SETTINTS_PAYMENT_TYPE, {
        params: { page_size: 100000 },
    })

    const { data: ordersData } = useGet<ListResponse<{ id: number; loading_name: string; unloading_name: string }>>(
        MANAGERS_ORDERS,
        { params: { trip: tripId, page_size: 100 }, enabled: isOrderCategory && !!tripId },
    )
    const orderOptions = useMemo(() =>
        (ordersData?.results ?? []).map((o) => ({
            ...o,
            label: `${o.loading_name} → ${o.unloading_name}`,
        })),
        [ordersData],
    )

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
            })
        } else {
            reset({
                amount: "",
                quantity: "",
                payment_type: "",
                comment: "",
                receipt: null,
                order: "",
            })
        }
    }, [editItem?.id, reset])

    const handleSuccess = () => {
        const msg = isEdit
            ? "Muvaffaqiyatli yangilandi"
            : type === "tushum"
                ? "Tushum muvaffaqiyatli qo'shildi"
                : "Xarajat muvaffaqiyatli qo'shildi"
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
        const payload: Record<string, any> = {
            trip: tripId ?? null,
            amount: Number(data.amount),
            category: selectedCategoryId,
            comment: data.comment || null,
            payment_type: data.payment_type || null,
            quantity: data.quantity ? String(data.quantity) : null,
            action,
        }
        if (isOrderCategory && data.order) {
            payload.order = data.order
        }

        if (isEdit) {
            patchMutate(`${MANAGERS_EXPENSES}/${editItem.id}`, payload, {
                onSuccess: handleSuccess,
            })
        } else {
            postMutate(MANAGERS_CASHFLOW, payload, {
                onSuccess: handleSuccess,
            })
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormNumberInput
                required
                control={control}
                label="Summa"
                name="amount"
                placeholder="Ex: 123 000"
                thousandSeparator=" "
                decimalScale={0}
            />
            {isOrderCategory && (
                <FormCombobox
                    required
                    control={control}
                    label="Buyurtma"
                    name="order"
                    options={orderOptions}
                    valueKey="id"
                    labelKey="label"
                    placeholder="Buyurtmani tanlang"
                />
            )}
            {isFuel && (
                <FormNumberInput
                    required
                    control={control}
                    label="Miqdori (litr)"
                    name="quantity"
                    placeholder="Ex: 120.5"
                    decimalScale={2}
                />
            )}
            <FormCombobox
                control={control}
                label="To'lov turi"
                name="payment_type"
                options={paymentTypes?.results ?? []}
                valueKey="id"
                labelKey="name"
            />
            <FormTextarea required label="Izoh" methods={form} name="comment" />
            <FileUpload
                control={control}
                name="receipt"
                multiple={false}
                isPaste={false}
                hideClearable={true}
                label="Chek (ixtiyoriy)"
            />
            <Button className="w-full" type="submit" disabled={isPending}>
                {isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
        </form>
    )
}

// ──── Columns ────

const useIncomeCols = (opts?: { onEdit?: (item: FinanceRow) => void; onDelete?: (item: FinanceRow) => void }) => {
    return useMemo<ColumnDef<FinanceRow>[]>(
        () => [
            { header: "Izoh", accessorKey: "comment", enableSorting: true },
            {
                header: "Yuklash",
                accessorKey: "loading_name",
                cell: ({ row }) => row.original.order ? <span>{row.original.loading_name || "-"}</span> : null,
            },
            {
                header: "Tushirish",
                accessorKey: "unloading_name",
                cell: ({ row }) => row.original.order ? <span>{row.original.unloading_name || "-"}</span> : null,
            },
            {
                header: "Summa",
                accessorKey: "amount",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="text-green-500 font-medium">
                        {formatMoney(row.original.amount)}
                    </span>
                ),
            },
            { header: "To'lov turi", accessorKey: "payment_type_name", enableSorting: true },
            { header: "Ma'sul", accessorKey: "executor_name", enableSorting: true },
            { header: "Yaratilgan sana", accessorKey: "created", enableSorting: true, cell: ({ row }) => formatDateTime(row.original.created) },
            {
                id: "actions",
                header: " ",
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <Button
                            icon={<SquarePen className="text-primary" size={14} />}
                            size="sm"
                            variant="ghost"
                            className="p-0 h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); opts?.onEdit?.(row.original) }}
                        />
                        <Button
                            icon={<Trash2 className="text-red-500" size={14} />}
                            size="sm"
                            variant="ghost"
                            className="p-0 h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); opts?.onDelete?.(row.original) }}
                        />
                    </div>
                ),
            },
        ],
        [opts?.onEdit, opts?.onDelete],
    )
}

const useExpenseCols = (opts?: { onEdit?: (item: FinanceRow) => void; onDelete?: (item: FinanceRow) => void; isFuel?: boolean }) => {
    return useMemo<ColumnDef<FinanceRow>[]>(
        () => [
            { header: "Izoh", accessorKey: "comment", enableSorting: true },
            {
                header: "Summa",
                accessorKey: "amount",
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="text-red-500 font-medium">
                        - {formatMoney(row.original.amount)}
                    </span>
                ),
            },
            ...(opts?.isFuel ? [{
                header: "Miqdori (litr)",
                accessorKey: "quantity",
                enableSorting: true,
                cell: ({ row }: { row: any }) => {
                    const q = row.original.quantity
                    return q ? <span className="font-medium">{q}</span> : <span className="text-muted-foreground">—</span>
                },
            }] : []),
            { header: "To'lov turi", accessorKey: "payment_type_name", enableSorting: true },
            { header: "Ma'sul", accessorKey: "executor_name", enableSorting: true },
            { header: "Yaratilgan sana", accessorKey: "created", enableSorting: true, cell: ({ row }) => formatDateTime(row.original.created) },
            {
                id: "actions",
                header: " ",
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <Button
                            icon={<SquarePen className="text-primary" size={14} />}
                            size="sm"
                            variant="ghost"
                            className="p-0 h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); opts?.onEdit?.(row.original) }}
                        />
                        <Button
                            icon={<Trash2 className="text-red-500" size={14} />}
                            size="sm"
                            variant="ghost"
                            className="p-0 h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); opts?.onDelete?.(row.original) }}
                        />
                    </div>
                ),
            },
        ],
        [opts?.onEdit, opts?.onDelete, opts?.isFuel],
    )
}

// ──── Tab content components ────

function IncomeTab({ tripId, onCategoryChange, onCategoryIdChange, onCategoryCodeChange }: { tripId?: number; onCategoryChange: (name: string | null) => void; onCategoryIdChange: (id: number | null) => void; onCategoryCodeChange: (code: string | null) => void }) {
    const { setData, clearKey } = useGlobalStore()
    const { openModal } = useModal("kirim-xarajat-add")
    const { openModal: openDeleteModal } = useModal(`${MANAGERS_EXPENSES}-delete`)
    const { openModal: openAddCategory } = useModal("add-category")

    const { data: categoriesData } = useGet<ListResponse<Category>>(
        MANAGERS_EXPENSE_CATEGORIES,
        { params: { page_size: 100, action: 1, trip_id: tripId }, enabled: !!tripId },
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

    const handleEdit = (item: FinanceRow) => {
        setData(MANAGERS_EXPENSES, item)
        openModal()
    }
    const handleDelete = (item: FinanceRow) => {
        setData(MANAGERS_EXPENSES, item)
        openDeleteModal()
    }

    const columns = useIncomeCols({ onEdit: handleEdit, onDelete: handleDelete })

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
                    head={
                        <div className="flex mb-3 justify-between items-center gap-3">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl">Tushum tarixi</h1>
                                <Badge className="text-sm">{rows.length}</Badge>
                            </div>
                            <Button onClick={handleAdd}>
                                <Plus size={18} />
                                Tushum qo'shish
                            </Button>
                        </div>
                    }
                    paginationProps={{ totalPages: expensesData?.total_pages }}
                />
            </div>
            <DeleteModal
                path={MANAGERS_EXPENSES}
                id={useGlobalStore.getState().getData(MANAGERS_EXPENSES)?.id}
                modalKey={`${MANAGERS_EXPENSES}-delete`}
                refetchKeys={[MANAGERS_CASHFLOW]}
            />
            <Modal modalKey="add-category" title="Kategoriya qo'shish" size="max-w-sm">
                <AddCategoryForm flowType={1} />
            </Modal>
        </div>
    )
}

function ExpenseTab({ tripId, onCategoryChange, onCategoryIdChange }: { tripId?: number; onCategoryChange: (name: string | null) => void; onCategoryIdChange: (id: number | null) => void }) {
    const { setData, clearKey } = useGlobalStore()
    const { openModal } = useModal("kirim-xarajat-add")
    const { openModal: openDeleteModal } = useModal(`${MANAGERS_EXPENSES}-xarajat-delete`)
    const { openModal: openAddCategory } = useModal("add-category-expense")

    const { data: categoriesData } = useGet<ListResponse<Category>>(
        MANAGERS_EXPENSE_CATEGORIES,
        { params: { page_size: 100, action: -1, trip_id: tripId }, enabled: !!tripId },
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

    const handleEdit = (item: FinanceRow) => {
        setData(MANAGERS_EXPENSES, item)
        openModal()
    }
    const handleDelete = (item: FinanceRow) => {
        setData(MANAGERS_EXPENSES, item)
        openDeleteModal()
    }

    const selectedCatName = categories.find((c) => c.id === selectedCatId)?.name ?? ""
    const isFuel = /yoqilg['ʻ']i|fuel|solyarka|metan|dizel|benzin/i.test(selectedCatName)
    const columns = useExpenseCols({ onEdit: handleEdit, onDelete: handleDelete, isFuel })

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
                    head={
                        <div className="flex mb-3 justify-between items-center gap-3">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl">Xarajatlar tarixi</h1>
                                <Badge className="text-sm">{rows.length}</Badge>
                            </div>
                            <Button onClick={handleAdd}>
                                <Plus size={18} />
                                Xarajat qo'shish
                            </Button>
                        </div>
                    }
                    paginationProps={{ totalPages: expensesData?.total_pages }}
                />
            </div>
            <DeleteModal
                path={MANAGERS_EXPENSES}
                id={useGlobalStore.getState().getData(MANAGERS_EXPENSES)?.id}
                modalKey={`${MANAGERS_EXPENSES}-xarajat-delete`}
                refetchKeys={[MANAGERS_CASHFLOW]}
            />
            <Modal modalKey="add-category-expense" title="Kategoriya qo'shish" size="max-w-sm">
                <AddCategoryForm flowType={-1} modalKey="add-category-expense" />
            </Modal>
        </div>
    )
}

// ──── T hisob (T accounting) types & data ────

type TAccountRow = {
    id: number
    description: string
    amount: number
    type: "kirim" | "chiqim"
    payment_method: "naqd" | "plastik" | "perechisleniya" | "solyarka"
    date: string
    visible_to_driver: boolean
    visible_to_company: boolean
}



const paymentMethodLabels: Record<TAccountRow["payment_method"], string> = {
    naqd: "Naqd",
    plastik: "Plastik",
    perechisleniya: "Perechisleniya",
    solyarka: "Solyarka",
}

// ──── Avans form ────

function AvansForm({ tripId }: { tripId?: number }) {
    const { closeModal } = useModal("avans-berish")
    const form = useForm()
    const { handleSubmit, control, reset } = form
    const { mutate, isPending } = usePost()
    const queryClient = useQueryClient()

    const { data: paymentTypes } = useGet(SETTINTS_PAYMENT_TYPE, {
        params: { page_size: 100000 },
    })

    const onSubmit = (data: any) => {
        mutate(MANAGERS_CASHFLOW, {
            trip: tripId ?? null,
            amount: Number(data.amount),
            payment_type: data.payment_type || null,
            comment: data.comment || null,
            date: data.date || null,
            action: 2,
        }, {
            onSuccess: () => {
                toast.success("Avans muvaffaqiyatli berildi")
                queryClient.invalidateQueries({
                    predicate: (q) => String(q.queryKey[0]).includes("cashflow"),
                })
                reset()
                closeModal()
            },
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormNumberInput
                required
                control={control}
                label="Summa"
                name="amount"
                placeholder="Ex: 5 000 000"
                thousandSeparator=" "
                decimalScale={0}
            />
            <FormCombobox
                control={control}
                required
                labelKey="name"
                valueKey="id"
                name="payment_type"
                options={paymentTypes?.results ?? []}
                label="To'lov turi"
            />
            <FormDatePicker
                required
                label="Sana"
                control={control}
                name="date"
            />
            <FormTextarea label="Izoh" methods={form} name="comment" />
            <Button className="w-full" type="submit" disabled={isPending}>
                {isPending ? "Saqlanmoqda..." : "Saqlash"}
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
                    Aylanmalar
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
                    Haydovchilar
                </button>
            </div>
        </div>
    )
}

// ──── Summary card ────

function SummaryCard({
    label,
    amount,
    variant,
}: {
    label: string
    amount: number
    variant: "income" | "expense" | "balance"
}) {
    return (
        <div
            className={cn(
                "px-4 py-3 rounded-md border min-w-36 text-center",
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
                {formatMoney(amount)}
            </p>
        </div>
    )
}

// ──── Returnable breakdown ────

function ReturnableBreakdown({
    data,
}: {
    data: { label: string; amount: number }[]
}) {
    return (
        <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar">
            {data.map((item) => (
                <div
                    key={item.label}
                    className="px-4 py-2 rounded-md bg-orange-100 dark:bg-orange-900/40 border-transparent min-w-32 text-center shrink-0"
                >
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-semibold text-orange-600 dark:text-orange-400">
                        {formatMoney(item.amount)}
                    </p>
                </div>
            ))}
        </div>
    )
}

// ──── T hisob tab ────

function TAccountTab({ mode, onToggle, tripId }: { mode: "aylanma" | "haydovchi"; onToggle: (m: "aylanma" | "haydovchi") => void; tripId?: number }) {
    const { openModal: openAvansModal } = useModal("avans-berish")

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
            params: { trip: tripId, action: isDriver ? "1,2" : 1, page_size: 100, ...(isDriver ? { driver: true } : {}) },
            enabled: !!tripId,
            options: { queryKey: [MANAGERS_CASHFLOW, "t-hisob-income", tripId, isDriver] },
        },
    )
    const { data: expenseData } = useGet<ListResponse<FinanceRow>>(
        MANAGERS_CASHFLOW,
        {
            params: { trip: tripId, action: -1, page_size: 100, ...(isDriver ? { driver: true } : {}) },
            enabled: !!tripId,
            options: { queryKey: [MANAGERS_CASHFLOW, "t-hisob-expense", tripId, isDriver] },
        },
    )

    const incomeRows = incomeData?.results ?? []
    const expenseRows = expenseData?.results ?? []

    const stat = mode === "aylanma" ? tripStat : driverStat
    const totalIncome = Number(stat?.income ?? 0)
    const totalExpense = Number(stat?.expense ?? 0)
    const balance = totalIncome - totalExpense

    const returnableBreakdown = useMemo(() => {
        if (mode !== "haydovchi" || !driverStat) return []
        const items: { label: string; amount: number }[] = []
        const returnFuelAmount = Number(driverStat.return_fuel_amount ?? 0)
        const returnFuel = Number(driverStat.return_fuel ?? 0)
        if (returnFuelAmount) items.push({ label: "Yoqilg'i summasi", amount: returnFuelAmount })
        if (returnFuel) items.push({ label: "Yoqilg'i (litr)", amount: returnFuel })
        return items
    }, [mode, driverStat])

    return (
        <div className="flex flex-col h-full overflow-hidden gap-4">
            <div className="shrink-0 flex flex-col gap-3">
                {/* Mode switch */}
                <ModeToggle mode={mode} onToggle={onToggle} />

                {/* Summary row */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar">
                        <SummaryCard label="Jami kirim" amount={totalIncome} variant="income" />
                        <SummaryCard label="Jami chiqim" amount={totalExpense} variant="expense" />
                        <SummaryCard label={mode === "haydovchi" ? "Balans" : "Foyda"} amount={balance} variant="balance" />
                        {mode === "haydovchi" && returnableBreakdown.map((item) => (
                            <SummaryCard key={item.label} label={item.label} amount={item.amount} variant="balance" />
                        ))}
                    </div>
                    {mode === "haydovchi" && (
                        <Button
                            onClick={() => openAvansModal()}
                            variant="outline"
                            className="gap-1.5 shrink-0"
                        >
                            <Plus size={16} />
                            Avans berish
                        </Button>
                    )}
                </div>
            </div>

            {/* Single card, two columns inside */}
            <div className="flex-1 min-h-0 flex flex-col border rounded-lg">
                {/* Shared header row */}
                <div className="grid grid-cols-2 border-b items-center shrink-0">
                    <div className="px-4 py-3 flex items-center justify-center gap-2 border-r bg-green-500/10">
                        <span className="size-2 rounded-full bg-green-500" />
                        <h2 className="font-semibold text-sm text-green-600">Kirim</h2>
                        <span className="text-[10px] font-semibold text-green-600 bg-green-500/15 rounded-full px-1.5 py-0.5 leading-none">{incomeRows.length}</span>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-center gap-2 bg-red-600/10">
                        <span className="size-2 rounded-full bg-red-500" />
                        <h2 className="font-semibold text-sm text-red-600">Chiqim</h2>
                        <span className="text-[10px] font-semibold text-red-600 bg-red-500/15 rounded-full px-1.5 py-0.5 leading-none">{expenseRows.length}</span>
                    </div>
                </div>

                {/* Two columns of items */}
                <div className="grid grid-cols-2 flex-1 min-h-0">
                    {/* Left: Kirim */}
                    <div className="border-r overflow-y-auto divide-y">
                        {incomeRows.map((row, i) => (
                            <div key={row.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex gap-2 min-w-0">
                                        <span className="text-xs text-muted-foreground mt-0.5 shrink-0 w-4 text-right">
                                            {i + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{row.category_name}</p>
                                            {row.order && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {row.loading_name} → {row.unloading_name}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {row.comment && <span className="text-xs text-muted-foreground">{row.comment}</span>}
                                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted">
                                                    {row.payment_type_name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-green-500 shrink-0">
                                        + {formatMoney(row.amount)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {incomeRows.length === 0 && (
                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                Kirim yo'q
                            </div>
                        )}
                    </div>

                    {/* Right: Chiqim */}
                    <div className="overflow-y-auto divide-y">
                        {expenseRows.map((row, i) => (
                            <div key={row.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex gap-2 min-w-0">
                                        <span className="text-xs text-muted-foreground mt-0.5 shrink-0 w-4 text-right">
                                            {i + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{row.category_name}</p>
                                            {row.order && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {row.loading_name} → {row.unloading_name}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {row.comment && <span className="text-xs text-muted-foreground">{row.comment}</span>}
                                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted">
                                                    {row.payment_type_name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-red-500 shrink-0">
                                        - {formatMoney(row.amount)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {expenseRows.length === 0 && (
                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                Chiqim yo'q
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal modalKey="avans-berish" title="Avans berish" size="max-w-md">
                <AvansForm tripId={tripId} />
            </Modal>
        </div>
    )
}

// ──── Main export ────

export default function KirimXarajatContent() {
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
                        label: "Tushum",
                        content: <IncomeTab tripId={tripId} onCategoryChange={handleCategoryChange} onCategoryIdChange={handleCategoryIdChange} onCategoryCodeChange={handleCategoryCodeChange} />,
                    },
                    {
                        value: "xarajat",
                        label: "Xarajat",
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
                title={currentType === "tushum" ? "Tushum qo'shish" : "Xarajat qo'shish"}
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
