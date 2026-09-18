import { FormCombobox } from "@/components/form/combobox"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { SETTINGS_EXPENSES } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

export enum ExpenseTypeEnum {
    TRUCK = 1,
    ORDER = 2,
    TRIP = 3,
}

export const EXPENSE_TYPE_OPTIONS = [
    { label: "Yuk mashinasi uchun", value: ExpenseTypeEnum.TRUCK },
    { label: "Buyurtma uchun", value: ExpenseTypeEnum.ORDER },
    { label: "Reys uchun", value: ExpenseTypeEnum.TRIP },
]

export enum FlowTypeEnum {
    EXPENSE = -1,
    INCOME = 1,
}

export const FLOW_TYPE_OPTIONS = [
    { label: "Chiqim", value: FlowTypeEnum.EXPENSE },
    { label: "Kirim", value: FlowTypeEnum.INCOME },
]

const AddExpensesModal = () => {
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const currentRole = getData<VehicleRoleType>(SETTINGS_EXPENSES)

    const form = useForm<VehicleRoleType>({
        defaultValues: currentRole,
    })

    const { handleSubmit, reset } = form

    const onSuccess = () => {
        toast.success(
            `Xarajat muvaffaqiyatli ${currentRole?.id ? "tahrirlandi!" : "qo'shildi"}`,
        )
        reset()
        clearKey(SETTINGS_EXPENSES)
        closeModal()
        queryClient.refetchQueries({ queryKey: [SETTINGS_EXPENSES] })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
    })

    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
    })

    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = (values: VehicleRoleType) => {
        const payload = {
            ...values,
            type: Number(String(values.type).replaceAll('"', "")),
            flow_type: Number(String(values.flow_type).replaceAll('"', "")),
        }

        if (currentRole?.id) {
            updateMutate(`${SETTINGS_EXPENSES}/${currentRole.id}`, payload)
        } else {
            postMutate(SETTINGS_EXPENSES, payload)
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-1">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                <FormInput
                    required
                    name="name"
                    label="Xarajat nomi"
                    methods={form}
                />
                <FormCombobox
                    required
                    name="type"
                    label="Xarajat turi"
                    options={EXPENSE_TYPE_OPTIONS}
                    control={form.control}
                    labelKey="label"
                    valueKey="value"
                />
                <FormCombobox
                    required
                    name="flow_type"
                    label="Yo'nalishi"
                    options={FLOW_TYPE_OPTIONS}
                    control={form.control}
                    labelKey="label"
                    valueKey="value"
                />

                <div className="flex items-center justify-end gap-2 md:col-span-2">
                    <Button
                        className="min-w-36 w-full md:w-max"
                        type="submit"
                        loading={isPending}
                    >
                        {"Saqlash"}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default AddExpensesModal
