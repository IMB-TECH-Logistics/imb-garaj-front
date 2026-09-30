import { FormCombobox } from "@/components/form/combobox"
import { FormNumberInput } from "@/components/form/number-input"
import { FormSelect } from "@/components/form/select"
import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import {
    KASSA_OVERVIEW,
    KASSA_PAYERS,
    KASSA_PAYMENT_REQUESTS,
    SETTINGS_SELECTABLE_EXPENSE_CATEGORY,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { formatMoney } from "@/lib/format-money"
import { handleFormError } from "@/lib/show-form-errors"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import type { VstOverview } from "./types"
import { isWithinMoneyLimit } from "@/lib/money-limit"

type FormValues = {
    recipient_type: "1" | "2"
    driver: string | number | ""
    category: string | number | ""
    vehicle: string | number | ""
    amount: string | number | ""
    payer_type: "1" | "2"
    payer: string | number | ""
    comment: string
}

const DEFAULTS: FormValues = {
    recipient_type: "1",
    driver: "",
    category: "",
    vehicle: "",
    amount: "",
    payer_type: "2",
    payer: "",
    comment: "",
}

export const VST_REQUEST_MODAL = "vst-payment-request"

const VstRequestModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal, isOpen } = useModal(VST_REQUEST_MODAL)
    const { data: overview } = useGet<VstOverview>(KASSA_OVERVIEW, { enabled: isOpen })
    const { data: payers } = useGet<{ id: number; name: string }[]>(KASSA_PAYERS, { enabled: isOpen })
    const { data: categories } = useGet<{ id: number; name: string }[]>(
        SETTINGS_SELECTABLE_EXPENSE_CATEGORY,
        { enabled: isOpen },
    )
    const { data: vehicles } = useGet<{ id: number; name: string }[]>("selectable/vehicle", {
        params: { model_name: "vehicle" },
        enabled: isOpen,
    })

    const form = useForm<FormValues>({ defaultValues: DEFAULTS })
    const { control, handleSubmit, reset, watch, setValue } = form
    const recipientType = watch("recipient_type")
    const payerType = watch("payer_type")

    useEffect(() => {
        if (!isOpen) reset(DEFAULTS)
    }, [isOpen, reset])

    useEffect(() => {
        if (isOpen && payers?.length === 1 && !form.getValues("payer")) {
            setValue("payer", payers[0].id)
        }
    }, [isOpen, payers, setValue, form])

    const driverOptions = useMemo(
        () =>
            (overview?.drivers.items ?? [])
                .map((d) => ({
                    id: d.driver_id,
                    name: `${d.full_name} · ${formatMoney(Number(d.balance))}`,
                }))
                .sort((a, b) => a.name.localeCompare(b.name)),
        [overview],
    )

    const onSuccess = () => {
        toast.success(t("toast.added"))
        queryClient.invalidateQueries({ queryKey: [KASSA_PAYMENT_REQUESTS] })
        queryClient.invalidateQueries({ queryKey: [KASSA_OVERVIEW] })
        closeModal()
    }

    const { mutate, isPending } = usePost({ onSuccess, meta: { skipGlobalError: true } })

    const onSubmit = (v: FormValues) => {
        const isDriver = v.recipient_type === "1"
        mutate(
            KASSA_PAYMENT_REQUESTS,
            {
                recipient_type: Number(v.recipient_type),
                driver: isDriver ? Number(v.driver) || null : null,
                category: isDriver ? null : Number(v.category) || null,
                vehicle: isDriver ? null : Number(v.vehicle) || null,
                amount: Number(v.amount),
                payer_type: Number(v.payer_type),
                payer: v.payer_type === "2" ? Number(v.payer) || null : null,
                comment: v.comment || null,
            },
            { onError: (e: unknown) => handleFormError(e, form) },
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormSelect
                required
                control={control}
                name="recipient_type"
                label={t("vst.recipient", "Kimga")}
                options={[
                    { id: "1", name: t("vst.to_driver", "Haydovchiga (avans)") },
                    { id: "2", name: t("vst.to_expense", "Garaj xarajati") },
                ]}
                valueKey="id"
                labelKey="name"
            />
            {recipientType === "1" ?
                <FormCombobox
                    required
                    control={control}
                    name="driver"
                    label={t("vst.driver", "Haydovchi (ochiq aylanmasi bor)")}
                    options={driverOptions}
                    valueKey="id"
                    labelKey="name"
                />
            :   <>
                    <FormCombobox
                        required
                        control={control}
                        name="category"
                        label={t("vst.category", "Xarajat turi")}
                        options={categories}
                        valueKey="id"
                        labelKey="name"
                    />
                    <FormCombobox
                        control={control}
                        name="vehicle"
                        label={t("vst.vehicle", "Mashina (ixtiyoriy)")}
                        options={vehicles}
                        valueKey="id"
                        labelKey="name"
                    />
                </>
            }
            <FormNumberInput
                required
                control={control}
                name="amount"
                label={t("form.amount")}
                placeholder="Ex: 1 000 000"
                thousandSeparator=" "
                decimalScale={2}
                allowNegative={false}
                registerOptions={{
                    validate: (v) =>
                        Number(v) > 0
                            ? isWithinMoneyLimit(v) || t("validation.max_amount")
                            : t("kassa.amount_gt_zero"),
                }}
            />
            <FormSelect
                required
                control={control}
                name="payer_type"
                label={t("vst.who_pays", "Kim to'laydi")}
                options={[
                    { id: "2", name: t("vst.payer_user", "To'lovchi (Abdulloh)") },
                    { id: "1", name: t("vst.payer_garage", "Garaj kassasi (Doniyor)") },
                ]}
                valueKey="id"
                labelKey="name"
            />
            {payerType === "2" && (
                <FormCombobox
                    required
                    control={control}
                    name="payer"
                    label={t("vst.payer", "To'lovchi")}
                    options={payers}
                    valueKey="id"
                    labelKey="name"
                />
            )}
            <FormTextarea label={t("form.comment")} name="comment" methods={form} />
            <div className="flex justify-end mt-1">
                <Button className="min-w-32" type="submit" loading={isPending}>
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default VstRequestModal
