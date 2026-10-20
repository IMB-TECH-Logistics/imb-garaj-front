import { FormCombobox } from "@/components/form/combobox"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import {
    EXPENSE_TYPE_LABEL_KEY,
    ExpenseType,
    KassaRequest,
    KassaTrip,
    KIND_LABEL_KEY,
    KV2_REQUESTS,
    KV2_TRIPS,
    n,
    RequestKind,
    STATUS,
    useKassaPost,
    VEHICLES_LIST,
    WAREHOUSES,
} from "./api"
import { M } from "./modal-keys"
import { useAmountRules, onErr } from "./modal-utils"
import { Save } from "./modal-save"

type RequestForm = {
    kind: RequestKind
    amount: number | ""
    comment: string
    trip: number | null
    expense_type: ExpenseType | null
    vehicle: number | null
    warehouse: string | null
    product: string
}

export const RequestModal = ({ editing }: { editing: KassaRequest | null }) => {
    const { t } = useTranslation()
    const amountRules = useAmountRules()
    const requestKindOptions: { id: RequestKind; name: string }[] = [
        { id: "qoshimcha", name: t("form.advance") },
        { id: "oylik", name: t("table.monthly_salary") },
        { id: "garaj_xarajat", name: t("fin.kv2_expense_type.texnik_korik") },
    ]
    const { closeModal, isOpen } = useModal(M.request)
    const post = useKassaPost(closeModal)
    const { data: trips } = useGet<KassaTrip[]>(KV2_TRIPS, { enabled: isOpen })
    const { data: vehicles } = useGet<{ results?: { id: number; truck_number: string }[] } | { id: number; truck_number: string }[]>(VEHICLES_LIST, {
        params: { page_size: 500 },
        enabled: isOpen,
    })
    const vehicleList = Array.isArray(vehicles) ? vehicles : vehicles?.results ?? []
    const blank: RequestForm = { kind: "qoshimcha", amount: "", comment: "", trip: null, expense_type: null, vehicle: null, warehouse: null, product: "" }
    const form = useForm<RequestForm>({ defaultValues: blank })
    useEffect(() => {
        if (!isOpen) return form.reset(blank)
        if (editing)
            form.reset({
                kind: editing.kind,
                amount: n(editing.amount),
                comment: editing.comment ?? "",
                trip: editing.trip,
                expense_type: editing.expense_type,
                vehicle: editing.vehicle,
                warehouse: editing.warehouse,
                product: editing.product ?? "",
            })
    }, [isOpen, editing])
    const kind = form.watch("kind")
    const expenseType = form.watch("expense_type")
    const garage = kind === "garaj_xarajat"
    const legacyGarage = !!editing && editing.kind === "garaj_xarajat" && editing.expense_type !== "texnik_korik"
    const tripOptions = (trips ?? [])
        .filter((t) => t.status === "yolda" || t.status === "avans_kutilmoqda" || (editing && t.id === editing.trip))
        .map((t) => ({ id: t.id, name: `${t.driver_name} · #${t.id}${t.plate ? ` · ${t.plate}` : ""}` }))
    const lockedKind = !!editing && (editing.kind === "qaytarish" || editing.kind === "berish" || editing.kind === "avans" || editing.kind === "avans_qaytarish")

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) => {
                if (garage && !legacyGarage) v.expense_type = "texnik_korik"
                if (garage && v.expense_type === "ombor" && !v.product.trim()) return form.setError("product", { message: t("fin.kv2.enter_product") })
                const trip = (trips ?? []).find((t) => t.id === Number(v.trip))
                const body = {
                    kind: v.kind,
                    amount: Number(v.amount),
                    comment: v.comment || null,
                    ...(garage
                        ? {
                              expense_type: v.expense_type,
                              vehicle: v.expense_type !== "ombor" ? v.vehicle : null,
                              warehouse: v.expense_type === "ombor" ? v.warehouse : null,
                              product: v.expense_type === "ombor" ? v.product.trim() : null,
                          }
                        : { trip: trip?.id ?? null, driver: trip?.driver ?? null }),
                }
                if (editing)
                    post.mutate(`${KV2_REQUESTS}/${editing.id}/resend`, body, { onSuccess: () => toast.success(editing.status === STATUS.PENDING ? t("fin.kv2.request_changed") : t("fin.kv2.request_resent")), onError: onErr })
                else post.mutate(KV2_REQUESTS, body, { onSuccess: () => toast.success(t("fin.kv2.request_sent_cashier")), onError: onErr })
            })}
        >
            {editing?.rejected_comment && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
                    <span className="font-medium">{t("kassa.reject_reason")}: </span>{editing.rejected_comment}
                </div>
            )}
            {lockedKind ?
                <p className="text-sm">{t(KIND_LABEL_KEY[editing!.kind])} · {editing!.driver_name} · {t("fin.kv2.turnover_n", { id: editing!.trip })}</p>
            :   <FormCombobox required control={form.control} name="kind" label={t("fin.kv2.request_type")} isSearch={false} isClearIcon={false} options={requestKindOptions} valueKey="id" labelKey="name" />}
            {!garage && !lockedKind && (
                <FormCombobox required control={form.control} name="trip" label={t("fin.kv2.driver_open_turnover")} isClearIcon={false} options={tripOptions} valueKey="id" labelKey="name" />
            )}
            {garage && legacyGarage && (
                <FormCombobox
                    required
                    control={form.control}
                    name="expense_type"
                    label={t("form.expense_type")}
                    isSearch={false}
                    options={(Object.keys(EXPENSE_TYPE_LABEL_KEY) as ExpenseType[]).map((k) => ({ id: k, name: t(EXPENSE_TYPE_LABEL_KEY[k]) }))}
                    valueKey="id"
                    labelKey="name"
                />
            )}
            {garage && (!legacyGarage || (expenseType && expenseType !== "ombor")) && (
                <FormCombobox required control={form.control} name="vehicle" label={t("vst.vehicle_short")} options={vehicleList} valueKey="id" labelKey="truck_number" />
            )}
            {garage && expenseType === "ombor" && (
                <>
                    <FormCombobox required control={form.control} name="warehouse" label={t("fin.kv2.warehouse")} isSearch={false} options={WAREHOUSES.map((w) => ({ id: w, name: w }))} valueKey="id" labelKey="name" />
                    <label className="flex flex-col gap-1.5 text-sm font-medium">
                        {t("fin.kv2.product_label")}
                        <input {...form.register("product")} placeholder={t("fin.kv2.product_placeholder")} className="h-10 rounded-md border bg-background px-3 text-sm font-normal" />
                        {form.formState.errors.product && <span className="text-xs text-destructive font-normal">{form.formState.errors.product.message}</span>}
                    </label>
                </>
            )}
            <FormNumberInput required control={form.control} name="amount" label={t("form.amount")} placeholder={`${t("form.example")}: 1 000 000`} thousandSeparator=" " allowNegative={false} registerOptions={amountRules} />
            <FormTextarea label={t("form.comment")} name="comment" methods={form} />
            <Save label={!editing ? t("fin.kv2.send") : editing.status === STATUS.PENDING ? t("actions.save") : t("fin.kv2.resend")} loading={post.isPending} />
        </form>
    )
}
