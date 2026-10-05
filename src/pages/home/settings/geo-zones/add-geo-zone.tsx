import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { PLACES_GEO_ZONES, PLACES_GEO_ZONES_SELECT } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { handleFormError } from "@/lib/show-form-errors"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import type { GeoZone } from "./cols"
import ZoneMap, { type ZonePoint } from "./zone-map"

const DEFAULT_RADIUS = 2000

type FormValues = {
    name: string
    address: string
    radius_m: string | number
}

const AddGeoZoneModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const current = getData<GeoZone>(PLACES_GEO_ZONES)

    const [point, setPoint] = useState<ZonePoint | null>(
        current ? { lat: current.lat, lng: current.lng } : null,
    )
    const [pointError, setPointError] = useState(false)

    const form = useForm<FormValues>({
        defaultValues: {
            name: current?.name ?? "",
            address: current?.address ?? "",
            radius_m: current?.radius_m ?? DEFAULT_RADIUS,
        },
    })
    const radius = Number(form.watch("radius_m")) || 0

    const onSuccess = () => {
        toast.success(
            current?.id ? t("messages.success_edit") : t("messages.success_add"),
        )
        clearKey(PLACES_GEO_ZONES)
        closeModal()
        queryClient.refetchQueries({ queryKey: [PLACES_GEO_ZONES] })
        queryClient.refetchQueries({ queryKey: [PLACES_GEO_ZONES_SELECT] })
    }
    const onError = (error: unknown) => handleFormError(error, form)

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
        onError,
    })
    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
        onError,
    })

    const onSubmit = (values: FormValues) => {
        if (!point) {
            setPointError(true)
            return
        }
        const payload = {
            name: values.name,
            address: values.address,
            radius_m: Number(values.radius_m) || DEFAULT_RADIUS,
            lat: Number(point.lat.toFixed(6)),
            lng: Number(point.lng.toFixed(6)),
        }
        if (current?.id) {
            updateMutate(`${PLACES_GEO_ZONES}/${current.id}`, payload)
        } else {
            postMutate(PLACES_GEO_ZONES, payload)
        }
    }

    const handlePoint = (next: ZonePoint) => {
        setPoint(next)
        setPointError(false)
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
                required
                name="name"
                label={t("form.name")}
                methods={form}
            />
            <FormNumberInput
                required
                allowNegative={false}
                decimalScale={0}
                name="radius_m"
                label="Radius (m)"
                control={form.control}
            />
            <div className="md:col-span-2">
                <FormInput
                    name="address"
                    label="Manzil"
                    placeholder="Manzil"
                    methods={form}
                />
            </div>
            <div className="md:col-span-2">
                <div className="h-[320px] overflow-hidden rounded-md border md:h-[380px]">
                    <ZoneMap point={point} radius={radius} onChange={handlePoint} />
                </div>
                <p className={pointError ? "mt-1 text-xs text-destructive" : "mt-1 text-xs text-muted-foreground"}>
                    {point
                        ? `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`
                        : "Xaritani bosib nuqtani belgilang"}
                </p>
            </div>
            <div className="mt-1 flex items-center justify-end md:col-span-2">
                <Button
                    className="w-full min-w-36 md:w-max"
                    type="submit"
                    loading={isPendingCreate || isPendingUpdate}
                >
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default AddGeoZoneModal
