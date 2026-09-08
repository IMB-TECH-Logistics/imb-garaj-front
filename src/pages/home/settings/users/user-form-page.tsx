import { FormCombobox } from "@/components/form/combobox"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { SETTINGS_ROLES, SETTINGS_USERS } from "@/constants/api-endpoints"
import { useHasAction, useUser } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import PermissionNotice from "../../permission-notice"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useNavigate, useParams } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { FormProvider, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import PermissionField from "./permission-field"

/**
 * Parol murakkabligi (S2-15). Backend DRF serializer'i Django'ning
 * AUTH_PASSWORD_VALIDATORS'ini chaqirmaydi, shuning uchun "1" kabi parol
 * ham qabul qilinardi. Bu frontend to'sig'i — backendda ham qo'yilishi shart
 * (backend-kerak/F4.md ga yozilgan).
 */
const COMMON_PASSWORDS = [
    "password",
    "parol",
    "12345678",
    "123456789",
    "1234567890",
    "qwerty123",
    "admin123",
    "garaj123",
]

export const validatePassword = (value: unknown) => {
    const password = String(value ?? "")
    // Tahrirlashda bo'sh qoldirilsa — parol o'zgartirilmaydi.
    if (!password) return true
    if (password.length < 8) {
        return "Parol kamida 8 ta belgidan iborat bo'lsin"
    }
    if (!/[a-zA-Z]/.test(password)) {
        return "Parolda kamida bitta harf bo'lsin"
    }
    if (!/\d/.test(password)) {
        return "Parolda kamida bitta raqam bo'lsin"
    }
    if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
        return "Bu parol juda oddiy — boshqasini tanlang"
    }
    return true
}

/**
 * Validatsiya xabarlarini toast orqali ko'rsatish.
 * Sabab: umumiy `FormInput` komponentida `hideError={false}` berilganda
 * `error.message` himoyasiz o'qiladi (components/form/input.tsx:83) va xatosiz
 * holatda sahifa qulab tushadi. O'sha komponent boshqa agent zonasida
 * bo'lgani uchun bu yerda tegilmaydi — xabar toast bilan yetkaziladi (S2-09).
 */
export const showValidationErrors = (errors: Record<string, any>) => {
    const messages = Object.values(errors)
        .map((e) => (e as { message?: string })?.message)
        .filter(Boolean) as string[]
    if (messages.length) {
        toast.error(messages.join(" · "), { duration: 6000 })
    }
}

const UserFormInner = () => {
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
                    onSubmit={handleSubmit(onSubmit, showValidationErrors)}
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
                        registerOptions={{ validate: validatePassword }}
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

/**
 * Sahifa darajasidagi to'siq (2-raund, RBAC yangi Low-1).
 *
 * Ilgari 0 ruxsatli rol (masalan Driver) `/users/create` ni URL orqali ochib,
 * tizimdagi BUTUN ruxsat matritsasini (barcha modullar va ularning kodlari)
 * o'qiy olardi. Yuborish 403 bilan to'xtatilardi, lekin ruxsatlar ro'yxatining
 * o'zi ham ma'lumot — shuning uchun endi sahifa umuman chizilmaydi.
 */
const UserFormPage = () => {
    const { data: profile, isLoading } = useUser()
    const canControl = useHasAction("settings_users_control")

    // Profil hali kelmagan bo'lsa hech narsa aytilmaydi — aks holda ruxsati
    // BOR foydalanuvchiga bir lahza "ruxsat yo'q" chaqnab ketardi.
    if (isLoading || !profile) return null

    if (!canControl) {
        return (
            <PermissionNotice
                title="Foydalanuvchilarni boshqarishga ruxsatingiz yo'q"
                hint="Bu sahifa yangi foydalanuvchi yaratish va unga ruxsat berish uchun. Kerak bo'lsa administratordan «Foydalanuvchilar — boshqarish» ruxsatini so'rang."
            />
        )
    }

    return <UserFormInner />
}

export default UserFormPage
