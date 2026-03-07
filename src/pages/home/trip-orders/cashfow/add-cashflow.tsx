import { FormCombobox } from "@/components/form/combobox"
import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import {
    ORDER_CASHFLOWS,
    SETTINGS_SELECTABLE_EXPENSE_CATEGORY,
    SETTINTS_PAYMENT_TYPE,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useParams, useSearch } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

interface CashflowForm {
    payment_type: any
    action: number
    amount: number
    category: number
    comment: string
    currency: number | string
    currency_course: number | string
}

const AddCashflow = () => {
    const queryClient = useQueryClient()
    const { getData, clearKey } = useGlobalStore()
    const { closeModal } = useModal("create-order-cashflow")
    const search = useSearch({ strict: false })
   const { parentId, childId } = useParams({ strict: false })

    const { data: paymentTypes } = useGet<ListResponse<RolesType>>(
        SETTINTS_PAYMENT_TYPE,
    )
    const { data: categoryData } = useGet<ExpenseCategory[]>(
        SETTINGS_SELECTABLE_EXPENSE_CATEGORY,
    )
    const currentCashflow = getData<CashflowForm & { id?: number }>(
        ORDER_CASHFLOWS,
    )

    const form = useForm<CashflowForm>({
        defaultValues: {
            action: currentCashflow?.action,
            amount: currentCashflow?.amount,
            category: currentCashflow?.category,
            comment: currentCashflow?.comment,
            currency: currentCashflow?.currency,
            currency_course: currentCashflow?.currency_course,
            payment_type: currentCashflow?.payment_type,
        },
    })

    const { handleSubmit, control, reset, watch } = form
    const selectedCurrency = watch("currency")

    const onSuccess = () => {
        toast.success(
            currentCashflow?.id ?
                "Cashflow tahrirlandi!"
            :   "Cashflow qo‘shildi!",
        )
        reset()
        clearKey(ORDER_CASHFLOWS)
        closeModal()
        queryClient.invalidateQueries({
            queryKey: [ORDER_CASHFLOWS],
        })
    }

    const { mutate: create, isPending: creating } = usePost({ onSuccess })
    const { mutate: update, isPending: updating } = usePatch({ onSuccess })

    const onSubmit = (data: CashflowForm) => {
        if (!childId) return

        const payload = {
            order:childId,
            action: data.action,
            amount: Number(data.amount),
            category: data.category,
            comment: data.comment,
            currency: data.currency,
            currency_course: data.currency_course,
            payment_type: data.payment_type,
        }

        if (currentCashflow?.id) {
            update(`${ORDER_CASHFLOWS}/${currentCashflow.id}`, payload)
        } else {
            create(ORDER_CASHFLOWS, payload)
        }
    }

    if (!childId) {
        return (
            <div className="text-sm text-muted-foreground">
                Xarajatlar mavjud emas
            </div>
        )
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-2 gap-4"
        >
            <FormCombobox
                required
                label="Amal turi"
                name="action"
                control={control}
                options={[
                    { id: 1, name: "Haydovchidan Menejerga" },
                    { id: 2, name: "Menejerdan Haydovchiga" },
                ]}
                valueKey="id"
                labelKey="name"
            />
            <FormCombobox
                required
                label="Xarajat turi"
                name="category"
                control={control}
                options={categoryData}
                valueKey="id"
                labelKey="name"
            />
            <FormCombobox
                required
                label="To'lov turi"
                name="payment_type"
                control={control}
                options={paymentTypes?.results}
                valueKey="id"
                labelKey="name"
                placeholder="To'lov turini tanlang"
            />

            <FormNumberInput
                required
                name="amount"
                label="Miqdor"
                thousandSeparator=" "
                control={control}
                placeholder="0 UZS"
            />
            <FormInput required name="comment" label="Izoh" methods={form} />

            <div className="col-span-2 flex justify-end pt-4">
                <Button
                    type="submit"
                    loading={creating || updating}
                    disabled={creating || updating}
                >
                    Saqlash
                </Button>
            </div>
        </form>
    )
}

export default AddCashflow
