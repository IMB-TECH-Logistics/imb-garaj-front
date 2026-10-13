import Modal from "@/components/custom/modal"
import FormTextarea from "@/components/form/textarea"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MANAGERS_EMPTY_LEGS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { handleFormError } from "@/lib/show-form-errors"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export const EMPTY_LEG_PAY_MODAL_KEY = "empty-leg-pay"

export type EmptyLeg = {
    id?: number
    before_order: number
    after_order: number | null
    first: boolean
    from_place: string | null
    to_place: string | null
    idle_start: string | null
    start: string
    end: string
    minutes: number
    distance_km: number | null
    distance_km_manual?: number | null
    km?: number | null
    payment_amount?: number | string | null
    payment_comment?: string | null
    payment_by_name?: string | null
    payment_at?: string | null
    locked?: boolean
}

type FormValues = {
    payment_amount: string | number | null
    payment_comment: string
    distance_km_manual: string | number | null
}

const toNumberOrNull = (value: string | number | null | undefined) =>
    value === "" || value == null ? null : Number(value)

export default function EmptyLegPayModal({ leg }: { leg: EmptyLeg | null }) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal, isOpen } = useModal(EMPTY_LEG_PAY_MODAL_KEY)
    const form = useForm<FormValues>({
        defaultValues: { payment_amount: null, payment_comment: "", distance_km_manual: null },
    })

    useEffect(() => {
        if (!isOpen || !leg) return
        form.reset({
            payment_amount: leg.payment_amount != null ? Number(leg.payment_amount) : null,
            payment_comment: leg.payment_comment ?? "",
            distance_km_manual: leg.distance_km_manual ?? null,
        })
    }, [isOpen, leg])

    const { mutate, isPending } = usePatch({
        onSuccess: () => {
            toast.success(t("messages.success_edit"))
            queryClient.invalidateQueries({
                predicate: (q) => String(q.queryKey[0]).includes("empty-legs"),
            })
            closeModal()
        },
        onError: (error: unknown) => handleFormError(error, form),
    })

    const onSubmit = (values: FormValues) => {
        if (!leg?.id) return
        mutate(`${MANAGERS_EMPTY_LEGS}/${leg.id}`, {
            payment_amount: toNumberOrNull(values.payment_amount),
            payment_comment: values.payment_comment.trim() ? values.payment_comment.trim() : null,
            distance_km_manual: toNumberOrNull(values.distance_km_manual),
        })
    }

    return (
        <Modal size="max-w-md" modalKey={EMPTY_LEG_PAY_MODAL_KEY} titleInChildren>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <DialogHeader>
                    <DialogTitle className="font-normal">{t("trips.reys_cols.empty_run_pay")}</DialogTitle>
                    <DialogDescription>
                        {leg?.from_place || t("trips.empty_leg.turnover_start")} → {leg?.to_place || "—"}
                    </DialogDescription>
                </DialogHeader>
                <FormNumberInput
                    control={form.control}
                    name="payment_amount"
                    label={t("trips.empty_leg.payment_amount")}
                    thousandSeparator=" "
                    allowNegative={false}
                    decimalScale={2}
                />
                <FormTextarea methods={form} name="payment_comment" label={t("form.comment")} />
                <div>
                    <FormNumberInput
                        control={form.control}
                        name="distance_km_manual"
                        label={t("trips.empty_leg.km_correction")}
                        thousandSeparator=" "
                        allowNegative={false}
                        decimalScale={1}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t("trips.empty_leg.gps_distance", {
                            value: leg?.distance_km != null ? `${Number(leg.distance_km).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} ${t("trips.units.km")}` : "—",
                        })}
                    </p>
                </div>
                <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={closeModal} disabled={isPending}>
                        {t("actions.cancel")}
                    </Button>
                    <Button type="submit" loading={isPending}>
                        {t("actions.save")}
                    </Button>
                </DialogFooter>
            </form>
        </Modal>
    )
}
