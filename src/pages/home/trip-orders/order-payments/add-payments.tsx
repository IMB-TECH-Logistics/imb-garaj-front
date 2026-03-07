import { FormCombobox } from "@/components/form/combobox"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import {
    SETTINGS_SELECTABLE_EXPENSE_CATEGORY,
    SETTINTS_PAYMENT_TYPE,
    TRIPS_ORDERS_PAYMENT,
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
    currency: number
    currency_course: string
    amount: string
    currency_amount: string
    order: number|string
    payment_type: number
}

const AddPayment = () => {
    const queryClient = useQueryClient()
    const { getData, clearKey } = useGlobalStore()
    const { closeModal } = useModal("create-order-payment")
    const search = useSearch({ strict: false })
     const { parentId, childId } = useParams({ strict: false })
    const { data: categoryData } = useGet<ExpenseCategory[]>(
        SETTINGS_SELECTABLE_EXPENSE_CATEGORY,
    )
    const currentCashflow = getData<CashflowForm & { id?: number }>(
        TRIPS_ORDERS_PAYMENT,
    )

    const { data: expensetypes } = useGet<ListResponse<RolesType>>(
        SETTINTS_PAYMENT_TYPE,
    )

    const form = useForm<CashflowForm>({
        defaultValues: {
            ...currentCashflow,
            order:childId,
        },
    })

    const { handleSubmit, control, reset, watch } = form
    const selectedCurrency = watch("currency")

    const onSuccess = () => {
        toast.success(
            currentCashflow?.id ? "To'lov tahrirlandi!" : "To'lov qo'shildi!",
        )
        reset()
        clearKey(TRIPS_ORDERS_PAYMENT)
        closeModal()
        queryClient.invalidateQueries({
            queryKey: [TRIPS_ORDERS_PAYMENT],
        })
    }

    const { mutate: create, isPending: creating } = usePost({ onSuccess })
    const { mutate: update, isPending: updating } = usePatch({ onSuccess })

    const onSubmit = (data: CashflowForm) => {
        if (!childId) return

        const payload = {
            ...data,
            order:childId,
        }

        if (currentCashflow?.id) {
            update(`${TRIPS_ORDERS_PAYMENT}/${currentCashflow.id}`, payload)
        } else {
            create(TRIPS_ORDERS_PAYMENT, payload)
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
            {/* Row 2 */}
            <FormCombobox
                required
                label="Valyuta"
                name="currency"
                control={control}
                options={[
                    { value: 1, label: "UZS - So'm" },
                    { value: 2, label: "USD - AQSh dollari" },
                ]}
                valueKey="value"
                labelKey="label"
                placeholder="Valyutani tanlang"
            />
            {selectedCurrency === 2 && (
                <FormNumberInput
                    required
                    thousandSeparator=" "
                    name="currency_course"
                    label="Valyuta kursi"
                    placeholder="12 206 UZS"
                    control={control}
                />
            )}

            {/* Row 3 - These stay fixed in position */}
            <FormNumberInput
                required
                name="amount"
                label="Miqdor"
                thousandSeparator=" "
                control={control}
                placeholder="0 UZS"
            />
            <FormNumberInput
                required
                name="currency_amount"
                label="Valyuta miqdori"
                thousandSeparator=" "
                control={control}
            />

            <FormCombobox
                required
                label="To'lov turi"
                name="payment_type"
                control={control}
                options={expensetypes?.results}
                labelKey="name"
                valueKey="id"
            />

            {/* Submit button */}
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

export default AddPayment
