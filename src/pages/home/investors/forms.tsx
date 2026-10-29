import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { kontragentUrl, onApiError, som, useRefreshFinance } from "@/pages/home/kontragent/api"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export const INVESTMENT_CREATE = "investment-create"

type InvestmentForm = { date: string; kind: "cash" | "vehicle"; vehicle: number | ""; amount_usd: number | ""; rate: number | ""; comment: string }

export const AddInvestmentForm = ({ investorId }: { investorId: number }) => {
    const { t } = useTranslation()
    const { closeModal, isOpen } = useModal(INVESTMENT_CREATE)
    const refresh = useRefreshFinance()
    const { data: vehicles } = useGet<{ id: number; name: string }[]>("selectable/vehicle", { params: { model_name: "vehicle" }, enabled: isOpen })
    const form = useForm<InvestmentForm>({
        defaultValues: { date: format(new Date(), "yyyy-MM-dd"), kind: "cash", vehicle: "", amount_usd: "", rate: "", comment: "" },
    })
    const kind = form.watch("kind")
    const amount = Number(form.watch("amount_usd")) || 0
    const rate = Number(form.watch("rate")) || 0
    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("messages.success_add"))
            form.reset()
            closeModal()
            refresh()
        },
        onError: onApiError(t("messages.error")),
    })

    return (
        <form
            onSubmit={form.handleSubmit((v) =>
                mutate(kontragentUrl(investorId, "investments"), {
                    date: v.date,
                    kind: v.kind,
                    amount_usd: Number(v.amount_usd),
                    rate: v.kind === "cash" ? Number(v.rate) : null,
                    vehicle: v.kind === "vehicle" ? Number(v.vehicle) : null,
                    comment: v.comment.trim(),
                }),
            )}
            className="flex flex-col gap-3"
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormDatePicker required fullWidth control={form.control} name="date" label={t("investors.fields.date")} />
                <FormCombobox
                    required
                    isClearIcon={false}
                    isSearch={false}
                    control={form.control}
                    name="kind"
                    label={t("investors.fields.kind")}
                    options={[
                        { id: "cash", name: t("investors.kind.cash") },
                        { id: "vehicle", name: t("investors.kind.vehicle") },
                    ]}
                    labelKey="name"
                    valueKey="id"
                />
            </div>
            {kind === "vehicle" && (
                <FormCombobox required control={form.control} name="vehicle" label={t("investors.fields.vehicle")} options={vehicles ?? []} labelKey="name" valueKey="id" />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormNumberInput
                    required
                    control={form.control}
                    name="amount_usd"
                    label={t("investors.fields.amount_usd")}
                    thousandSeparator=" "
                    decimalScale={0}
                    allowNegative={false}
                    registerOptions={{ validate: (v: unknown) => Number(v) > 0 || t("investors.errors.gt_zero") }}
                />
                {kind === "cash" && (
                    <FormNumberInput
                        required
                        control={form.control}
                        name="rate"
                        label={t("investors.fields.rate")}
                        thousandSeparator=" "
                        decimalScale={2}
                        allowNegative={false}
                        registerOptions={{ validate: (v: unknown) => Number(v) > 0 || t("investors.errors.gt_zero") }}
                    />
                )}
            </div>
            {kind === "cash" && amount > 0 && rate > 0 && (
                <div className="rounded-lg border bg-muted/30 px-3 py-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("investors.to_kassa")}</span>
                    <span className="font-semibold tabular-nums">{som(amount * rate)}</span>
                </div>
            )}
            <FormTextarea name="comment" label={t("investors.fields.comment")} methods={form} rows={3} />
            <div className="flex justify-end">
                <Button className="min-w-32" type="submit" loading={isPending}>{t("actions.save")}</Button>
            </div>
        </form>
    )
}
