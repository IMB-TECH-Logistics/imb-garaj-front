import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { DRIVER_SALARIES, SETTINGS_REGIONS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { type DriverSalaryRow } from "./cols"

type FormValues = {
    from_region: number | ""
    to_region: number | ""
    amount: number | string | ""
    valid_from: string
}

const AddDriverSalaryModal = () => {
    const qc = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const current = getData<DriverSalaryRow>(DRIVER_SALARIES)

    const { data: regionsData } = useGet<ListResponse<{ id: number; name: string }>>(
        SETTINGS_REGIONS,
        { params: { page_size: 1000 } },
    )
    const regionOptions = regionsData?.results ?? []

    const form = useForm<FormValues>({
        defaultValues: {
            from_region: current?.from_region ?? "",
            to_region: current?.to_region ?? "",
            amount: current?.current_amount?.amount ?? "",
            valid_from:
                current?.current_amount?.valid_from ??
                new Date().toISOString().split("T")[0],
        },
    })
    const { handleSubmit, control, reset } = form

    useEffect(() => {
        reset({
            from_region: current?.from_region ?? "",
            to_region: current?.to_region ?? "",
            amount: current?.current_amount?.amount ?? "",
            valid_from:
                current?.current_amount?.valid_from ??
                new Date().toISOString().split("T")[0],
        })
    }, [current?.id, reset])

    const onSuccess = () => {
        toast.success(
            current?.id ? "Tarif yangilandi" : "Tarif qo'shildi",
        )
        qc.refetchQueries({ queryKey: [DRIVER_SALARIES] })
        clearKey(DRIVER_SALARIES)
        closeModal()
    }

    const { mutate: postMutate, isPending: posting } = usePost({ onSuccess })
    const { mutate: patchMutate, isPending: patching } = usePatch({ onSuccess })

    const onSubmit = (data: FormValues) => {
        const payload = {
            from_region: Number(data.from_region),
            to_region: Number(data.to_region),
            amount: Number(data.amount),
            valid_from: data.valid_from,
        }
        if (current?.id) {
            patchMutate(`${DRIVER_SALARIES}/${current.id}/update`, payload)
        } else {
            postMutate(`${DRIVER_SALARIES}/create`, payload)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
                <FormCombobox
                    required
                    control={control}
                    label="Qaerdan"
                    name="from_region"
                    options={regionOptions}
                    valueKey="id"
                    labelKey="name"
                />
                <FormCombobox
                    required
                    control={control}
                    label="Qayerga"
                    name="to_region"
                    options={regionOptions}
                    valueKey="id"
                    labelKey="name"
                />
            </div>
            <FormNumberInput
                required
                control={control}
                label="Summa (UZS)"
                name="amount"
                thousandSeparator=" "
                decimalScale={0}
                placeholder="Ex: 500 000"
            />
            <FormDatePicker
                required
                control={control}
                label="Amal qila boshlash sanasi"
                name="valid_from"
                placeholder="Sanani tanlang"
                className="w-full"
            />
            <div className="flex justify-end pt-1">
                <Button
                    type="submit"
                    loading={posting || patching}
                    className="min-w-32"
                >
                    Saqlash
                </Button>
            </div>
        </form>
    )
}

export default AddDriverSalaryModal
