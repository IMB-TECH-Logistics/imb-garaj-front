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
import { handleFormError } from "@/lib/show-form-errors"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useParams, useSearch } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

interface CashflowForm {
    amount: string
    order: number|string
    payment_type: number
}

const AddPayment = () => {
    const { t } = useTranslation()
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

    const { handleSubmit, control, reset } = form

    const onSuccess = () => {
        toast.success(
            currentCashflow?.id ? t("toast.updated") : t("toast.added"),
        )
        reset()
        clearKey(TRIPS_ORDERS_PAYMENT)
        closeModal()
        queryClient.invalidateQueries({
            queryKey: [TRIPS_ORDERS_PAYMENT],
        })
    }

    // `trips/order-payments/` backendda mavjud emas (404, Django HTML sahifasi) — xom HTML o'rniga tushunarli xabar
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onError = (err: any) => {
        if (err?.response?.status === 404) {
            toast.error(t("messages.payment_unavailable"), { id: "order-payment-unavailable", duration: 6000 })
            return
        }
        handleFormError(err, form)
    }

    const { mutate: create, isPending: creating } = usePost({ onSuccess, onError })
    const { mutate: update, isPending: updating } = usePatch({ onSuccess, onError })

    const onSubmit = (data: CashflowForm) => {
        if (!childId) return

        const payload = {
            amount: data.amount,
            payment_type: data.payment_type,
            order: childId,
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
                {t("page.no_expenses")}
            </div>
        )
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-2 gap-4"
        >
            {/* Row 2 */}
            <div className="flex gap-3 col-span-2">
                <div className="flex-1 min-w-0">
                    <FormNumberInput
                        required
                        name="amount"
                        label={t("table.amount")}
                        thousandSeparator=" "
                        control={control}
                        placeholder="0 UZS"
                    />
                </div>
            </div>

            {/* Row 3 */}
            <FormCombobox
                required
                label={t("form.payment_type")}
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
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default AddPayment
