import type { AlertSettings } from "@/components/alerts/types"
import { FormCombobox } from "@/components/form/combobox"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import {
    ALERTS_COUNTS,
    ALERTS_SETTINGS,
    SETTINGS_SELECTABLE_EXPENSE_CATEGORY,
} from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { usePut } from "@/hooks/usePut"
import { handleFormError } from "@/lib/show-form-errors"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import { ALERT_FIELDS } from "./fields"

type CategoryItem = { id: number; name: string }

const AlertSettingsPage = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const hasControl = useHasAction("settings_vehicles_control")

    const schema = useMemo(() => {
        const invalid = t("alerts.settings.invalid_value")
        const positive = z.coerce.number({ invalid_type_error: invalid }).positive(invalid)
        const whole = z.coerce.number({ invalid_type_error: invalid }).int(invalid).min(1, invalid)
        const wholeOrZero = z.coerce.number({ invalid_type_error: invalid }).int(invalid).min(0, invalid)
        return z.object({
            unassigned_km: positive,
            unassigned_minutes: whole,
            long_drive_hours: positive,
            rest_minutes: whole,
            oil_km: whole,
            oil_months: whole,
            tire_km: whole,
            warn_km: wholeOrZero,
            warn_days: wholeOrZero,
            oil_category: z.number().nullable(),
        })
    }, [t])
    type FormValues = z.infer<typeof schema>

    const { data, isLoading } = useGet<AlertSettings>(ALERTS_SETTINGS)
    const { data: categories, isLoading: categoriesLoading } = useGet<CategoryItem[]>(
        SETTINGS_SELECTABLE_EXPENSE_CATEGORY,
        { params: { type: 1 } },
    )

    const categoryOptions = useMemo(() => {
        const list = categories ?? []
        const current = data?.oil_category
        return current && !list.some((c) => c.id === current.id) ? [...list, current] : list
    }, [categories, data?.oil_category])

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        values: data ? { ...data, oil_category: data.oil_category?.id ?? null } : undefined,
    })

    const { mutate, isPending } = usePut({
        onSuccess: () => {
            toast.success(t("messages.success_edit"))
            queryClient.invalidateQueries({ queryKey: [ALERTS_SETTINGS] })
            queryClient.invalidateQueries({ queryKey: [ALERTS_COUNTS] })
        },
        onError: (error: unknown) => handleFormError(error, form),
    })

    const onSubmit = (values: FormValues) => mutate(ALERTS_SETTINGS, values)

    return (
        <div className="w-full max-w-3xl mx-auto p-1 space-y-4">
            <div>
                <h1 className="text-base font-medium">{t("nav.alerts")}</h1>
                <p className="text-sm text-muted-foreground">{t("alerts.settings.description")}</p>
            </div>
            {isLoading ?
                <p className="text-sm text-muted-foreground">{t("messages.loading")}</p>
            :   <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <section className="rounded-lg border bg-muted/20 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ALERT_FIELDS.map((field) => (
                            <FormNumberInput
                                key={field.name}
                                required
                                name={field.name}
                                label={t(`alerts.settings.fields.${field.name}`)}
                                control={form.control}
                                decimalScale={field.decimalScale}
                                allowNegative={false}
                                disabled={!hasControl}
                                suffix={` ${t(`alerts.units.${field.unit}`)}`}
                            />
                        ))}
                        <FormCombobox
                            name="oil_category"
                            label={t("alerts.settings.fields.oil_category")}
                            control={form.control}
                            options={categoryOptions}
                            valueKey="id"
                            labelKey="name"
                            isLoading={categoriesLoading}
                            wrapperClassName="md:col-span-2"
                        />
                    </section>
                    {hasControl && (
                        <div className="flex justify-end">
                            <Button className="min-w-36 w-full md:w-max" type="submit" loading={isPending}>
                                {t("actions.save")}
                            </Button>
                        </div>
                    )}
                </form>
            }
        </div>
    )
}

export default AlertSettingsPage
