import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import { Button } from "@/components/ui/button"
import { SETTINGS_DRIVERS, TRIPS, VEHICLES } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

const AddTrip = () => {
    const queryClient = useQueryClient()
    const { getData, clearKey } = useGlobalStore()
    const { closeModal } = useModal("post-trips")
    const { data: vehicleData } = useGet<ListResponse<Truck>>(VEHICLES)
    const { data: driversData } = useGet<ListResponse<any>>(SETTINGS_DRIVERS)

    const currentShift = getData<TripFormData & { id?: number }>(TRIPS)

    const form = useForm<TripFormData>({
        defaultValues: {
            driver: currentShift?.driver,
            vehicle: currentShift?.vehicle,
            start: currentShift?.start,
        },
    })

    const { handleSubmit, control, reset, watch, setValue } = form

    const onSuccess = () => {
        toast.success(
            currentShift?.id ? "Reys tahrirlandi!" : "Reys qo'shildi!",
        )
        reset()
        clearKey(TRIPS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [TRIPS] })
    }

    const { mutate: create, isPending: creating } = usePost({ onSuccess })
    const { mutate: update, isPending: updating } = usePatch({ onSuccess })

    const isPending = creating || updating

    const onSubmit = (data: TripFormData) => {
        const formattedData = {
            ...data,
        }

        if (currentShift?.id) {
            update(`${TRIPS}/${currentShift.id}`, formattedData)
        } else {
            create(TRIPS, formattedData)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-4">
                <FormCombobox
                    required
                    label="Mashina"
                    name="vehicle"
                    control={control}
                    options={vehicleData?.results}
                    valueKey="id"
                    labelKey="truck_number"
                    placeholder="Mashina tanlang"
                />

                <FormCombobox
                    required
                    label="Haydovchi"
                    name="driver"
                    control={control}
                    options={driversData?.results}
                    valueKey="id"
                    labelKey="first_name"
                    placeholder="Haydovchi tanlang"
                />
                <div className="grid grid-cols-2 gap-2">
                    <FormDatePicker
                        required
                        label="Boshlanish sanasi"
                        control={control}
                        name="start"
                        placeholder="Sanani tanlang"
                        className="w-full"
                    />
                    <FormDatePicker
                        required
                        label="Tugash sanasi"
                        control={control}
                        name="start"
                        placeholder="Sanani tanlang"
                        className="w-full"
                    />
                </div>
            </div>

            <div className="col-span-2 flex justify-end gap-4 pt-4">
                <Button type="submit" loading={isPending} disabled={isPending}>
                    Saqlash
                </Button>
            </div>
        </form>
    )
}

export default AddTrip
