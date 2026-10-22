import CoordinatesFields from "@/components/custom/coordinates-fields"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { SETTINGS_GARAGE_AREAS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { formatCoordinates, parseCoordinates } from "@/lib/coordinates"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export type GarageArea = {
    id: number
    name: string
    lat: number
    lng: number
    radius_m: number
    polygon: [number, number][] | null
}

type GarageAreaForm = { name: string; coordinates: string; radius_m: number | string }

const AddGarageArea = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const current = getData<GarageArea>(SETTINGS_GARAGE_AREAS)

    const form = useForm<GarageAreaForm>({
        defaultValues: {
            name: current?.name ?? "",
            coordinates: formatCoordinates(current?.lat, current?.lng),
            radius_m: current?.radius_m ?? 300,
        },
    })

    const onSuccess = () => {
        toast.success(current?.id ? t("messages.success_edit") : t("messages.success_add"))
        form.reset()
        clearKey(SETTINGS_GARAGE_AREAS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [SETTINGS_GARAGE_AREAS] })
    }

    const { mutate: create, isPending: creating } = usePost({ onSuccess })
    const { mutate: update, isPending: updating } = usePatch({ onSuccess })

    const onSubmit = (values: GarageAreaForm) => {
        const point = parseCoordinates((values.coordinates ?? "").trim())
        if (!point) {
            toast.error(t("coordinates.invalid"))
            return
        }
        const payload = {
            name: values.name,
            lat: point.lat,
            lng: point.lng,
            radius_m: Number(values.radius_m) || 300,
        }
        if (current?.id) {
            update(`${SETTINGS_GARAGE_AREAS}/${current.id}`, payload)
        } else {
            create(SETTINGS_GARAGE_AREAS, payload)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-4 p-1">
            <FormInput required name="name" label={t("form.name")} methods={form} wrapperClassName="md:col-span-2" />
            <CoordinatesFields methods={form} />
            {current?.polygon && (
                <p className="md:col-span-2 text-sm text-muted-foreground">{t("settings.garage_areas.polygon_note")}</p>
            )}
            <div className="flex justify-end md:col-span-2">
                <Button className="min-w-36 w-full md:w-max" type="submit" loading={creating || updating}>
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default AddGarageArea
