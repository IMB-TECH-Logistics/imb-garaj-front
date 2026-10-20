import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import { FormNumberInput } from "@/components/form/number-input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Control, UseFormSetValue, UseFormWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

type Option = { id: number | string; name: string }
type LogisticsLocked = (field: "loading" | "unloading" | "date" | "client" | "cargo_type") => boolean

export function ReysRouteFields({ control, isNaqd, setValue, watch, clientsData, loadsData, unloadsData, logisticsLocked, loadingValue }: {
    control: Control<any>
    isNaqd: boolean
    setValue: UseFormSetValue<any>
    watch: UseFormWatch<any>
    clientsData: Option[]
    loadsData: Option[]
    unloadsData: Option[]
    logisticsLocked: LogisticsLocked
    loadingValue: any
}) {
    const { t } = useTranslation()
    return (
        <>
            {/* To'lov turi tabs */}
            <Tabs
                value={isNaqd ? "naqd" : "perech"}
                onValueChange={(v) => setValue("is_naqd", v === "naqd")}
            >
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="perech">{t("form.contract")}</TabsTrigger>
                    <TabsTrigger value="naqd">{t("status.cash")}</TabsTrigger>
                </TabsList>
            </Tabs>

            {!isNaqd && (
                <FormCombobox
                    required
                    hideError={false}
                    label={t("form.cargo_owner")}
                    name="client"
                    control={control}
                    options={clientsData ?? []}
                    valueKey="id"
                    labelKey="name"
                    placeholder={t("form.cargo_owner")}
                    addButtonProps={{
                        disabled: logisticsLocked("client"),
                    }}
                />
            )}

            <div className="rounded-lg border bg-card/50 p-4">
                <div className="flex gap-3">
                    <div className="relative shrink-0 w-3">
                        <div className="absolute left-1/2 -translate-x-1/2 top-[18px] w-3 h-3 rounded-full bg-primary" />
                        <div
                            className="absolute left-1/2 -translate-x-1/2 w-px"
                            style={{
                                top: 30,
                                bottom: 18,
                                backgroundImage:
                                    "repeating-linear-gradient(to bottom, hsl(var(--primary)/0.4) 0px, hsl(var(--primary)/0.4) 5px, transparent 5px, transparent 10px)",
                            }}
                        />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-[18px] w-3 h-3 rounded-full border-2 border-primary bg-background" />
                    </div>

                    <div className="flex flex-col gap-4 flex-1">
                        <FormCombobox
                            required
                            hideError={false}
                            name="loading"
                            control={control}
                            options={loadsData}
                            valueKey="id"
                            labelKey="name"
                            placeholder={t("form.loading_location")}
                            addButtonProps={{
                                disabled:
                                    logisticsLocked("loading") ||
                                    (!isNaqd && !watch("client")),
                            }}
                        />
                        <FormCombobox
                            required
                            hideError={false}
                            name="unloading"
                            control={control}
                            options={unloadsData}
                            valueKey="id"
                            labelKey="name"
                            placeholder={t("form.unloading_location")}
                            addButtonProps={{
                                disabled:
                                    logisticsLocked("unloading") ||
                                    !loadingValue,
                            }}
                        />
                    </div>
                </div>

            </div>
        </>
    )
}

export function ReysCityFields({ control, loadsData, activityValue }: {
    control: Control<any>
    loadsData: Option[]
    activityValue: string
}) {
    const { t } = useTranslation()
    return (
        <div className="rounded-lg border bg-card/50 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormCombobox
                required
                hideError={false}
                label={t("form.loading_location")}
                name="loading"
                control={control}
                options={loadsData}
                valueKey="id"
                labelKey="name"
                placeholder={t("form.loading_location")}
            />
            {activityValue === "4" && (
                <FormNumberInput
                    control={control}
                    name="salary_amount"
                    label={t("trips.create_reys.idle_fee")}
                    placeholder={t("trips.create_reys.example_idle_fee")}
                    thousandSeparator=" "
                    allowNegative={false}
                />
            )}
        </div>
    )
}

export function ReysCommonFields({ control, isReysActivity, cargoTypesData, driverOptions, trailerOptions, logisticsLocked, loadingValue, unloadingValue }: {
    control: Control<any>
    isReysActivity: boolean
    cargoTypesData: Option[]
    driverOptions: Option[]
    trailerOptions: Option[]
    logisticsLocked: LogisticsLocked
    loadingValue: any
    unloadingValue: any
}) {
    const { t } = useTranslation()
    return (
        <>
            <div className="flex gap-3">
                {isReysActivity && (
                    <div className="flex-1">
                        <FormCombobox
                            label={t("form.cargo_type")}
                            name="cargo_type"
                            control={control}
                            options={cargoTypesData}
                            valueKey="id"
                            labelKey="name"
                            placeholder={t("status.empty")}
                            addButtonProps={{
                                disabled:
                                    logisticsLocked("cargo_type") ||
                                    !loadingValue ||
                                    !unloadingValue,
                            }}
                        />
                    </div>
                )}
                <div className="flex-1">
                    <FormDatePicker
                        fullWidth
                        required
                        hideError={false}
                        label={t("form.date")}
                        control={control}
                        name="date"
                        placeholder={t("form.select_date")}
                        className="w-full"
                        disabled={logisticsLocked("date")}
                    />
                </div>
            </div>

            <div className="flex gap-3">
                <div className="flex-1">
                    <FormCombobox
                        label={t("form.driver")}
                        name="driver"
                        control={control}
                        options={driverOptions}
                        valueKey="id"
                        labelKey="name"
                        placeholder={t("form.driver")}
                    />
                </div>
                <div className="flex-1">
                    <FormCombobox
                        label={t("form.trailer_number")}
                        name="trailer_number"
                        control={control}
                        options={trailerOptions}
                        valueKey="id"
                        labelKey="name"
                        placeholder={t("form.trailer_number")}
                    />
                </div>
            </div>
        </>
    )
}
