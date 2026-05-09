import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { SETTINGS_PETROL_STATIONS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { type PetrolStationRow } from "./cols"
import LocationPicker, { type LatLng } from "./location-picker"

type FormValues = {
    name: string
    address: string
    latitude: number | null
    longitude: number | null
}

const AddPetrolStationModal = () => {
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const current = getData<PetrolStationRow>(SETTINGS_PETROL_STATIONS)

    const form = useForm<FormValues>({
        defaultValues: {
            name: current?.name ?? "",
            address: current?.address ?? "",
            latitude: current?.latitude ?? null,
            longitude: current?.longitude ?? null,
        },
    })
    const { handleSubmit, reset, watch, setValue } = form

    const lat = watch("latitude")
    const lng = watch("longitude")
    const pickerValue: LatLng | null =
        lat != null && lng != null ? { lat: Number(lat), lng: Number(lng) } : null

    const handlePick = (
        loc: LatLng,
        info: { address: string; name: string },
    ) => {
        setValue("latitude", loc.lat, { shouldDirty: true })
        setValue("longitude", loc.lng, { shouldDirty: true })
        if (info.address) {
            setValue("address", info.address, { shouldDirty: true })
        }
    }

    const onSuccess = () => {
        toast.success(
            `Zapravka muvaffaqiyatli ${current?.id ? "tahrirlandi!" : "qo'shildi!"}`,
        )
        reset()
        clearKey(SETTINGS_PETROL_STATIONS)
        closeModal()
        queryClient.refetchQueries({
            predicate: (q) =>
                String(q.queryKey[0]).includes("petrol-stations"),
        })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
    })
    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
    })

    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = (values: FormValues) => {
        const payload = {
            name: values.name,
            address: values.address,
            latitude: values.latitude,
            longitude: values.longitude,
        }

        if (current?.id) {
            updateMutate(`${SETTINGS_PETROL_STATIONS}/${current.id}`, payload)
        } else {
            postMutate(SETTINGS_PETROL_STATIONS, payload)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormInput required name="name" label="Nomi" methods={form} />
            <FormInput required name="address" label="Manzili" methods={form} />

            <LocationPicker value={pickerValue} onChange={handlePick} />
            <p className="text-xs text-muted-foreground -mt-2">
                Xaritadan zapravka joyini tanlang — manzil avtomatik
                to'ldiriladi.
            </p>

            <div className="flex items-center justify-end mt-1">
                <Button className="min-w-36" type="submit" loading={isPending}>
                    Saqlash
                </Button>
            </div>
        </form>
    )
}

export default AddPetrolStationModal
