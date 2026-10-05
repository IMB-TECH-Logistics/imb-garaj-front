import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import { FormInput } from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import {
    COMMON_DIRECTIONS,
    COMMON_DIRECTIONS_DISTRIBUTORS,
    PLACES_GEO_ZONES_SELECT,
    SETTINGS_SELECTABLE_CARGO_TYPE,
    SETTINGS_SELECTABLE_CLIENT,
    SETTINGS_SELECTABLE_PAYMENT_TYPE,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { formatDate } from "./cols"

type DirectionPrice = {
    id: number
    price: string | number
    valid_from: string
}

type Direction = {
    id?: number
    owner: number | null
    load: number | null
    unload: number | null
    load_place?: string | null
    unload_place?: string | null
    cargo_type: number | null
    payment_type: number | null
    currency: number | null
    load_zone: number | null
    unload_zone: number | null
    load_zone_name?: string | null
    unload_zone_name?: string | null
    distributor_id: number | null
    distributor_name?: string | null
    distributor_code?: string | null
    distributor_district?: string | null
    price: string | null
    valid_from: string | null
    current_price?: DirectionPrice | null
    prices?: DirectionPrice[]
    owner_name?: string
    load_name?: string
    unload_name?: string
    cargo_type_name?: string
}

type SelectItem = { id: number | string; name: string }

type GeoZoneOption = {
    id: number
    name: string
    lat: number
    lng: number
    radius_m: number
}

type DistributorOption = {
    id: number
    name: string
    code: string | null
    district_name: string | null
}

const distributorLabel = (name?: string | null, code?: string | null, district?: string | null) =>
    [name, code ? `(${code})` : null, district ? `— ${district}` : null].filter(Boolean).join(" ")

const withCurrent = (
    options: SelectItem[] | undefined,
    id: number | null | undefined,
    name?: string,
): SelectItem[] => {
    const list = options ?? []
    if (id == null || list.some((o) => String(o.id) === String(id))) {
        return list
    }
    return [{ id, name: name ? `${name} (o‘chirilgan)` : `#${id}` }, ...list]
}

const CURRENCY_OPTIONS = [
    { id: 1, name: "UZS - So'm" },
    { id: 2, name: "USD - AQSh dollari" },
]

const AddRouteConfigModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const current = getData<Direction>(COMMON_DIRECTIONS)

    const form = useForm<Direction>({
        defaultValues: {
            owner: current?.owner ?? null,
            load: current?.load ?? null,
            unload: current?.unload ?? null,
            load_place: current?.load_place ?? "",
            unload_place: current?.unload_place ?? "",
            load_zone: current?.load_zone ?? null,
            unload_zone: current?.unload_zone ?? null,
            cargo_type: current?.cargo_type ?? null,
            payment_type: current?.payment_type ?? null,
            currency: current?.currency ?? 1,
            distributor_id: current?.distributor_id ?? null,
            price:
                current?.current_price?.price != null
                    ? String(current.current_price.price)
                    : null,
            valid_from: current?.current_price?.valid_from ?? null,
        },
    })

    const { handleSubmit, control, reset } = form

    const { data: clientData } = useGet<SelectItem[]>(SETTINGS_SELECTABLE_CLIENT, {
        params: { model_name: "client" },
    })
    const { data: regionsData } = useGet<SelectItem[]>("selectable/region", {
        params: { model_name: "region" },
    })
    const { data: cargoType } = useGet<SelectItem[]>(SETTINGS_SELECTABLE_CARGO_TYPE, {
        params: { model_name: "cargo-type" },
    })
    const { data: paymentType } = useGet<SelectItem[]>(SETTINGS_SELECTABLE_PAYMENT_TYPE, {
        params: { model_name: "payment-type" },
    })
    const { data: zonesData } = useGet<GeoZoneOption[]>(PLACES_GEO_ZONES_SELECT)
    const { data: distributorsData } = useGet<DistributorOption[]>(COMMON_DIRECTIONS_DISTRIBUTORS)
    const distributorOptions = withCurrent(
        distributorsData?.map((d) => ({ id: d.id, name: distributorLabel(d.name, d.code, d.district_name) })),
        current?.distributor_id,
        current?.distributor_name
            ? distributorLabel(current.distributor_name, current.distributor_code, current.distributor_district)
            : undefined,
    )

    const onSuccess = (
        saved?: Direction,
        variables?: { payload: Direction },
    ) => {
        const sentDate = variables?.payload?.valid_from
        const active = saved?.current_price
        if (sentDate && active && active.valid_from !== sentDate) {
            toast.warning(
                t("messages.direction_price_not_current", {
                    date: formatDate(sentDate),
                    price: String(Math.round(Number(active.price))).replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        " ",
                    ),
                    active_date: formatDate(active.valid_from),
                }),
                { duration: 10000 },
            )
        } else {
            toast.success(
                current?.id ? t("messages.success_edit") : t("messages.success_add"),
            )
        }
        reset()
        clearKey(COMMON_DIRECTIONS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [COMMON_DIRECTIONS] })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({ onSuccess })
    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({ onSuccess })

    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = (values: Direction) => {
        if (current?.id) {
            updateMutate(`${COMMON_DIRECTIONS}/${current.id}/update`, values)
        } else {
            postMutate(`${COMMON_DIRECTIONS}/create`, values)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Yuklash joyi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormCombobox
                        required
                        label={t("form.loading_address")}
                        name="load"
                        control={control}
                        options={withCurrent(regionsData, current?.load, current?.load_name)}
                        valueKey="id"
                        labelKey="name"
                        placeholder={t("form.region")}
                    />

                    <FormInput
                        name="load_place"
                        label={t("form.load_place")}
                        placeholder={t("form.load_place")}
                        methods={form}
                    />

                    <FormCombobox
                        label="Yuklash joyi (lokatsiya)"
                        name="load_zone"
                        control={form.control}
                        options={withCurrent(zonesData, current?.load_zone, current?.load_zone_name ?? undefined)}
                        valueKey="id"
                        labelKey="name"
                        placeholder="Lokatsiyani tanlang"
                    />
                </div>
            </section>

            <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Tushirish joyi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormCombobox
                        required
                        label={t("form.unloading_address")}
                        name="unload"
                        control={control}
                        options={withCurrent(regionsData, current?.unload, current?.unload_name)}
                        valueKey="id"
                        labelKey="name"
                        placeholder={t("form.region")}
                    />

                    <FormInput
                        name="unload_place"
                        label={t("form.unload_place")}
                        placeholder={t("form.unload_place")}
                        methods={form}
                    />

                    <FormCombobox
                        label="Tushirish joyi (lokatsiya)"
                        name="unload_zone"
                        control={form.control}
                        options={withCurrent(zonesData, current?.unload_zone, current?.unload_zone_name ?? undefined)}
                        valueKey="id"
                        labelKey="name"
                        placeholder="Lokatsiyani tanlang"
                    />
                </div>
            </section>

            <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Yuk va mijoz</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormCombobox
                        required
                        label={t("form.cargo_owner")}
                        name="owner"
                        control={control}
                        options={withCurrent(clientData, current?.owner, current?.owner_name)}
                        labelKey="name"
                        valueKey="id"
                        placeholder={t("form.cargo_owner")}
                    />

                    <FormCombobox
                        required
                        label={t("form.cargo_type")}
                        name="cargo_type"
                        control={control}
                        options={withCurrent(cargoType, current?.cargo_type, current?.cargo_type_name)}
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

            <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Narx va to'lov</h3>
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
                            />
                        </div>
                        <div className="w-32 shrink-0">
                            <FormCombobox
                                required
                                label={t("form.currency")}
                                name="currency"
                                isClearIcon={false}
                                control={control}
                                options={CURRENCY_OPTIONS}
                                valueKey="id"
                                labelKey="name"
                                placeholder={t("form.select_currency")}
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

            <div className="md:col-span-2 flex items-center justify-end mt-3">
                <Button className="min-w-36" type="submit" loading={isPending}>
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default AddRouteConfigModal
