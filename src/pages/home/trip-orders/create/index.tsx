import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import { Button } from "@/components/ui/button"
import {
    SETTINGS_SELECTABLE_CARGO_TYPE,
    SETTINGS_SELECTABLE_CLIENT,
    SETTINGS_SELECTABLE_DISTRICT,
    SETTINGS_SELECTABLE_PAYMENT_TYPE,
    MANAGERS_ORDERS,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import { useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"
import { FormNumberInput } from "@/components/form/number-input"
import { Plus, X } from "lucide-react"
import { useTranslation } from "react-i18next"

type ClientType = {
    id: number | string
    name: string
}

const AddTripOrders = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { getData, clearKey } = useGlobalStore()
    const { closeModal } = useModal("create")
    const currentTripOrder = getData<TripOrdersRow>(MANAGERS_ORDERS)
    const { parentId } = useParams({ strict: false })

    const { data: districtsData } = useGet<DistrictType[]>(
        SETTINGS_SELECTABLE_DISTRICT,
        { params: { model_name: "district" } },
    )
    const { data: clientData } = useGet<ClientType[]>(
        SETTINGS_SELECTABLE_CLIENT,
        { params: { model_name: "client" } },
    )
    const { data: paymentType } = useGet<ClientType[]>(
        SETTINGS_SELECTABLE_PAYMENT_TYPE,
        { params: { model_name: "payment-type" } },
    )
    const { data: cargoType } = useGet<ClientType[]>(
        SETTINGS_SELECTABLE_CARGO_TYPE,
        { params: { model_name: "cargo-type" } },
    )

    const form = useForm<TripOrdersRow>({
        defaultValues: {
            loading: currentTripOrder?.loading,
            unloading: currentTripOrder?.unloading,
            trip: currentTripOrder?.trip,
            date: currentTripOrder?.date,
            type: currentTripOrder?.type,
            client: currentTripOrder?.client,
            cargo_type: currentTripOrder?.cargo_type,
            incomes: currentTripOrder?.incomes?.length
                ? currentTripOrder.incomes
                : [
                    {

                        payment_type: null,
                        currency: null,
                        currency_course: null,
                        amount: null,
                    },
                ],
        },
    })

    const { handleSubmit, control, reset, watch } = form

    const { fields, append, remove } = useFieldArray({
        control,
        name: "incomes",
    })

    const onSuccess = () => {
        toast.success(
            currentTripOrder?.id ? t("toast.updated") : t("toast.added"),
        )
        reset()
        clearKey(MANAGERS_ORDERS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [MANAGERS_ORDERS] })
    }

    const { mutate: create, isPending: creating } = usePost({ onSuccess })
    const { mutate: update, isPending: updating } = usePatch({ onSuccess })
    const isPending = creating || updating

    const onSubmit = (data: TripOrdersRow) => {
        const formattedIncomes = data.incomes!.map((p: any) => {
            const payment: any = {
                currency: p.currency,
                amount: String(p.amount),
                payment_type: p.payment_type,
            }
            if (p.currency === 2) {
                payment.currency_course = String(p.currency_course)
            }
            return payment
        })

        const formattedData = {
            loading: data.loading,
            unloading: data.unloading,
            date: data.date,
            type: data.type,
            client: data.client,
            trip: parentId,
            cargo_type: data?.cargo_type,
            incomes: formattedIncomes,
        }

        if (currentTripOrder?.id) {
            update(`${MANAGERS_ORDERS}/${currentTripOrder.id}`, formattedData)
        } else {
            create(MANAGERS_ORDERS, formattedData)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto no-scrollbar-x">
            <FormCombobox
                required
                label={t("form.order_type")}
                name="type"
                control={control}
                options={[
                    { id: 1, name: "Yukli" },
                    { id: 2, name: "Yuksiz" },
                ]}
                valueKey="id"
                labelKey="name"
                placeholder={t("form.order_type")}
            />
            <FormDatePicker
                required
                label={t("form.date")}
                control={control}
                name="date"
                placeholder={t("form.select_date")}
                className="w-full"
            />
            <FormCombobox
                required
                label={t("form.cargo_owner")}
                name="client"
                control={control}
                options={clientData}
                labelKey="name"
                valueKey="id"
                placeholder={t("form.cargo_owner")}
            />
            <FormCombobox
                required
                label={t("form.loading_address")}
                name="loading"
                control={control}
                options={districtsData}
                valueKey="id"
                labelKey="name"
                placeholder={t("form.region")}
            />
            <FormCombobox
                required
                label={t("form.unloading_address")}
                name="unloading"
                control={control}
                options={districtsData}
                valueKey="id"
                labelKey="name"
                placeholder={t("form.region")}
            />
            <FormCombobox
                required
                label={t("form.cargo_type")}
                name={`cargo_type`}
                control={control}
                options={cargoType}
                valueKey="id"
                labelKey="name"
                placeholder={t("form.cargo_type")}
            />
            <div className="col-span-2 flex flex-col gap-4">
                {fields.map((field, index) => {
                    const selectedCurrency = watch(`incomes.${index}.currency`)

                    return (
                        <div
                            key={field.id}
                            className="grid grid-cols-2 gap-4 border rounded-lg p-4 relative"
                        >
                            <span className="col-span-2 font-medium text-sm text-muted-foreground">
                                To'lov #{index + 1}
                            </span>


                            <FormCombobox
                                required
                                label={t("form.payment_type")}
                                name={`incomes.${index}.payment_type`}
                                control={control}
                                options={paymentType || undefined}
                                valueKey="id"
                                labelKey="name"
                                placeholder="To'lov turini tanlang"
                            />
                            <FormCombobox
                                required
                                label={t("form.currency")}
                                name={`incomes.${index}.currency`}
                                control={control}
                                options={[
                                    { value: 1, label: "UZS - So'm" },
                                    { value: 2, label: "USD - AQSh dollari" },
                                ]}
                                valueKey="value"
                                labelKey="label"
                                placeholder={t("form.select_currency")}
                            />
                            {selectedCurrency === 2 && (
                                <FormNumberInput
                                    required
                                    thousandSeparator=" "
                                    name={`incomes.${index}.currency_course`}
                                    label={t("form.currency_rate")}
                                    placeholder="12 206 UZS"
                                    control={control}
                                />
                            )}
                            <FormNumberInput
                                required
                                name={`incomes.${index}.amount`}
                                thousandSeparator=" "
                                label={t("table.amount")}
                                placeholder="12 206 000 UZS"
                                control={control}
                            />

                            {fields.length > 1 && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-3 right-3"
                                    onClick={() => remove(index)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    )
                })}

                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                        append({
                            payment_type: null,
                            currency: null,
                            currency_course: null,
                            amount: null,
                        })
                    }
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {t("actions.add")}
                </Button>
            </div>

            <div className="col-span-2 flex justify-end gap-4 pt-4">
                <Button type="submit" loading={isPending} disabled={isPending}>
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default AddTripOrders