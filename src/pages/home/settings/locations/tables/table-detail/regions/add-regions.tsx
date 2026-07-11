import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { SETTINGS_COUNTRIES, SETTINGS_REGIONS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

interface AddRegionsModalProps {
    country_id: number
}

const AddRegionsModal = ({ country_id }: AddRegionsModalProps) => {
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create-region")
    const { getData, clearKey } = useGlobalStore()
    const { data: countries } =
        useGet<ListResponse<RolesType>>(SETTINGS_COUNTRIES)

    const currentRegion = getData<RegionsType>(SETTINGS_REGIONS)

    const form = useForm<RegionsType>({
        defaultValues: {
            ...currentRegion,
            country: currentRegion?.country,
        },
    })

    const { handleSubmit, reset } = form

    const onSuccess = () => {
        toast.success(
            `Viloyat muvaffaqiyatli ${currentRegion?.id ? "tahrirlandi!" : "qo'shildi"} `,
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
            ...values,
            country: currentRegion?.id ? values.country : String(country_id),
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
                    label="Joylashuv nomi"
                    methods={form}
                />

 
                <div className="space-y-2">
                    <label className="text-sm font-medium">Davlat</label>

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

                <div className="flex items-center justify-end gap-2 md:col-span-2">
                    <Button
                        className="min-w-36 w-full md:w-max"
                        type="submit"
                        loading={isPending}
                    >
                        {"Saqlash"}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default AddRegionsModal
