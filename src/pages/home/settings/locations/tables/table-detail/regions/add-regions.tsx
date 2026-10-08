import { FormCombobox } from "@/components/form/combobox"
import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { SETTINGS_COUNTRIES, SETTINGS_REGIONS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import ZoneMap, { type ZonePoint } from "./zone-map"

const DEFAULT_RADIUS = 1000

interface AddRegionsModalProps {
    country_id: number
}

const AddRegionsModal = ({ country_id }: AddRegionsModalProps) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create-region")
    const { getData, clearKey } = useGlobalStore()
    const { data: countries } =
        useGet<ListResponse<RolesType>>(SETTINGS_COUNTRIES)

    const currentRegion = getData<RegionsType>(SETTINGS_REGIONS)

    const { data: viloyats, isLoading: isLoadingViloyats } = useGet<
        ListResponse<RegionsType>
    >(SETTINGS_REGIONS, {
        params: { country: country_id, top_level: true, page_size: 1000 },
        enabled: !!country_id,
    })

    const viloyatOptions = viloyats?.results?.filter(
        (r) => r.id !== currentRegion?.id,
    )

    const form = useForm<RegionsType>({
        defaultValues: {
            ...currentRegion,
            country: currentRegion?.country,
            parent: currentRegion?.parent ?? "",
            address: currentRegion?.address ?? "",
            radius_m: currentRegion?.radius_m ?? DEFAULT_RADIUS,
        },
    })

    const [point, setPoint] = useState<ZonePoint | null>(
        currentRegion?.lat != null && currentRegion?.lng != null
            ? { lat: currentRegion.lat, lng: currentRegion.lng }
            : null,
    )
    const isPlace = !!form.watch("parent")
    const radius = Number(form.watch("radius_m")) || 0

    const { handleSubmit, reset } = form

    const onSuccess = () => {
        toast.success(
            currentRegion?.id ? t("messages.success_edit") : t("messages.success_add"),
        )

        reset()
        clearKey(SETTINGS_REGIONS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [SETTINGS_REGIONS] })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
    })

    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
    })

    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = (values: RegionsType) => {
        const formData = {
            name: values.name,
            parent: values.parent ? Number(values.parent) : null,
            country: currentRegion?.id ? values.country : String(country_id),
            ...(values.parent
                ? {
                      lat: point ? Number(point.lat.toFixed(6)) : null,
                      lng: point ? Number(point.lng.toFixed(6)) : null,
                      radius_m: Number(values.radius_m) || DEFAULT_RADIUS,
                      address: values.address || null,
                  }
                : {}),
        }

        if (currentRegion?.id) {
            updateMutate(`${SETTINGS_REGIONS}/${currentRegion.id}`, formData)
        } else {
            postMutate(SETTINGS_REGIONS, formData)
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-1">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid md:grid-cols-2 gap-4"
            >
                <FormInput
                    required
                    name="name"
                    label={t("form.region")}
                    maxLength={255}
                    methods={form}
                />

 
                <div className="space-y-2">
                    <FormCombobox
                        isClearIcon
                        label={t("form.region")}
                        name="parent"
                        control={form.control}
                        options={viloyatOptions}
                        valueKey="id"
                        labelKey="name"
                        isLoading={isLoadingViloyats}
                    />
                    <p className="text-xs text-muted-foreground">
                        {t("form.region_parent_hint")}
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">{t("form.country")}</label>

                    <div className="h-10 px-3 py-2 text-sm border rounded-md bg-muted flex items-center">
                        {countries?.results?.find(
                            (c) => String(c.id) === String(country_id),
                        )?.name || "Davlat"}
                    </div>

                    <input
                        type="hidden"
                        {...form.register("country")}
                        value={String(country_id)}
                    />
                </div>

                {isPlace && (
                    <>
                        <FormNumberInput
                            allowNegative={false}
                            decimalScale={0}
                            name="radius_m"
                            label={t("form.radius_m")}
                            control={form.control}
                        />
                        <FormInput
                            name="address"
                            label={t("form.address")}
                            placeholder={t("form.address")}
                            methods={form}
                        />
                        <div className="md:col-span-2">
                            <div className="h-[320px] overflow-hidden rounded-md border md:h-[380px]">
                                <ZoneMap point={point} radius={radius} onChange={setPoint} />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {point
                                    ? point.lat.toFixed(6) + ", " + point.lng.toFixed(6)
                                    : t("form.map_pick_hint")}
                            </p>
                        </div>
                    </>
                )}

                <div className="flex items-center justify-end gap-2 md:col-span-2">
                    <Button
                        className="min-w-36 w-full md:w-max"
                        type="submit"
                        loading={isPending}
                    >
                        {t("actions.save")}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default AddRegionsModal
