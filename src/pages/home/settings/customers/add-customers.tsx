import { FormFormatNumberInput } from "@/components/form/format-number-input"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { SETTINGS_CUSTOMERS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

const AddCustomerModal = () => {
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()

    const currentForwarder = getData<CustomersType>(SETTINGS_CUSTOMERS)
    const form = useForm<CustomersType>({
        defaultValues: currentForwarder,
    })

    const { handleSubmit, reset } = form

    const onSuccess = () => {
        toast.success(
            `Mijoz muvaffaqiyatli ${currentForwarder?.id ? "tahrirlandi!" : "qo'shildi"} `,
        )

        reset()
        clearKey(SETTINGS_CUSTOMERS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [SETTINGS_CUSTOMERS] })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
    })

    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
    })

    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = async (values: CustomersType) => {
        const isValid = await form.trigger()

        if (!isValid) {
            toast.error("Iltimos, barcha maydonlarni to'g'ri to'ldiring")
            return
        }

        const phoneValue = values.phone_number || ""
        const digitsOnly = phoneValue.replace(/\D/g, "")

        if (digitsOnly.length !== 9) {
            form.setError("phone_number", {
                type: "manual",
                message: "Telefon raqam 12 ta raqamdan iborat bo'lishi kerak",
            })
            toast.error("Telefon raqam to'liq emas")
            return
        }

        if (currentForwarder?.id) {
            updateMutate(`${SETTINGS_CUSTOMERS}/${currentForwarder.id}`, values)
        } else {
            postMutate(SETTINGS_CUSTOMERS, values)
        }
    }

    return (
        <>
            <div className="w-full max-w-4xl mx-auto p-1">
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="grid md:grid-cols-2 gap-4"
                >
                    <FormInput
                        required
                        name="name"
                        label="F.I.O"
                        methods={form}
                    />

                    <FormFormatNumberInput
                        control={form.control}
                        format="+998 ## ### ## ##"
                        required
                        label={"Telefon"}
                        name={"phone_number"}
                        placeholder="+998 __ ___ __ __"
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
        </>
    )
}

export default AddCustomerModal
