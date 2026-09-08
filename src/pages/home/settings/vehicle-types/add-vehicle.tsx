import { FormCombobox } from "@/components/form/combobox"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { SETTINGS_VEHICLE_TYPE } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

const vehicleTypeOptions = [
    { value: "truck", label: "Avtomobil" },
    { value: "trailer", label: "Tirkama" },
]

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

const AddVehicleModal = () => {
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const currentVehicleType = getData<VehicleRoleType>(SETTINGS_VEHICLE_TYPE)

    // Takroriy nom tekshiruvi uchun mavjud ro'yxat
    const { data: existing } = useGet<ListResponse<VehicleRoleType>>(
        SETTINGS_VEHICLE_TYPE,
        { params: { page_size: 1000 } },
    )

    const form = useForm<VehicleRoleType>({
        values: currentVehicleType?.id ? currentVehicleType : undefined,
        defaultValues: { name: "", type: undefined },
    })

    const { handleSubmit, reset } = form

    const onSuccess = () => {
        toast.success(
            `Mashina turi muvaffaqiyatli ${
                currentVehicleType?.id ? "tahrirlandi!" : "qo'shildi"
            }`,
        )
        reset()
        clearKey(SETTINGS_VEHICLE_TYPE)
        closeModal()
        queryClient.refetchQueries({ queryKey: [SETTINGS_VEHICLE_TYPE] })
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
                item.id !== currentVehicleType?.id &&
                String(item.name ?? "")
                    .trim()
                    .toLowerCase() === normalized,
        )
        return clash ? "Bu nomdagi mashina turi allaqachon mavjud" : true
    }

    const onSubmit = (values: VehicleRoleType) => {
        // `owner` backend VehicleType modelida yo'q — yuborilmaydi (S3-04).
        const payload = { name: values.name, type: values.type }

        if (currentVehicleType?.id) {
            updateMutate(
                `${SETTINGS_VEHICLE_TYPE}/${currentVehicleType.id}`,
                payload,
            )
        } else {
            postMutate(SETTINGS_VEHICLE_TYPE, payload)
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-1">
            <form
                onSubmit={handleSubmit(onSubmit, showValidationErrors)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                <FormInput
                    required
                    name="name"
                    label="Avtomobil nomi"
                    methods={form}
                    registerOptions={{ validate: isDuplicateName }}
                />
                <FormCombobox
                    required
                    name="type"
                    label="Avtomobil turi"
                    options={vehicleTypeOptions}
                    control={form.control}
                    labelKey="label"
                    valueKey="value"
                />
                {/*
                  "Egasi" (owner) maydoni OLIB TASHLANDI (S3-04 / S3-05).
                  Backend VehicleType modelida (apps/vehicles/models/vehicle_type.py)
                  `owner` maydoni umuman yo'q: yaratishda qiymat jimgina tashlanardi,
                  tahrirlashda esa majburiy bo'sh maydon saqlashni butunlay bloklardi.
                */}

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

export default AddVehicleModal
