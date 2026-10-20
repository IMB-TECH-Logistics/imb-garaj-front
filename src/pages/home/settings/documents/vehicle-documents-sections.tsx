import { FormCombobox } from "@/components/form/combobox"
import { ReactElement } from "react"
import { Control } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FormValues, PhotoField } from "./vehicle-documents-form"
import { VehicleDocumentsRow } from "./types"

type VehicleOption = {
    id: number
    truck_number: string
    trailer_number: string | null
}

type Picker = (name: PhotoField, label: string) => ReactElement
type ExpiresField = (prefix: "truck_passport" | "trailer_passport", label: string) => ReactElement

export const TruckSection = ({ isFixed, row, vehicles, control, expiresField, picker }: {
    isFixed: boolean
    row: VehicleDocumentsRow | undefined
    vehicles: ListResponse<VehicleOption> | undefined
    control: Control<FormValues>
    expiresField: ExpiresField
    picker: Picker
}) => {
    const { t } = useTranslation()
    return (
        <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{t("form.vehicle")}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {isFixed ?
                    <div className="space-y-1.5">
                        <p className="text-sm font-medium">
                            {t("documents_page.truck_number")}
                        </p>
                        <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm">
                            {row?.truck_number}
                        </div>
                    </div>
                :   <FormCombobox
                        required
                        name="vehicle"
                        label={t("documents_page.truck_number")}
                        options={vehicles?.results ?? []}
                        control={control}
                        labelKey="truck_number"
                        valueKey="id"
                    />
                }
                {expiresField(
                    "truck_passport",
                    t("documents_page.truck_expires"),
                )}
                {picker(
                    "truck_passport_photo_front",
                    t("documents_page.photo_truck_front"),
                )}
                {picker(
                    "truck_passport_photo_back",
                    t("documents_page.photo_truck_back"),
                )}
            </div>
        </section>
    )
}

export const TrailerSection = ({ isFixed, row, trailerOptions, control, vehicleId, hasTrailer, expiresField, picker }: {
    isFixed: boolean
    row: VehicleDocumentsRow | undefined
    trailerOptions: VehicleOption[]
    control: Control<FormValues>
    vehicleId: number | undefined
    hasTrailer: boolean
    expiresField: ExpiresField
    picker: Picker
}) => {
    const { t } = useTranslation()
    return (
        <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{t("settings.vehicles.section_trailer")}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {isFixed ?
                    <div className="space-y-1.5">
                        <p className="text-sm font-medium">
                            {t("documents_page.trailer_number")}
                        </p>
                        <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm">
                            {row?.trailer_number || "-"}
                        </div>
                    </div>
                :   <div className="space-y-1">
                        <FormCombobox
                            name="vehicle"
                            label={t("documents_page.trailer_number")}
                            options={trailerOptions}
                            control={control}
                            labelKey="trailer_number"
                            valueKey="id"
                        />
                        {!!vehicleId && !hasTrailer && (
                            <p className="text-xs text-muted-foreground">
                                {t("documents_page.no_trailer_hint")}
                            </p>
                        )}
                    </div>
                }
                {expiresField(
                    "trailer_passport",
                    t("documents_page.trailer_expires"),
                )}
                {picker(
                    "trailer_passport_photo_front",
                    t("documents_page.photo_trailer_front"),
                )}
                {picker(
                    "trailer_passport_photo_back",
                    t("documents_page.photo_trailer_back"),
                )}
            </div>
        </section>
    )
}
