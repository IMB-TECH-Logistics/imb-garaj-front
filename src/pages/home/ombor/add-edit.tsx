import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { WAREHOUSE_PRODUCTS, WAREHOUSE_STATS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { UNIT_OPTIONS, type OmborProduct } from "./cols"

type FormValues = {
    name: string
    unit: string
    unit_price: number | string
    quantity: number | string
    expiry_date: string | null
}

const OmborAddEdit = ({ current }: { current?: OmborProduct | null }) => {
    const queryClient = useQueryClient()
    const { closeModal } = useModal("ombor-create")

    const form = useForm<FormValues>({
        defaultValues: {
            name: current?.name ?? "",
            unit: current?.unit ?? "piece",
            unit_price: current?.unit_price ?? "",
            quantity: current?.quantity ?? "",
            expiry_date: current?.expiry_date ?? null,
        },
    })
    const { handleSubmit, control, reset } = form

    useEffect(() => {
        reset({
            name: current?.name ?? "",
            unit: current?.unit ?? "piece",
            unit_price: current?.unit_price ?? "",
            quantity: current?.quantity ?? "",
            expiry_date: current?.expiry_date ?? null,
        })
    }, [current, reset])

    const refetch = () => {
        queryClient.refetchQueries({ queryKey: [WAREHOUSE_PRODUCTS] })
        queryClient.refetchQueries({ queryKey: [WAREHOUSE_STATS] })
    }

    const { mutate: postMutate, isPending: creating } = usePost({
        onSuccess: () => {
            toast.success("Mahsulot qo'shildi")
            refetch()
            closeModal()
        },
    })
    const { mutate: patchMutate, isPending: updating } = usePatch({
        onSuccess: () => {
            toast.success("Mahsulot tahrirlandi")
            refetch()
            closeModal()
        },
    })

    const onSubmit = (data: FormValues) => {
        const payload = {
            name: data.name.trim(),
            unit: data.unit,
            unit_price: Number(data.unit_price) || 0,
            quantity: Number(data.quantity) || 0,
            expiry_date: data.expiry_date || null,
        }
        if (current?.id) {
            patchMutate(`${WAREHOUSE_PRODUCTS}/${current.id}`, payload)
        } else {
            postMutate(WAREHOUSE_PRODUCTS, payload)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormInput
                required
                name="name"
                label="Nomi"
                methods={form}
                placeholder="Solyarka balon"
            />
            <FormCombobox
                required
                control={control}
                label="Birlik"
                name="unit"
                options={UNIT_OPTIONS}
                valueKey="id"
                labelKey="name"
            />
            <FormNumberInput
                required
                name="unit_price"
                label="Birlik narxi (so'm)"
                control={control}
                thousandSeparator=" "
                placeholder="Ex: 850 000"
            />
            <FormNumberInput
                required
                name="quantity"
                label="Miqdori"
                control={control}
                thousandSeparator=" "
                placeholder="Ex: 100"
            />
            <FormDatePicker
                label="Tahminiy eskirish sanasi (ixtiyoriy)"
                control={control}
                name="expiry_date"
                placeholder="Sana tanlang"
                className="w-full"
            />
            <div className="flex justify-end pt-2">
                <Button
                    type="submit"
                    loading={creating || updating}
                    className="min-w-32"
                >
                    Saqlash
                </Button>
            </div>
        </form>
    )
}

export default OmborAddEdit
