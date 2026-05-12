import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { useModal } from "@/hooks/useModal"
import { OmborCategory, useOmborStore } from "@/store/ombor-store"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

type FormValues = {
    name: string
    unit_label: string
    unit_price: number | string
    quantity: number | string
}

const OmborAddEdit = ({ current }: { current?: OmborCategory | null }) => {
    const { closeModal } = useModal("ombor-create")
    const { addCategory, updateCategory } = useOmborStore()

    const form = useForm<FormValues>({
        defaultValues: {
            name: current?.name ?? "",
            unit_label: current?.unit_label ?? "",
            unit_price: current?.unit_price ?? "",
            quantity: current?.quantity ?? "",
        },
    })
    const { handleSubmit, control, reset } = form

    useEffect(() => {
        reset({
            name: current?.name ?? "",
            unit_label: current?.unit_label ?? "",
            unit_price: current?.unit_price ?? "",
            quantity: current?.quantity ?? "",
        })
    }, [current, reset])

    const onSubmit = (data: FormValues) => {
        const payload = {
            name: data.name.trim(),
            unit_label: data.unit_label.trim(),
            unit_price: Number(data.unit_price) || 0,
            quantity: Number(data.quantity) || 0,
        }
        if (current?.id) {
            updateCategory(current.id, payload)
            toast.success("Muvaffaqiyatli tahrirlandi!")
        } else {
            addCategory(payload)
            toast.success("Muvaffaqiyatli qo'shildi!")
        }
        closeModal()
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormInput required name="name" label="Nomi" methods={form} placeholder="Solyarka balon" />
            <FormInput required name="unit_label" label="Birlik" methods={form} placeholder="balon / litr / dona" />
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
            <div className="flex justify-end pt-2">
                <Button type="submit" className="min-w-32">
                    Saqlash
                </Button>
            </div>
        </form>
    )
}

export default OmborAddEdit
