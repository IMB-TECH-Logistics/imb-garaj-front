import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import { Button } from "@/components/ui/button"
import { MANAGERS_TRIPS, SETTINGS_DRIVERS, VEHICLES } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { startOfDay } from "date-fns"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

const AddTrip = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { getData, clearKey } = useGlobalStore()
    const { closeModal } = useModal("create")
    const { data: vehicleData } = useGet<ListResponse<Truck>>(VEHICLES)
    const { data: driversData } = useGet<ListResponse<any>>(SETTINGS_DRIVERS)

    const currentShift = getData<TripFormData & { id?: number }>(MANAGERS_TRIPS)

    const form = useForm<TripFormData>({
        defaultValues: {
            driver: currentShift?.driver,
            vehicle: currentShift?.vehicle,
            start: currentShift?.start,
        },
    })

    const { handleSubmit, control, reset, watch, setError } = form
    const startValue = watch("start")

    const onSuccess = () => {
        toast.success(
            currentShift?.id ? t("toast.updated") : t("toast.added"),
        )
        reset()
        clearKey(MANAGERS_TRIPS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [MANAGERS_TRIPS] })
    }

    const { mutate: create, isPending: creating } = usePost({ onSuccess })
    const { mutate: update, isPending: updating } = usePatch({ onSuccess })

    const isPending = creating || updating

    const onSubmit = (data: TripFormData) => {
        if (data.start && data.end && new Date(data.end) < new Date(data.start)) {
            setError("end", { type: "validate", message: t("validation.end_before_start") })
            return
        }
        const formattedData = {
            ...data,
        }
        if (currentShift?.id) {
            update(`${MANAGERS_TRIPS}/${currentShift.id}`, formattedData)
        } else {
            create(MANAGERS_TRIPS, formattedData)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-4">
                <FormCombobox
                    required
                    label={t("form.truck")}
                    name="vehicle"
                    control={control}
                    options={vehicleData?.results}
                    valueKey="id"
                    labelKey="truck_number"
                    placeholder={t("form.truck")}
                />

                <FormCombobox
                    required
                    label={t("form.driver")}
                    name="driver"
                    control={control}
                    options={driversData?.results}
                    valueKey="id"
                    labelKey="first_name"
                    placeholder={t("form.select_driver")}
                />
                <div className="grid grid-cols-2 gap-2">
                    <FormDatePicker
                        required
                        label={t("form.start_date")}
                        control={control}
                        name="start"
                        placeholder={t("form.select_date")}
                        className="w-full"
                    />
                    <FormDatePicker
                        required
                        label={t("form.end_date")}
                        control={control}
                        name="end"
                        placeholder={t("form.select_date")}
                        className="w-full"
                        calendarProps={
                            startValue
                                ? { disabled: { before: startOfDay(new Date(startValue)) } }
                                : undefined
                        }
                    />
                </div>
            </div>

            <div className="col-span-2 flex justify-end gap-4 pt-4">
                <Button type="submit" loading={isPending} disabled={isPending}>
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default AddTrip
