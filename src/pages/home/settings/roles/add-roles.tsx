import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { SETTINGS_ROLES } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { FormProvider, useForm } from "react-hook-form"
import { toast } from "sonner"
import PermissionField from "../users/permission-field"

const  AddRolesModal = () => {
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const currentRole = getData<RolesType>(SETTINGS_ROLES)

    const form = useForm<RolesType>({
        defaultValues: {
            name: currentRole?.name ?? "",
            actions: currentRole?.actions ?? [],
        },
    })

    const { handleSubmit, reset } = form

    const onSuccess = () => {
        toast.success(
            `Rol muvaffaqiyatli ${currentRole?.id ? "tahrirlandi!" : "qo'shildi"}`,
        )
        reset()
        clearKey(SETTINGS_ROLES)
        closeModal()
        queryClient.refetchQueries({ queryKey: [SETTINGS_ROLES] })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
    })

    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
    })

    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = (values: RolesType) => {
        if (currentRole?.id) {
            updateMutate(`${SETTINGS_ROLES}/${currentRole.id}`, values)
        } else {
            postMutate(SETTINGS_ROLES, values)
        }
    }

    return (
        <FormProvider {...form}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormInput required name="name" label="Rol turi" methods={form} />

                <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1">
                    <PermissionField />
                </div>

                <div className="flex items-center justify-end  mt-3">
                    <Button
                        className="min-w-36 w-full md:w-max"
                        type="submit"
                        loading={isPending}
                    >
                        {"Saqlash"}
                    </Button>
                </div>
            </form>
        </FormProvider>
    )
}

export default  AddRolesModal
