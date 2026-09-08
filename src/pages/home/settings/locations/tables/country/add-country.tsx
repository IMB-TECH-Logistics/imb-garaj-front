import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { SETTINGS_COUNTRIES } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { showSettingsApiError } from "../../../settings-api-errors"

/** Matches the server-side `max_length` on `Country.name`. */
const NAME_MAX_LENGTH = 255

const AddCountriesModal = () => {
    const queryClient = useQueryClient()
    const { closeModal } = useModal("country-modal")
    const { getData, clearKey } = useGlobalStore()
    const currentRole = getData<RolesType>(SETTINGS_COUNTRIES)

    const form = useForm<RolesType>({
        defaultValues: currentRole,
    })

    const {
        handleSubmit,
        reset,
        formState: { errors },
    } = form

    const onSuccess = () => {
        toast.success(
            `Davlat muvaffaqiyatli ${currentRole?.id ? "tahrirlandi!" : "qo'shildi"}`,
        )
        reset()
        clearKey(SETTINGS_COUNTRIES)
        closeModal()
        queryClient.refetchQueries({ queryKey: [SETTINGS_COUNTRIES] })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
    })

    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
    })

    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = (values: RolesType) => {
        const payload = { ...values, name: values.name?.trim() }
        if (currentRole?.id) {
            updateMutate(`${SETTINGS_COUNTRIES}/${currentRole.id}`, payload, {
                onError: showSettingsApiError,
            })
        } else {
            postMutate(SETTINGS_COUNTRIES, payload, {
                onError: showSettingsApiError,
            })
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <FormInput
                required
                name="name"
                label="Davlat"
                methods={form}
                maxLength={NAME_MAX_LENGTH}
                placeholder="Misol: O'zbekiston"
                registerOptions={{
                    required: "Davlat nomini kiriting",
                    maxLength: {
                        value: NAME_MAX_LENGTH,
                        message: `Nom ${NAME_MAX_LENGTH} ta belgidan oshmasligi kerak`,
                    },
                    validate: (value: unknown) =>
                        String(value ?? "").trim().length > 0 ||
                        "Davlat nomini kiriting",
                }}
            />
            {/* FormInput cannot render its own message — see S1-08. */}
            {errors.name?.message && (
                <span className="mt-1 block text-xs text-destructive">
                    {String(errors.name.message)}
                </span>
            )}

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

export default AddCountriesModal
