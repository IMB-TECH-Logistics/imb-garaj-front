import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import { SETTINGS_EXPENSES, TECHNICAL_INSPECT } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

export default function CreateTechnicInspect() {
    const queryClient = useQueryClient()
    const { getData } = useGlobalStore()
    const currentTech = getData(TECHNICAL_INSPECT)
    const { closeModal } = useModal("create")
    const form = useForm({
        defaultValues: {
            ...currentTech,
            vehicle: currentTech?.vehicle,
        },
    })
    const { handleSubmit, reset } = form

    function onSuccess() {
        toast.success(
            currentTech?.id ?
                "Muvaffaqiyatli tahrirlandi!"
            :   "Muvaffaqiyatli qo'shildi!",
        )
        queryClient.invalidateQueries({ queryKey: [TECHNICAL_INSPECT] })
        closeModal()
        reset()
    }
    const { mutate: createMutate } = usePost({
        onSuccess,
    })
    const { mutate: editMutate } = usePatch({
        onSuccess,
    })

    const { data: expenses } =
        useGet<ListResponse<ExpenseCategory>>(SETTINGS_EXPENSES)
        
    function onSubmit(value: TechnicInspect) {
        if (currentTech?.id) {
            editMutate(`${TECHNICAL_INSPECT}/${currentTech?.id}`, value)
        } else {
            createMutate(TECHNICAL_INSPECT, value)
        }
    }
    return (
        <>
            <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                <FormCombobox
                    options={expenses?.results}
                    label="Avtomobil"
                    control={form.control}
                    name="vehicle"
                    labelKey="name"
                    valueKey="id"
                    required
                />
                <FormCombobox
                    options={expenses?.results}
                    label="Xarajat turi"
                    control={form.control}
                    name="category"
                    labelKey="name"
                    valueKey="id"
                    required
                />
                <div className="grid grid-cols-2 gap-2">
                    <FormDatePicker
                        name="date"
                        label="Sana"
                        control={form.control}
                        fullWidth
                        required
                    />
                    <FormDatePicker
                        name="lifespan"
                        label="Muddat"
                        control={form.control}
                        fullWidth
                        required
                    />
                </div>
                <FormNumberInput
                    control={form.control}
                    label="Summa"
                    name="amount"
                    thousandSeparator=" "
                    decimalScale={0}
                    required
                />
                <FormTextarea
                    methods={form}
                    name="comment"
                    label="Izoh"
                    required
                    placeholder="Izoh yozing"
                />
                <div className="flex items-center justify-end">
                    <Button>Saqlash</Button>
                </div>
            </form>
        </>
    )
}
