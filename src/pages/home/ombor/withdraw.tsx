import { FormCombobox } from "@/components/form/combobox"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import {
    WAREHOUSE_PRODUCTS,
    WAREHOUSE_STATS,
    WAREHOUSE_WITHDRAW,
    WAREHOUSE_WITHDRAWALS,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { formatMoney } from "@/lib/format-money"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { type OmborProduct } from "./cols"
import { useTranslation } from "react-i18next"

type FormValues = {
    quantity: number | string
    vehicle: number | null
    comment: string
}

type SelectItem = { id: number | string; name: string }

const OmborWithdraw = ({ product }: { product: OmborProduct | null }) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("ombor-withdraw")

    const { data: vehicles } = useGet<SelectItem[]>("selectable/vehicle", {
        params: { model_name: "vehicle" },
    })

    const form = useForm<FormValues>({
        defaultValues: { quantity: "", vehicle: null, comment: "" },
    })
    const { handleSubmit, control, reset, watch } = form

    useEffect(() => {
        reset({ quantity: "", vehicle: null, comment: "" })
    }, [product?.id, reset])

    const qty = Number(watch("quantity") || 0)
    const unitPrice = Number(product?.unit_price ?? 0)
    const lineTotal = qty * unitPrice

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("toast.warehouse_out"))
            queryClient.refetchQueries({ queryKey: [WAREHOUSE_PRODUCTS] })
            queryClient.refetchQueries({ queryKey: [WAREHOUSE_STATS] })
            queryClient.refetchQueries({ queryKey: [WAREHOUSE_WITHDRAWALS] })
            closeModal()
        },
    })

    const onSubmit = (data: FormValues) => {
        if (!product) return
        mutate(WAREHOUSE_WITHDRAW, {
            product: product.id,
            quantity: Number(data.quantity),
            vehicle: data.vehicle || null,
            comment: data.comment || null,
        })
    }

    if (!product) return null

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="rounded-lg bg-muted/60 p-3 text-sm flex justify-between gap-2">
                <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs text-muted-foreground">
                        Birlik: {product.unit_display} ·{" "}
                        {formatMoney(unitPrice)} so'm
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-muted-foreground">{t("form.available")}</div>
                    <div className="font-medium tabular-nums">
                        {formatMoney(Number(product.quantity))}{" "}
                        {product.unit_display}
                    </div>
                </div>
            </div>

            <FormNumberInput
                required
                control={control}
                label={`Chiqariladigan miqdor (${product.unit_display})`}
                name="quantity"
                thousandSeparator=" "
                placeholder="Ex: 5"
            />
            <FormCombobox
                control={control}
                label={t("form.vehicle_optional")}
                name="vehicle"
                options={vehicles || []}
                valueKey="id"
                labelKey="name"
                placeholder={t("form.truck")}
            />
            <FormTextarea
                label={t("form.comment")}
                name="comment"
                methods={form}
                placeholder="Nima uchun ishlatildi..."
            />

            {qty > 0 && (
                <div className="rounded-md border border-dashed p-2 text-sm flex justify-between">
                    <span className="text-muted-foreground">
                        {t("table.total_expense")}
                    </span>
                    <span className="font-semibold tabular-nums">
                        {formatMoney(lineTotal)} so'm
                    </span>
                </div>
            )}

            <div className="flex justify-end pt-1">
                <Button
                    type="submit"
                    loading={isPending}
                    variant="destructive"
                    className="min-w-32"
                >
                    {t("actions.issue_warehouse")}
                </Button>
            </div>
        </form>
    )
}

export default OmborWithdraw
