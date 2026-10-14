import FormInput from "@/components/form/input"
import { FormCombobox } from "@/components/form/combobox"
import { Button } from "@/components/ui/button"
import { VEHICLES, SETTINGS_VEHICLE_TYPE } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

type TrailerForm = {
    vehicle: number | null
    trailer_number: string
    trailer_type: number | null
}

const AddTrailerModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const current = getData<VehicleDetailType>(VEHICLES)

    const { data: vehicleTypes } = useGet<ListResponse<{ id: number; name: string; type: string }>>(
        SETTINGS_VEHICLE_TYPE,
        { params: { page_size: 10000 } },
    )
    const trailerTypes = (vehicleTypes?.results ?? []).filter((vt) => vt.type === "trailer")

    const { data: vehicles } = useGet<ListResponse<VehicleDetailType>>(VEHICLES, {
        params: { page_size: 10000 },
        enabled: !current?.id,
    })
    const vehicleOptions = (vehicles?.results ?? []).filter((v) => !v.trailer_number)

    const form = useForm<TrailerForm>({
        defaultValues: {
            vehicle: current?.id ?? null,
            trailer_number: current?.trailer_number ?? "",
            trailer_type: current?.trailer_type ?? null,
        },
    })
    const { handleSubmit, reset, control } = form

    const { mutate, isPending } = usePatch({
        onSuccess: () => {
            toast.success(current?.id ? t("messages.success_edit") : t("messages.success_add"))
            reset()
            clearKey(VEHICLES)
            closeModal()
            queryClient.refetchQueries({ queryKey: [VEHICLES] })
        },
    })

    const onSubmit = (values: TrailerForm) => {
        mutate(`${VEHICLES}/${values.vehicle}`, {
            trailer_number: values.trailer_number,
            trailer_type: values.trailer_type,
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {current?.id ?
                        <div className="md:col-span-2 text-sm">
                            <span className="text-muted-foreground">{t("form.vehicle")}: </span>
                            <span className="font-medium">{current.truck_number}</span>
                        </div>
                    :   <FormCombobox
                            required
                            name="vehicle"
                            label={t("form.vehicle")}
                            options={vehicleOptions}
                            control={control}
                            labelKey="truck_number"
                            valueKey="id"
                            wrapperClassName="md:col-span-2"
                        />
                    }

                    <FormInput
                        required
                        name="trailer_number"
                        label={t("form.trailer_number")}
                        methods={form}
                    />

                    <FormCombobox
                        name="trailer_type"
                        label={t("form.trailer_type")}
                        options={trailerTypes}
                        control={control}
                        labelKey="name"
                        valueKey="id"
                    />
                </div>
            </section>

            <div className="flex items-center justify-end gap-2 md:col-span-2">
                <Button className="min-w-36 w-full md:w-max" type="submit" loading={isPending}>
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default AddTrailerModal
