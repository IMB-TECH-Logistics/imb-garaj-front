import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/format-money"
import { formatDate } from "@/lib/format-date"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { FormCombobox } from "@/components/form/combobox"
import { FormNumberInput } from "@/components/form/number-input"
import { FormDatePicker } from "@/components/form/date-picker"
import FormTextarea from "@/components/form/textarea"
import FileUpload from "@/components/form/file-upload"
import { useModal } from "@/hooks/useModal"
import { toast } from "sonner"
import { useGet } from "@/hooks/useGet"
import { usePost } from "@/hooks/usePost"
import { usePatch } from "@/hooks/usePatch"
import { useGlobalStore } from "@/store/global-store"
import { DRIVER_SALARIES, MANAGERS_CASHFLOW, MANAGERS_EXPENSE_CATEGORIES, MANAGERS_EXPENSES, MANAGERS_ORDERS, SETTINGS_REGIONS, SETTINTS_PAYMENT_TYPE } from "@/constants/api-endpoints"
import { useQueryClient } from "@tanstack/react-query"
import { useUser } from "@/constants/useUser"
import { useTranslation } from "react-i18next"
import { isWithinMoneyLimit } from "@/lib/money-limit"
import { FinanceRow } from "./types"
import { PetrolStationField } from "./petrol-station-field"

// ──── Add finance form ────

export function AddFinanceForm({
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
    // Zapravka moduli o'chiq tenantda stansiya maydoni ko'rsatilmaydi va yuborilmaydi.
    const { data: profile } = useUser()
    const withStation =
        isFuel && !(profile?.disabled_modules ?? []).includes("settings_petrol_stations")

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
            petrol_station: editItem?.petrol_station ?? "",
            from_region: (editItem as any)?.from_region ?? "",
            to_region: (editItem as any)?.to_region ?? "",
            deduct_from_balance: true,
            date: "",
        },
    })
    const { handleSubmit, control, reset, watch, setValue } = form
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
            label: `${o.date ? `${formatDate(o.date)} · ` : ""}${o.loading_name} → ${o.unloading_name}`,
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
                petrol_station: editItem.petrol_station ?? "",
                from_region: (editItem as any).from_region ?? "",
                to_region: (editItem as any).to_region ?? "",
                deduct_from_balance: true,
                date: "",
            })
        } else {
            reset({
                amount: "",
                quantity: "",
                payment_type: "",
                comment: "",
                receipt: null,
                order: "",
                petrol_station: "",
                from_region: "",
                to_region: "",
                deduct_from_balance: true,
                date: "",
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
        // Faqat so'm: tahrirda valyuta yuborilmaydi (eski yozuv valyutasi o'zgarmaydi)
        if (!isEdit) fd.append("currency", "1")
        if (data.comment) fd.append("comment", data.comment)
        if (data.payment_type && !(withStation && !isEdit)) fd.append("payment_type", String(data.payment_type))
        if (data.quantity) fd.append("quantity", String(data.quantity))
        if (withStation && data.petrol_station) fd.append("petrol_station", String(data.petrol_station))
        if (showOrderSelect && data.order) fd.append("order", String(data.order))
        if (data.receipt instanceof File) fd.append("receipt", data.receipt)
        if (advanceId && action === -1) fd.append("advance", String(advanceId))
        if (!isEdit && data.date) fd.append("date", data.date)

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
                    {withStation && <PetrolStationField control={control} />}
                    <FormNumberInput
                        required
                        control={control}
                        label={t("trips.kirim.quantity_liters")}
                        name="quantity"
                        placeholder={t("trips.common.example_value", { value: "120.5" })}
                        decimalScale={2}
                        allowNegative={false}
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
                        placeholder={t("trips.common.example_value", { value: "123 000" })}
                        thousandSeparator=" "
                        decimalScale={2}
                        registerOptions={{
                            validate: (v) => isWithinMoneyLimit(v) || t("validation.max_amount"),
                        }}
                    />
                </div>
                {!(withStation && !isEdit) && (
                    <div className="flex-1 min-w-0">
                        <FormCombobox
                            control={control}
                            label={t("form.payment_type")}
                            name="payment_type"
                            options={paymentTypes?.results ?? []}
                            valueKey="id"
                            labelKey="name"
                        />
                    </div>
                )}
            </div>
                        {isSalaryExpense && (
                <div className="rounded-md border bg-muted/40 p-3 flex flex-col gap-2">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        {t("trips.kirim.salary_by_route")}
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
                            {t("trips.kirim.configured_tariff", { amount: formatMoney(salaryLookup.results[0].current_amount.amount) })}
                        </div>
                    ) : fromRegion && toRegion ? (
                        <div className="text-[11px] text-amber-600">
                            {t("trips.kirim.no_tariff")}
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
                        {t("trips.kirim.deduct_from_balance")}
                    </label>
                    <div className="text-[11px] text-muted-foreground">
                        {deductFromBalance
                            ? t("trips.kirim.deduct_yes_hint")
                            : t("trips.kirim.deduct_no_hint")}
                    </div>
                </div>
            )}
            {showOrderSelect && (
                <FormCombobox
                    required={orderRequired}
                    control={control}
                    label={orderRequired ? t("trips.kirim.order") : t("trips.kirim.order_optional")}
                    name="order"
                    options={orderOptions}
                    valueKey="id"
                    labelKey="label"
                    placeholder={t("form.order_type")}
                />
            )}
            {!isEdit && (
                <FormDatePicker
                    label={t("form.date")}
                    control={control}
                    name="date"
                    placeholder={t("trips.kirim.date_today")}
                    calendarProps={{ disabled: { after: new Date() } }}
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
