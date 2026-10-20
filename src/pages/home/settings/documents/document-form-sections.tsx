import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import FormInput from "@/components/form/input"
import { Control, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import VehicleImagePicker from "../vehicles/vehicle-image-picker"
import { MAX_PHOTO_MB, VehicleDocumentType } from "./types"
export type FormValues = Partial<
    Omit<VehicleDocumentType, "photo_front" | "photo_back">
> & {
    photo_front?: File | string | null
    photo_back?: File | string | null
}
export const DocumentTargetSection = ({ control, docTypeOptions, isDriverDoc, drivers, vehicles }: {
    control: Control<FormValues>
    docTypeOptions: { value: string; label: string }[]
    isDriverDoc: boolean
    drivers: ListResponse<{ id: number; full_name: string }> | undefined
    vehicles: ListResponse<{ id: number; truck_number: string }> | undefined
}) => {
    const { t } = useTranslation()
    return (
            <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                    {t("settings.documents.section_document")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormCombobox
                        required
                        name="doc_type"
                        label={t("documents_page.doc_type")}
                        options={docTypeOptions}
                        control={control}
                        labelKey="label"
                        valueKey="value"
                    />
                    {isDriverDoc ?
                        <FormCombobox
                            key="driver"
                            required
                            name="driver"
                            label={t("documents_page.driver")}
                            options={drivers?.results ?? []}
                            control={control}
                            labelKey="full_name"
                            valueKey="id"
                        />
                    :   <FormCombobox
                            key="vehicle"
                            required
                            name="vehicle"
                            label={t("documents_page.vehicle")}
                            options={vehicles?.results ?? []}
                            control={control}
                            labelKey="truck_number"
                            valueKey="id"
                        />
                    }
                </div>
            </section>
    )
}

export const DocumentInfoSection = ({ form, control }: { form: UseFormReturn<FormValues>; control: Control<FormValues> }) => {
    const { t } = useTranslation()
    return (
        <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                {t("settings.documents.section_info")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    name="number"
                    wrapperClassName="md:col-span-2"
                    label={t("documents_page.number")}
                    methods={form}
                />
                <FormDatePicker
                    name="issued_date"
                    label={t("documents_page.issued_date")}
                    control={control}
                    fullWidth
                />
                <div>
                    <FormDatePicker
                        name="expires_date"
                        label={t("documents_page.expires_date")}
                        control={control}
                        fullWidth
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        {t("documents_page.expires_hint")}
                    </p>
                </div>
            </div>
        </section>
    )
}

export const DocumentPhotosSection = ({ form }: { form: UseFormReturn<FormValues> }) => {
    const { t } = useTranslation()
    return (
        <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                {t("documents_page.photos")}
            </h3>
            <div>
                <div className="grid grid-cols-2 gap-3">
                    <VehicleImagePicker
                        name="photo_front"
                        label={t("documents_page.photo_front")}
                        methods={form}
                        clearable
                        maxSizeMB={MAX_PHOTO_MB}
                    />
                    <VehicleImagePicker
                        name="photo_back"
                        label={t("documents_page.photo_back")}
                        methods={form}
                        clearable
                        maxSizeMB={MAX_PHOTO_MB}
                    />
                </div>
            </div>
        </section>
    )
}
