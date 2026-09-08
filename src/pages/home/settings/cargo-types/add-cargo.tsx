import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { SETTINGS_CARGO_TYPE } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

/**
 * Validatsiya xabarlarini toast orqali ko'rsatish.
 * Sabab: umumiy `FormInput` komponentida `hideError={false}` berilganda
 * `error.message` himoyasiz o'qiladi (components/form/input.tsx:83) va xatosiz
 * holatda sahifa qulab tushadi. O'sha komponent boshqa agent zonasida
 * bo'lgani uchun bu yerda tegilmaydi — xabar toast bilan yetkaziladi (S2-09).
 */
const showValidationErrors = (errors: Record<string, any>) => {
    const messages = Object.values(errors)
        .map((e) => (e as { message?: string })?.message)
        .filter(Boolean) as string[]
    if (messages.length) {
        toast.error(messages.join(" · "), { duration: 6000 })
    }
}

const AddCargoModal = () => {
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const currentCargo = getData<RolesType>(SETTINGS_CARGO_TYPE)

    // Takroriy nom tekshiruvi uchun mavjud ro'yxat (S3-14).
    const { data: existing } = useGet<ListResponse<RolesType>>(
        SETTINGS_CARGO_TYPE,
        { params: { page_size: 1000 } },
    )

    const form = useForm<RolesType>({
        values: currentCargo?.id ? currentCargo : undefined,
        defaultValues: { name: "" },
    })

    const { handleSubmit, reset } = form

    const onSuccess = () => {
        toast.success(
            `Yuk turi muvaffaqiyatli ${currentCargo?.id ? "tahrirlandi!" : "qo'shildi"}`,
        )
        reset()
        clearKey(SETTINGS_CARGO_TYPE)
        closeModal()
        queryClient.refetchQueries({ queryKey: [SETTINGS_CARGO_TYPE] })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
    })

    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
    })

    const isPending = isPendingCreate || isPendingUpdate

    const isDuplicateName = (value: unknown) => {
        const normalized = String(value ?? "")
            .trim()
            .toLowerCase()
        if (!normalized) return true
        const clash = (existing?.results ?? []).some(
            (item) =>
                item.id !== currentCargo?.id &&
                String(item.name ?? "")
                    .trim()
                    .toLowerCase() === normalized,
        )
        return clash ? "Bu nomdagi yuk turi allaqachon mavjud" : true
    }

    const onSubmit = (values: RolesType) => {
        const payload = { ...values, name: String(values.name ?? "").trim() }

        if (currentCargo?.id) {
            updateMutate(`${SETTINGS_CARGO_TYPE}/${currentCargo.id}`, payload)
        } else {
            postMutate(SETTINGS_CARGO_TYPE, payload)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit, showValidationErrors)} className="p-1">
            <FormInput
                required
                name="name"
                label="Yuk turi"
                methods={form}
                registerOptions={{ validate: isDuplicateName }}
            />

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
    )
}

export default AddCargoModal
