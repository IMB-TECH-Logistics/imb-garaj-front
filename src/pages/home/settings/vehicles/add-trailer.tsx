import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { FormCombobox } from "@/components/form/combobox"
import { Button } from "@/components/ui/button"
import { VEHICLES, SETTINGS_VEHICLE_TYPE, TECH_BASE } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { handleFormError } from "@/lib/show-form-errors"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

type TrailerForm = {
    vehicle: number | null
    trailer_number: string
    trailer_type: number | null
    trailer_capacity_tons: string
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
            trailer_capacity_tons:
                current?.trailer_capacity_tons != null ?
                    String(current.trailer_capacity_tons)
                :   "",
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

    // Mashina tanlanmasa — mustaqil tirkama (Texnik baza), keyin mashinaga biriktiriladi
    const { mutate: createStandalone, isPending: isCreating } = usePost({
        onSuccess: () => {
            toast.success(t("messages.success_add"))
            reset()
            clearKey(VEHICLES)
            closeModal()
            queryClient.refetchQueries({ queryKey: [VEHICLES] })
            queryClient.invalidateQueries({ queryKey: [TECH_BASE] })
        },
        onError: (e: unknown) => handleFormError(e),
    })

    const onSubmit = (values: TrailerForm) => {
        if (!current?.id && !values.vehicle) {
            createStandalone(`${TECH_BASE}/trailers`, {
                plate: values.trailer_number.trim(),
                type_id: values.trailer_type ?? undefined,
                capacity_tons:
                    values.trailer_capacity_tons === "" ?
                        undefined
                    :   String(values.trailer_capacity_tons).replace(",", "."),
            })
            return
        }
        mutate(`${VEHICLES}/${values.vehicle}`, {
            trailer_number: values.trailer_number,
            trailer_type: values.trailer_type,
            trailer_capacity_tons:
                values.trailer_capacity_tons === "" ?
                    null
                :   values.trailer_capacity_tons,
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
                            name="vehicle"
                            label={t("form.vehicle")}
                            options={vehicleOptions}
                            control={control}
                            labelKey="truck_number"
                            valueKey="id"
                            wrapperClassName="md:col-span-2"
                        />
                    }
                    {!current?.id && (
                        <p className="md:col-span-2 -mt-2 text-xs text-muted-foreground">
                            {t("settings.vehicles.trailer_vehicle_optional_hint")}
                        </p>
                    )}

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

                    <FormNumberInput
                        name="trailer_capacity_tons"
                        label={t("form.trailer_capacity_tons")}
                        control={control}
                        placeholder="24"
                        thousandSeparator=""
                        decimalScale={2}
                        allowNegative={false}
                    />
                </div>
            </section>

            <div className="flex items-center justify-end gap-2 md:col-span-2">
                <Button className="min-w-36 w-full md:w-max" type="submit" loading={isPending || isCreating}>
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default AddTrailerModal
