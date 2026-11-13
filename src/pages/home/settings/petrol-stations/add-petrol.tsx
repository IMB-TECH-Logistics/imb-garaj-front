import FormInput from "@/components/form/input"
import { FormSelect } from "@/components/form/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SETTINGS_PETROL_STATIONS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { type FuelType, type PetrolStationRow } from "./cols"
import LocationPicker, { type LatLng } from "./location-picker"
import { useTranslation } from "react-i18next"

type FormValues = {
    name: string
    legal_name: string
    inn: string
    address: string
    latitude: number | null
    longitude: number | null
    has_contract: boolean
    fuel_type: FuelType
}

const AddPetrolStationModal = ({
    defaultFuel = "methane",
    isBank = false,
}: {
    defaultFuel?: FuelType
    isBank?: boolean
}) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const current = getData<PetrolStationRow>(SETTINGS_PETROL_STATIONS)
    const bankStation = current?.id ? !!current.is_bank : isBank
    const fuelOptions = [
        { id: "methane", name: t("settings.petrol.tab_methane") },
        { id: "diesel", name: t("settings.petrol.tab_diesel") },
    ]

    const form = useForm<FormValues>({
        defaultValues: {
            name: current?.name ?? "",
            legal_name: current?.legal_name ?? "",
            inn: current?.inn ?? "",
            address: current?.address ?? "",
            latitude: current?.latitude ?? null,
            longitude: current?.longitude ?? null,
            has_contract: current?.has_contract ?? false,
            fuel_type: current?.fuel_type ?? defaultFuel,
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
            current?.id ? t("messages.success_edit") : t("messages.success_add"),
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
            legal_name: values.legal_name.trim(),
            inn: values.inn.trim(),
            address: values.address,
            has_contract: values.has_contract,
            fuel_type: values.fuel_type,
            latitude: values.latitude,
            longitude: values.longitude,
            ...(!current?.id && bankStation ? { is_bank: true } : {}),
        }

        if (current?.id) {
            updateMutate(`${SETTINGS_PETROL_STATIONS}/${current.id}`, payload)
        } else {
            postMutate(SETTINGS_PETROL_STATIONS, payload)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{t("settings.petrol.section_main")}</h3>
                <div className="grid grid-cols-1 gap-4">
                    <FormInput required name="name" label={t("form.name")} methods={form} />

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
                        <FormInput
                            name="legal_name"
                            label={t("settings.petrol.legal_name")}
                            placeholder={t("settings.petrol.legal_name_hint")}
                            methods={form}
                        />
                        <FormInput
                            name="inn"
                            label={t("settings.petrol.inn")}
                            placeholder="312993579"
                            methods={form}
                            registerOptions={{
                                validate: (v) =>
                                    !v || /^(\d{9}|\d{14})$/.test(String(v).trim()) || t("settings.petrol.inn_invalid"),
                            }}
                        />
                    </div>

                    <FormInput required name="address" label={t("form.address")} methods={form} />

                    {bankStation && (
                        <FormSelect
                            required
                            control={form.control}
                            label={t("settings.petrol.fuel_type")}
                            name="fuel_type"
                            options={fuelOptions}
                            valueKey="id"
                            labelKey="name"
                        />
                    )}

                    <Controller
                        control={form.control}
                        name="has_contract"
                        render={({ field }) => (
                            <div className="flex items-start gap-3 rounded-md border bg-background p-3">
                                <Switch id="has-contract" checked={!!field.value} onCheckedChange={field.onChange} />
                                <Label htmlFor="has-contract" className="flex flex-col gap-1 cursor-pointer">
                                    <span className="text-sm font-medium">{t("settings.petrol.has_contract")}</span>
                                    <span className="text-xs font-normal text-muted-foreground">
                                        {field.value ?
                                            t("settings.petrol.contract_hint_yes")
                                        :   t("settings.petrol.contract_hint_no")}
                                    </span>
                                </Label>
                            </div>
                        )}
                    />
                </div>
            </section>

            <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{t("form.place")}</h3>
                <div className="grid grid-cols-1 gap-4">
                    <LocationPicker value={pickerValue} onChange={handlePick} />

                    <p className="text-xs text-muted-foreground -mt-2">
                        {t("settings.petrol.map_hint")}
                    </p>
                </div>
            </section>

            <div className="flex items-center justify-end mt-1">
                <Button className="min-w-36" type="submit" loading={isPending}>
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default AddPetrolStationModal
