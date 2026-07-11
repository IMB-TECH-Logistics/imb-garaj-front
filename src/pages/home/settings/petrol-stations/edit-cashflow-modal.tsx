import { FormCombobox } from "@/components/form/combobox"
import FormTextarea from "@/components/form/textarea"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { SETTINGS_PETROL_STATIONS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { type StationCashFlowRow } from "./cashflow-cols"

const STORE_KEY = "petrol-cash-flow"

type FormValues = {
    amount: string | number | ""
    currency: 1 | 2
    currency_course: string | number | ""
    comment: string
}

const CURRENCY_OPTIONS = [
    { id: 1, name: "UZS" },
    { id: 2, name: "USD" },
]

export const useEditCashFlowStore = () => {
    const { setData, getData, clearKey } = useGlobalStore()
    const { openModal } = useModal("petrol-cash-flow-edit")
    return {
        open: (row: StationCashFlowRow) => {
            setData(STORE_KEY, row)
            openModal()
        },
        get: () => getData<StationCashFlowRow>(STORE_KEY),
        clear: () => clearKey(STORE_KEY),
    }
}

const EditCashFlowModal = () => {
    const queryClient = useQueryClient()
    const { closeModal } = useModal("petrol-cash-flow-edit")
    const { getData, clearKey } = useGlobalStore()
    const current = getData<StationCashFlowRow>(STORE_KEY)

    const form = useForm<FormValues>({
        defaultValues: {
            amount: current?.amount ?? "",
            currency: (current?.currency as 1 | 2) ?? 1,
            currency_course: current?.currency_course ?? "",
            comment: current?.comment ?? "",
        },
    })
    const { control, handleSubmit, reset, watch } = form
    const currency = watch("currency")

    useEffect(() => {
        if (!current?.id) return
        reset({
            amount: current.amount ?? "",
            currency: (current.currency as 1 | 2) ?? 1,
            currency_course: current.currency_course ?? "",
            comment: current.comment ?? "",
        })
    }, [current?.id, reset])

    const { mutate, isPending } = usePatch({
        onSuccess: () => {
            toast.success("Yangilandi")
            queryClient.refetchQueries({ queryKey: [SETTINGS_PETROL_STATIONS] })
            queryClient.refetchQueries({
                predicate: (q) =>
                    String(q.queryKey[0]).includes("petrol-stations"),
            })
            clearKey(STORE_KEY)
            closeModal()
        },
    })

    const onSubmit = (values: FormValues) => {
        if (!current?.id) return
        mutate(`${SETTINGS_PETROL_STATIONS}/cash-flows/${current.id}`, {
            amount: Number(values.amount),
            currency: values.currency,
            currency_course:
                values.currency === 2 && values.currency_course !== ""
                    ? Number(values.currency_course)
                    : null,
            comment: values.comment || null,
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormCombobox
                control={control}
                label="Valyuta"
                name="currency"
                options={CURRENCY_OPTIONS}
                valueKey="id"
                labelKey="name"
            />
            <FormNumberInput
                required
                control={control}
                label="Summa"
                name="amount"
                placeholder="Ex: 1 000 000"
                thousandSeparator=" "
                decimalScale={currency === 2 ? 2 : 0}
            />
            {currency === 2 && (
                <FormNumberInput
                    required
                    control={control}
                    label="Valyuta kursi"
                    name="currency_course"
                    placeholder="Ex: 12 000"
                    thousandSeparator=" "
                    decimalScale={0}
                />
            )}
            <FormTextarea label="Izoh" name="comment" methods={form} />
            <div className="flex justify-end mt-1">
                <Button className="min-w-32" type="submit" loading={isPending}>
                    Saqlash
                </Button>
            </div>
        </form>
    )
}

export default EditCashFlowModal
