import Modal from "@/components/custom/modal"
import { FormDatePicker } from "@/components/form/date-picker"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { formatMoney } from "@/lib/format-money"
import { useQueryClient } from "@tanstack/react-query"
import { Pencil } from "lucide-react"
import { useRef } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { formatDate, localTodayIso, VILOYAT_TARIFFS } from "./cols"

type FormValues = { amount: string | null; valid_from: string | null }

interface Props {
    amount: string | null
    validFrom?: string | null
    canEdit: boolean
}

const PrastoyForm = ({ amount }: { amount: string | null }) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("edit-prastoy")
    const { control, handleSubmit } = useForm<FormValues>({
        defaultValues: { amount, valid_from: localTodayIso() },
    })
    const { mutateAsync, isPending } = usePost()
    const submitting = useRef(false)

    const onSubmit = async (values: FormValues) => {
        if (!values.amount || !values.valid_from) return
        if (submitting.current) return
        submitting.current = true
        try {
            await mutateAsync(`${VILOYAT_TARIFFS}/prastoy`, {
                amount: values.amount,
                valid_from: values.valid_from,
            })
            toast.success(t("page.vt_prastoy_updated"))
            await queryClient.invalidateQueries({
                queryKey: [VILOYAT_TARIFFS],
            })
            closeModal()
        } catch {
            return
        } finally {
            submitting.current = false
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormNumberInput
                required
                thousandSeparator=" "
                name="amount"
                label={t("page.vt_prastoy_daily")}
                placeholder="150 000"
                control={control}
            />
            <FormDatePicker
                required
                name="valid_from"
                label={t("page.valid_from")}
                control={control}
                fullWidth
            />
            <div className="flex items-center justify-end">
                <Button className="min-w-36" type="submit" loading={isPending}>
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

const PrastoyCard = ({ amount, validFrom, canEdit }: Props) => {
    const { t } = useTranslation()
    const { openModal } = useModal("edit-prastoy")

    return (
        <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card px-4 py-3">
                <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">
                        {t("page.vt_prastoy_title")}
                    </span>
                    {amount == null ? (
                        <span className="font-medium text-destructive">
                            {t("form.tariff_no")}
                        </span>
                    ) : (
                        <span className="text-lg font-semibold">
                            {formatMoney(amount)} {t("page.vt_prastoy_unit")}
                        </span>
                    )}
                    {validFrom && (
                        <span className="text-xs text-muted-foreground">
                            {t("page.vt_valid_from")}: {formatDate(validFrom)}
                        </span>
                    )}
                </div>
                {canEdit && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={openModal}
                        icon={<Pencil size={16} />}
                    >
                        {t("actions.edit")}
                    </Button>
                )}
            </div>
            <Modal
                title={t("page.vt_prastoy_title")}
                modalKey="edit-prastoy"
                size="max-w-md"
            >
                <PrastoyForm amount={amount} />
            </Modal>
        </>
    )
}

export default PrastoyCard
