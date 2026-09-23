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
import { FormProvider, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import PermissionField from "./permission-field"
import { useTranslation } from "react-i18next"

const AddUserModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const currentDriver = getData<UserType>(SETTINGS_USERS)
    const { data: userRole } = useGet<{ results?: RolesType[] }>(SETTINGS_ROLES)
    const form = useForm<UserType>({
        defaultValues: {
            ...currentDriver,
            password: "",
            actions: currentDriver?.actions ?? [],
        },
    })

    const selectedRole = useWatch({ control: form.control, name: "role" })
    const inheritsRole =
        useWatch({ control: form.control, name: "inherits_role" }) ?? true
    const inheritedActions = !inheritsRole
        ? []
        :
        (userRole?.results ?? []).find(
            (r) => Number(r.id) === Number(selectedRole),
        )?.actions ?? []

    const { handleSubmit, reset } = form

    const onSuccess = () => {
        toast.success(
            currentDriver?.id ? t("messages.success_edit") : t("messages.success_add"),
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
            <FormProvider {...form}>
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <FormInput
                        required
                        name="first_name"
                        label={t("form.first_name")}
                        methods={form}
                        placeholder={`${t("form.example")}: Ali`}
                    />
                    <FormInput
                        required
                        name="last_name"
                        label={t("form.last_name")}
                        methods={form}
                        placeholder={`${t("form.example")}: Aliyev`}
                    />

                    <FormInput
                        required
                        name="username"
                        label={t("auth.username")}
                        methods={form}
                        placeholder={`${t("form.example")}: ali1`}
                    />
                    <FormInput
                        required={!currentDriver?.id}
                        type="password"
                        name="password"
                        label={t("auth.password")}
                        methods={form}
                        placeholder={
                            currentDriver?.id ?
                                t("form.enter_to_change")
                            :   `${t("form.example")}: SecurePass123!`
                        }
                    />

                    <FormCombobox
                        options={userRole?.results ?? []}
                        name="role"
                        control={form.control}
                        labelKey="name"
                        valueKey="id"
                        label={t("form.user_role")}
                    />

                    <div className="md:col-span-2 flex items-center justify-between rounded-lg border p-3">
                        <div>
                            <p className="text-sm font-medium">
                                Rol ruxsatlarini meros olsin
                            </p>
                            <p className="text-xs text-muted-foreground">
                                O‘chirilsa, xodimga faqat quyida belgilangan
                                ruxsatlar amal qiladi.
                            </p>
                        </div>
                        <Switch
                            checked={inheritsRole}
                            onCheckedChange={(checked) =>
                                form.setValue("inherits_role", checked, {
                                    shouldDirty: true,
                                })
                            }
                        />
                    </div>

                    <PermissionField inherited={inheritedActions} />

                    <div className="md:col-span-2 flex justify-end pt-2">
                        <Button
                            className="w-full md:w-auto md:min-w-36"
                            type="submit"
                            loading={isPending}
                        >
                            {t("actions.save")}
                        </Button>
                    </div>
                </form>
            </FormProvider>
        </div>
    )
}

export default AddUserModal
