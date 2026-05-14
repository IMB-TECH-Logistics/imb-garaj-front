import { FormCombobox } from "@/components/form/combobox"
import { FormNumberInput } from "@/components/form/number-input"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import {
    TECHNICAL_INSPECT,
    SETTINGS_EXPENSES,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { usePatch } from "@/hooks/usePatch"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { FormDatePicker } from "@/components/form/date-picker"
import { VehicleExpenseRow } from "./cols"

type SelectItem = { id: number | string; name: string }

type ExpenseForm = {
    vehicle: number | null
    category: number | null
    amount: string | null
    date: string
    lifespan: string
    comment: string
}

const AddExpenseModal = () => {
    const queryClient = useQueryClient()
    const { closeModal } = useModal("add-expense")
    const { getData, clearKey } = useGlobalStore()
    const current = getData<VehicleExpenseRow>(TECHNICAL_INSPECT)

    const form = useForm<ExpenseForm>({
        defaultValues: {
            vehicle: current?.vehicle ?? null,
            category: current?.category ?? null,
            amount: current?.amount ? String(current.amount) : null,
            date: current?.date ?? new Date().toISOString().split("T")[0],
            lifespan: current?.lifespan ?? "",
            comment: current?.comment ?? "",
        },
    })

    const { handleSubmit, control, reset } = form

    const { data: vehicles } = useGet<SelectItem[]>("selectable/vehicle", {
        params: { model_name: "vehicle" },
    })

    const { data: categoriesData } = useGet<ListResponse<SelectItem>>(SETTINGS_EXPENSES, {
        params: { type: 1, page_size: 100 },
    })
    const categories = categoriesData?.results

    const onSuccess = () => {
        toast.success(current?.id ? "Xarajat tahrirlandi!" : "Xarajat qo'shildi!")
        reset()
        clearKey(TECHNICAL_INSPECT)
        closeModal()
        queryClient.refetchQueries({ queryKey: [TECHNICAL_INSPECT] })
    }

    const { mutate: postMutate, isPending: creating } = usePost({ onSuccess })
    const { mutate: patchMutate, isPending: updating } = usePatch({ onSuccess })
    const isPending = creating || updating

    const onSubmit = (values: ExpenseForm) => {
        if (current?.id) {
            patchMutate(`${TECHNICAL_INSPECT}/${current.id}`, values)
        } else {
            postMutate(TECHNICAL_INSPECT, values)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <FormCombobox
                required
                label="Avtomobil"
                name="vehicle"
                control={control}
                options={vehicles || []}
                valueKey="id"
                labelKey="name"
                placeholder="Avtomobilni tanlang"
            />
            <FormCombobox
                required
                label="Xarajat turi"
                name="category"
                control={control}
                options={categories || []}
                valueKey="id"
                labelKey="name"
                placeholder="Xarajat turini tanlang"
            />
            <FormNumberInput
                required
                name="amount"
                label="Summa"
                control={control}
                thousandSeparator=" "
                placeholder="0"
            />
            <FormDatePicker
                required
                label="Sana"
                control={control}
                name="date"
                placeholder="Sanani tanlang"
                className="w-full"
            />
            <FormDatePicker
                required
                label="Amal muddati"
                control={control}
                name="lifespan"
                placeholder="Muddatni tanlang"
                className="w-full"
            />
            <FormInput
                name="comment"
                label="Izoh"
                methods={form}
                placeholder="Qo'shimcha izoh..."
            />

            <div className="col-span-2 flex justify-end pt-2">
                <Button type="submit" loading={isPending} className="min-w-36">
                    Saqlash
                </Button>
            </div>
        </form>
    )
}

export default AddExpenseModal
