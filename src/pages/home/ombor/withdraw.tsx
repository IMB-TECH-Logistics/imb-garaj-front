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
import { showUzApiError } from "@/lib/uz-api-errors"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { type OmborProduct } from "./cols"

type FormValues = {
    quantity: number | string
    vehicle: number | null
    comment: string
}

type SelectItem = { id: number | string; name: string }

const OmborWithdraw = ({ product }: { product: OmborProduct | null }) => {
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
    // OP-36: mavjud qoldiqdan ortiq chiqim mijoz tomonda to'xtatilsin
    const available = Number(product?.quantity ?? 0)
    const isOverStock = qty > available
    const unit = product?.unit_display ?? ""

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success("Ombordan chiqarildi")
            queryClient.refetchQueries({ queryKey: [WAREHOUSE_PRODUCTS] })
            queryClient.refetchQueries({ queryKey: [WAREHOUSE_STATS] })
            queryClient.refetchQueries({ queryKey: [WAREHOUSE_WITHDRAWALS] })
            closeModal()
        },
    })

    const onSubmit = (data: FormValues) => {
        if (!product) return
        if (Number(data.quantity) > Number(product.quantity ?? 0)) return
        mutate(
            WAREHOUSE_WITHDRAW,
            {
                product: product.id,
                quantity: Number(data.quantity),
                vehicle: data.vehicle || null,
                comment: data.comment || null,
            },
            { onError: (error) => showUzApiError(error, form) },
        )
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
                    <div className="text-xs text-muted-foreground">Mavjud</div>
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
                decimalScale={2}
                allowedDecimalSeparators={[",", "."]}
                allowNegative={false}
                registerOptions={{
                    validate: (value) => {
                        const n = Number(value)
                        if (!(n > 0))
                            return "Miqdor noldan katta bo'lishi kerak"
                        if (n > available)
                            return `Omborda faqat ${available} ${unit} bor — bundan ortiq chiqarib bo'lmaydi`
                        return true
                    },
                }}
            />
            <FormCombobox
                control={control}
                label="Avtomobil (ixtiyoriy)"
                name="vehicle"
                options={vehicles || []}
                valueKey="id"
                labelKey="name"
                placeholder="Mashina tanlang yoki bo'sh qoldiring"
            />
            <FormTextarea
                label="Izoh"
                name="comment"
                methods={form}
                placeholder="Nima uchun ishlatildi..."
            />

            {qty > 0 && !isOverStock && (
                <div className="rounded-md border border-dashed p-2 text-sm flex justify-between">
                    <span className="text-muted-foreground">
                        Jami chiqim summasi
                    </span>
                    <span className="font-semibold tabular-nums">
                        {formatMoney(lineTotal)} so'm
                    </span>
                </div>
            )}

            {isOverStock && (
                <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-2 text-sm text-rose-600 dark:text-rose-400">
                    Omborda faqat{" "}
                    <span className="font-semibold tabular-nums">
                        {formatMoney(available)} {unit}
                    </span>{" "}
                    bor. Bundan ortiq miqdorni chiqarib bo'lmaydi.
                </div>
            )}

            <div className="flex justify-end pt-1">
                <Button
                    type="submit"
                    loading={isPending}
                    disabled={isOverStock || qty <= 0}
                    variant="destructive"
                    className="min-w-32"
                >
                    Chiqarish
                </Button>
            </div>
        </form>
    )
}

export default OmborWithdraw
