import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { SETTINGS_DISTRICTS, SETTINGS_REGIONS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

interface AddDestrictsModalProps {
    region_id?: string | number
    country_id: number
}

const AddDestrictsModal = ({
    region_id,
    country_id,
}: AddDestrictsModalProps) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create-districts")
    const { getData, clearKey } = useGlobalStore()

    const { data: regions } = useGet<ListResponse<RolesType>>(
        SETTINGS_REGIONS,
        {
            params: country_id ? { country: country_id } : undefined,
        },
    )

    const currentDistrict = getData<SettingsDistrictType>(SETTINGS_DISTRICTS)

    const form = useForm<SettingsDistrictType>({
        defaultValues: {
            ...currentDistrict,
            region: currentDistrict?.region,
        },
    })

    const { handleSubmit, reset } = form

    const onSuccess = () => {
        toast.success(
            currentDistrict?.id ? t("messages.success_edit") : t("messages.success_add"),
        )

        reset()
        clearKey(SETTINGS_DISTRICTS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [SETTINGS_DISTRICTS] })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
    })

    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
    })

    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = (values: SettingsDistrictType) => {
        const formData = {
            ...values,
            region:
                currentDistrict?.id ? values.region
                : region_id ? String(region_id)
                : "",
        }

        if (currentDistrict?.id) {
            updateMutate(
                `${SETTINGS_DISTRICTS}/${currentDistrict.id}`,
                formData,
            )
        } else {
            if (!region_id) {
                toast.error(t("toast.error_select_region"))
                return
            }
            postMutate(SETTINGS_DISTRICTS, formData)
        }
    }

    const selectedRegion = regions?.results?.find((r) =>
        currentDistrict?.id ?
            String(r.id) === String(currentDistrict.region)
        :   String(r.id) === String(region_id),
    )

    return (
        <div className="w-full max-w-4xl mx-auto p-1">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid md:grid-cols-2 gap-4"
            >
                <FormInput
                    required
                    name="name"
                    label={t("form.name")}
                    maxLength={255}
                    methods={form}
                />
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t("form.region")}</label>

                    <div className="h-10 px-3 py-2 text-sm border rounded-md bg-muted flex items-center">
                        {selectedRegion?.name ||
                            (region_id ?
                                `Viloyat ID: ${region_id}`
                            :   "Viloyat tanlanmagan")}
                    </div>

                    <input
                        type="hidden"
                        {...form.register("region")}
                        value={region_id ? String(region_id) : ""}
                    />
                </div>

                <div className="flex items-center justify-end gap-2 md:col-span-2">
                    <Button
                        className="min-w-36 w-full md:w-max"
                        type="submit"
                        loading={isPending}
                        disabled={!region_id && !currentDistrict?.id}
                    >
                        {t("actions.save")}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default AddDestrictsModal
