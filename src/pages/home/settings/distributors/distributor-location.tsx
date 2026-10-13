import CoordinatesFields from "@/components/custom/coordinates-fields"
import { Button } from "@/components/ui/button"
import { SETTINGS_DISTRIBUTORS } from "@/constants/api-endpoints"
import { useDelete } from "@/hooks/useDelete"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { formatCoordinates, parseCoordinates } from "@/lib/coordinates"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export const DISTRIBUTOR_LOCATION_KEY = "distributor-location"

type LocationForm = { coordinates: string; radius_m: number | string }

const DistributorLocationModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal(DISTRIBUTOR_LOCATION_KEY)
    const { getData } = useGlobalStore()
    const current = getData<DistributorType>(DISTRIBUTOR_LOCATION_KEY)

    const form = useForm<LocationForm>({
        defaultValues: {
            coordinates: formatCoordinates(current?.lat, current?.lng),
            radius_m: current?.radius_m ?? 1000,
        },
    })

    const onSuccess = () => {
        toast.success(t("messages.success_edit"))
        closeModal()
        queryClient.refetchQueries({ queryKey: [SETTINGS_DISTRIBUTORS] })
    }

    const { mutate: save, isPending } = usePost({ onSuccess })
    const { mutate: remove, isPending: isRemoving } = useDelete({ onSuccess })

    const onSubmit = (values: LocationForm) => {
        if (!current?.id) return
        const point = parseCoordinates(values.coordinates)
        if (!point) {
            toast.error(t("coordinates.invalid"))
            return
        }
        save(`${SETTINGS_DISTRIBUTORS}/${current.id}/location`, {
            lat: point.lat,
            lng: point.lng,
            radius_m: Number(values.radius_m) || 1000,
        })
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-4 p-1">
            <div className="md:col-span-2 text-sm">
                <div className="font-medium">{current?.name}</div>
                <div className="text-muted-foreground">{[current?.district_name, current?.code].filter(Boolean).join(" · ")}</div>
            </div>
            <CoordinatesFields methods={form} />
            <div className="flex flex-wrap items-center justify-between gap-2 md:col-span-2">
                {current?.lat != null ? (
                    <Button
                        type="button"
                        variant="outline"
                        className="text-destructive"
                        loading={isRemoving}
                        onClick={() => current?.id && remove(`${SETTINGS_DISTRIBUTORS}/${current.id}/location`)}
                    >
                        {t("coordinates.remove")}
                    </Button>
                ) : <span />}
                <Button type="submit" className="min-w-36" loading={isPending}>
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default DistributorLocationModal
