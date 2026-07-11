import FormTextarea from "@/components/form/textarea"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import {
    CHECKOUT_EXPENSE,
    CHECKOUT_MAIN,
    CHECKOUT_TOP_UP,
} from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

type FormValues = {
    amount: string | number | ""
    comment: string
}

type Props = {
    modalKey: string
    kind: "income" | "expense"
}

const CheckoutAdjustModal = ({ modalKey, kind }: Props) => {
    const queryClient = useQueryClient()
    const { closeModal, isOpen } = useModal(modalKey)
    const isIncome = kind === "income"
    const url = isIncome ? CHECKOUT_TOP_UP : CHECKOUT_EXPENSE

    const form = useForm<FormValues>({
        defaultValues: { amount: "", comment: "" },
    })
    const { control, handleSubmit, reset } = form

    useEffect(() => {
        if (!isOpen) reset({ amount: "", comment: "" })
    }, [isOpen, reset])

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(
                isIncome ? "Balans to'ldirildi" : "Chiqim qo'shildi",
            )
            queryClient.refetchQueries({ queryKey: [CHECKOUT_MAIN] })
            queryClient.refetchQueries({ queryKey: ["transaction"] })
            closeModal()
        },
    })

    const onSubmit = (values: FormValues) => {
        mutate(url, {
            amount: Number(values.amount),
            comment: values.comment || null,
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormNumberInput
                required
                control={control}
                label="Summa"
                name="amount"
                placeholder="Ex: 1 000 000"
                thousandSeparator=" "
                decimalScale={0}
            />
            <FormTextarea label="Izoh" name="comment" methods={form} />
            <div className="flex justify-end mt-1">
                <Button
                    className="min-w-32"
                    type="submit"
                    loading={isPending}
                    variant={isIncome ? "default" : "destructive"}
                >
                    Saqlash
                </Button>
            </div>
        </form>
    )
}

export default CheckoutAdjustModal
