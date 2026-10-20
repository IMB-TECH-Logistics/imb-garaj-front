import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import { FormInput } from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { Control, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Direction, SelectItem, withCurrent } from "./route-form-utils"

export const LoadSection = ({ form, control, current, regionsData, deletedLabel }: {
    form: UseFormReturn<Direction>
    control: Control<Direction>
    current: Direction | undefined
    regionsData: SelectItem[] | undefined
    deletedLabel: string
}) => {
    const { t } = useTranslation()
    return (
        <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{t("form.loading_location")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormCombobox
                    required
                    label={t("form.loading_address")}
                    name="load"
                    control={control}
                    options={withCurrent(regionsData, current?.load, current?.load_name, deletedLabel)}
                    valueKey="id"
                    labelKey="name"
                    placeholder={t("form.region")}
                />

                <FormInput
                    name="load_place"
                    label={t("form.load_place")}
                    placeholder={t("form.load_place")}
                    methods={form}
                    maxLength={255}
                />
            </div>
        </section>
    )
}

export const UnloadSection = ({ form, control, current, regionsData, deletedLabel }: {
    form: UseFormReturn<Direction>
    control: Control<Direction>
    current: Direction | undefined
    regionsData: SelectItem[] | undefined
    deletedLabel: string
}) => {
    const { t } = useTranslation()
    return (
        <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{t("form.unloading_location")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormCombobox
                    required
                    label={t("form.unloading_address")}
                    name="unload"
                    control={control}
                    options={withCurrent(regionsData, current?.unload, current?.unload_name, deletedLabel)}
                    valueKey="id"
                    labelKey="name"
                    placeholder={t("form.region")}
                />

                <FormInput
                    name="unload_place"
                    label={t("form.unload_place")}
                    placeholder={t("form.unload_place")}
                    methods={form}
                    maxLength={255}
                />
            </div>
        </section>
    )
}

export const CargoClientSection = ({ control, current, clientData, cargoType, distributorOptions, deletedLabel }: {
    control: Control<Direction>
    current: Direction | undefined
    clientData: SelectItem[] | undefined
    cargoType: SelectItem[] | undefined
    distributorOptions: SelectItem[]
    deletedLabel: string
}) => {
    const { t } = useTranslation()
    return (
        <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{t("settings.route_configs.section_cargo_client")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormCombobox
                    required
                    label={t("form.cargo_owner")}
                    name="owner"
                    control={control}
                    options={withCurrent(clientData, current?.owner, current?.owner_name, deletedLabel)}
                    labelKey="name"
                    valueKey="id"
                    placeholder={t("form.cargo_owner")}
                />

                <FormCombobox
                    required
                    label={t("form.cargo_type")}
                    name="cargo_type"
                    control={control}
                    options={withCurrent(cargoType, current?.cargo_type, current?.cargo_type_name, deletedLabel)}
                    valueKey="id"
                    labelKey="name"
                    placeholder={t("form.cargo_type")}
                />

                {distributorOptions.length > 0 && (
                    <FormCombobox
                        label={t("form.distributor")}
                        name="distributor_id"
                        control={control}
                        options={distributorOptions}
                        valueKey="id"
                        labelKey="name"
                        placeholder={t("form.distributor")}
                    />
                )}
            </div>
        </section>
    )
}

export const PriceSection = ({ control, paymentType }: {
    control: Control<Direction>
    paymentType: SelectItem[] | undefined
}) => {
    const { t } = useTranslation()
    return (
        <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{t("settings.route_configs.section_price_payment")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormCombobox
                    required
                    label={t("form.payment_type")}
                    name="payment_type"
                    control={control}
                    options={paymentType}
                    valueKey="id"
                    labelKey="name"
                    placeholder={t("form.payment_type")}
                />

                <div className="flex gap-3 md:col-span-2">
                    <div className="flex-1 min-w-0">
                        <FormNumberInput
                            required
                            allowNegative={false}
                            decimalScale={2}
                            thousandSeparator=" "
                            name="price"
                            label={t("form.amount")}
                            placeholder="12 206 000"
                            control={control}
                            registerOptions={{
                                validate: (v) => Number(v) > 0 || t("kassa.amount_gt_zero"),
                            }}
                        />
                    </div>
                </div>


                <FormDatePicker
                    fullWidth
                    required
                    label={t("page.valid_from")}
                    control={control}
                    name="valid_from"
                    placeholder={t("form.select_date")}
                    className="w-full"
                />
            </div>
        </section>
    )
}
