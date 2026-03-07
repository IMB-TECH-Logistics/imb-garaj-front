import { FormCheckbox } from "@/components/form/checkbox"
import { FormCombobox } from "@/components/form/combobox"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { SETTINGS_ROLES, SETTINGS_USERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

const AddUserModal = () => {
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const currentDriver = getData<UserType>(SETTINGS_USERS)
    const { data: userRole } = useGet(SETTINGS_ROLES)
    const form = useForm<UserType>({
        defaultValues: {
            ...currentDriver,
            password: "",
        },
    })

    const { handleSubmit, reset } = form

    const onSuccess = () => {
        toast.success(
            `Foydalanuvchi muvaffaqiyatli ${currentDriver?.id ? "tahrirlandi!" : "qo'shildi"}`,
        )
        reset()
        clearKey(SETTINGS_USERS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [SETTINGS_USERS] })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
    })

    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
    })

    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = (values: UserType) => {
        if (currentDriver?.id) {
            const { password, ...restValues } = values

            const payload = password ? values : restValues

            updateMutate(`${SETTINGS_USERS}/${currentDriver.id}`, payload)
        } else {
            postMutate(SETTINGS_USERS, values)
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                <FormInput
                    required
                    name="first_name"
                    label="Ism"
                    methods={form}
                    placeholder="Misol: Ali"
                />
                <FormInput
                    required
                    name="last_name"
                    label="Familiya"
                    methods={form}
                    placeholder="Misol: Aliyev"
                />

                <FormInput
                    required
                    name="username"
                    label="Login"
                    methods={form}
                    placeholder="Misol: ali1"
                />
                <FormInput
                    required={!currentDriver?.id}
                    type="password"
                    name="password"
                    label="Parol"
                    methods={form}
                    placeholder={
                        currentDriver?.id ?
                            "O'zgartirish uchun kiriting"
                        :   "Misol: SecurePass123!"
                    }
                />

                <FormCombobox
                    options={userRole?.results ?? []}
                    name="role"
                    control={form.control}
                    labelKey="name"
                    valueKey="id"
                    label="Foydalanuvchi roli"
                />
     

                <div className="md:col-span-2 flex justify-end pt-2">
                    <Button
                        className="w-full md:w-auto md:min-w-36"
                        type="submit"
                        loading={isPending}
                    >
                        Saqlash
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default AddUserModal
