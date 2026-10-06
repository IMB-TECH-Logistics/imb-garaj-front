import { FormCombobox } from "@/components/form/combobox"
import FieldLabel from "@/components/form/form-label"
import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { WAREHOUSE_PRODUCTS, WAREHOUSE_UNITS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { handleFormError } from "@/lib/show-form-errors"
import type { WhProduct, WhUnit } from "@/pages/home/ombor/types"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { Controller, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

type FormValues = {
    name: string
    unit: number | ""
    is_serialized: boolean
    min_quantity: string
    life_years: string
    life_months: string
    life_days: string
    gtin: string
}

const numberText = (value: string | number | null | undefined) =>
    value === null || value === undefined || Number(value) === 0 ?
        ""
    :   String(Number(value))

const AddProductModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const current = getData<WhProduct>(WAREHOUSE_PRODUCTS)

    const { data: units, isLoading: unitsLoading } =
        useGet<WhUnit[]>(WAREHOUSE_UNITS)

    const form = useForm<FormValues>({
        defaultValues: {
            name: current?.name ?? "",
            unit: current?.unit ?? "",
            is_serialized: current?.is_serialized ?? false,
            min_quantity: numberText(current?.min_quantity),
            life_years: numberText(current?.life_years),
            life_months: numberText(current?.life_months),
            life_days: numberText(current?.life_days),
            gtin: current?.gtin ?? "",
        },
    })
    const { control, handleSubmit } = form

    const unitId = useWatch({ control, name: "unit" })
    const unitName = units?.find((unit) => unit.id === unitId)?.name

    const onSuccess = () => {
        toast.success(
            current?.id ? t("messages.success_edit") : t("messages.success_add"),
        )
        clearKey(WAREHOUSE_PRODUCTS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [WAREHOUSE_PRODUCTS] })
        queryClient.invalidateQueries({ queryKey: [WAREHOUSE_UNITS] })
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
        const payload = {
            name: values.name.trim(),
            unit: values.unit,
            is_serialized: values.is_serialized,
            min_quantity: values.min_quantity,
            life_years: Number(values.life_years) || 0,
            life_months: Number(values.life_months) || 0,
            life_days: Number(values.life_days) || 0,
            gtin: values.gtin.trim() || null,
        }
        if (current?.id) {
            updateMutate(`${WAREHOUSE_PRODUCTS}/${current.id}`, payload)
        } else {
            postMutate(WAREHOUSE_PRODUCTS, payload)
        }
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1"
        >
            <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Asosiy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        required
                        name="name"
                        label={t("form.name")}
                        methods={form}
                        wrapperClassName="md:col-span-2"
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
                        wrapperClassName="md:col-span-1"
                    />

                    <FormNumberInput
                        required
                        name="min_quantity"
                        label={t("wh.min_quantity")}
                        control={control}
                        allowNegative={false}
                        suffix={unitName ? ` ${unitName}` : undefined}
                        wrapperClassName="md:col-span-1"
                    />

                    <FormInput
                        name="gtin"
                        label="GTIN"
                        placeholder="04640012345017"
                        inputMode="numeric"
                        className="font-mono"
                        methods={form}
                        wrapperClassName="md:col-span-2"
                    />

                    <Controller
                        name="is_serialized"
                        control={control}
                        render={({ field }) => (
                            <div className="md:col-span-2 flex items-center gap-2">
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
                </div>
            </section>

            <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Xizmat muddati</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 flex flex-col">
                        <FieldLabel htmlFor="life_years" required={false} isError={false}>
                            {t("wh.life")}
                        </FieldLabel>
                        <div className="grid grid-cols-3 gap-3">
                            <FormNumberInput
                                name="life_years"
                                control={control}
                                placeholder={t("wh.years")}
                                decimalScale={0}
                                allowNegative={false}
                                suffix={` ${t("wh.years")}`}
                            />
                            <FormNumberInput
                                name="life_months"
                                control={control}
                                placeholder={t("wh.months")}
                                decimalScale={0}
                                allowNegative={false}
                                suffix={` ${t("wh.months")}`}
                            />
                            <FormNumberInput
                                name="life_days"
                                control={control}
                                placeholder={t("wh.days")}
                                decimalScale={0}
                                allowNegative={false}
                                suffix={` ${t("wh.days")}`}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <div className="md:col-span-2 flex items-center justify-end pt-1">
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

export default AddProductModal
