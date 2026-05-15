import { FormCombobox } from "@/components/form/combobox"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { SETTINGS_ROLES, SETTINGS_USERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useNavigate, useParams } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { FormProvider, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import PermissionField from "./permission-field"

const UserFormPage = () => {
    const navigate = useNavigate()
    const { id } = useParams({ strict: false })

    const { data: userData } = useGet<UserType>(
        id ? `${SETTINGS_USERS}/${id}` : "",
        { enabled: !!id },
    )
    const { data: userRole } = useGet(SETTINGS_ROLES)

    const form = useForm<UserType>({
        values: id && userData ? { ...userData, password: "" } : undefined,
        defaultValues: {
            first_name: "",
            last_name: "",
            username: "",
            password: "",
            role: 2,
            actions: [],
        },
    })

    const { handleSubmit, control } = form

    const selectedRole = useWatch({ control, name: "role" })
    const roles = (userRole?.results as RolesType[]) ?? []
    const selectedRoleName = roles.find(
        (r) => Number(r.id) === Number(selectedRole),
    )?.name
    const isDriver = selectedRoleName?.toLowerCase() === "driver"

    // Rol tanlanganda o'sha rolning action'lari default belgilanadi.
    // Tahrirlashda esa birinchi yuklashda foydalanuvchining saqlangan
    // action'lari saqlanib qoladi (faqat rol qo'lda o'zgartirilganda
    // yangi rolning default action'lari qo'yiladi).
    const prevRoleRef = useRef<number | undefined>(undefined)
    const keepSavedActionsRef = useRef<boolean>(!!id)

    useEffect(() => {
        if (!selectedRole || roles.length === 0) return
        if (id && !userData) return

        if (keepSavedActionsRef.current) {
            keepSavedActionsRef.current = false
            prevRoleRef.current = Number(selectedRole)
            return
        }

        if (prevRoleRef.current === Number(selectedRole)) return
        prevRoleRef.current = Number(selectedRole)

        const role = roles.find(
            (r) => Number(r.id) === Number(selectedRole),
        )
        form.setValue("actions", role?.actions ?? [], {
            shouldDirty: true,
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRole, userRole, userData, id])

    const queryClient = useQueryClient()

    const { mutateAsync: postMutate, isPending: isPendingCreate } = usePost()
    const { mutateAsync: updateMutate, isPending: isPendingUpdate } = usePatch()
    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = async (values: UserType) => {
        try {
            if (id) {
                const { password, ...rest } = values
                await updateMutate(`${SETTINGS_USERS}/${id}`, password ? values : rest)
            } else {
                await postMutate(SETTINGS_USERS, values)
            }
            queryClient.removeQueries({ queryKey: [SETTINGS_USERS] })
            toast.success(
                id ? "Foydalanuvchi tahrirlandi!" : "Foydalanuvchi qo'shildi!",
            )
            navigate({ to: "/users" })
        } catch { }
    }

    return (
        <div className="p-4">
            <div className="flex items-center gap-3 mb-6">
                <Button
                    size="icon"
                    onClick={() => navigate({ to: "/users" })}
                    className="shrink-0"
                >
                    <ArrowLeft className="h-4" />
                </Button>
                <h1 className="text-xl font-semibold">
                    {id ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi"}
                </h1>
            </div>

            <FormProvider {...form}>
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
                        required={!id}
                        type="password"
                        name="password"
                        label="Parol"
                        methods={form}
                        placeholder={
                            id
                                ? "O'zgartirish uchun kiriting"
                                : "Misol: SecurePass123!"
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

                    {!isDriver && (
                        <div className="md:col-span-2">
                            <PermissionField />
                        </div>
                    )}

                    <div className="md:col-span-2 flex justify-end pt-4">
                        <Button
                            className="min-w-36"
                            type="submit"
                            loading={isPending}
                        >
                            Saqlash
                        </Button>
                    </div>
                </form>
            </FormProvider>
        </div>
    )
}

export default UserFormPage
