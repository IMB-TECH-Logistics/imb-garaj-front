import { FormCombobox } from "@/components/form/combobox"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    WAREHOUSE_CATEGORIES,
    WAREHOUSE_PRODUCTS,
    WAREHOUSE_UNITS,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { handleFormError } from "@/lib/show-form-errors"
import type { WhCategory, WhUnit } from "@/pages/home/ombor/types"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

type FormValues = {
    name: string
    unit: number | ""
    is_serialized: boolean
}

const AddCategoryModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const current = getData<WhCategory>(WAREHOUSE_CATEGORIES)

    const { data: units, isLoading: unitsLoading } =
        useGet<WhUnit[]>(WAREHOUSE_UNITS)

    const form = useForm<FormValues>({
        defaultValues: {
            name: current?.name ?? "",
            unit: current?.unit ?? "",
            is_serialized: current?.is_serialized ?? false,
        },
    })
    const { control, handleSubmit } = form

    const onSuccess = () => {
        toast.success(
            current?.id ? t("messages.success_edit") : t("messages.success_add"),
        )
        clearKey(WAREHOUSE_CATEGORIES)
        closeModal()
        queryClient.refetchQueries({ queryKey: [WAREHOUSE_CATEGORIES] })
        queryClient.invalidateQueries({ queryKey: [WAREHOUSE_PRODUCTS] })
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
        const payload = { ...values, name: values.name.trim() }
        if (current?.id) {
            updateMutate(`${WAREHOUSE_CATEGORIES}/${current.id}`, payload)
        } else {
            postMutate(WAREHOUSE_CATEGORIES, payload)
        }
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4 p-1"
        >
            <FormInput
                required
                name="name"
                label={t("form.name")}
                methods={form}
            />

            <FormCombobox
                required
                name="unit"
                label={t("form.unit")}
                placeholder={t("wh.choose")}
                control={control}
                options={units}
                valueKey="id"
                labelKey="name"
                isLoading={unitsLoading}
            />

            <Controller
                name="is_serialized"
                control={control}
                render={({ field }) => (
                    <div className="flex items-center gap-2">
                        <Switch
                            id="is_serialized"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="is_serialized">
                            {t("wh.serialized_label")}
                        </Label>
                    </div>
                )}
            />

            <div className="flex items-center justify-end">
                <Button
                    className="min-w-36 w-full md:w-max"
                    type="submit"
                    loading={isPendingCreate || isPendingUpdate}
                >
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default AddCategoryModal
