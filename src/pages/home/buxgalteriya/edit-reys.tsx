import { FormCheckbox } from "@/components/form/checkbox"
import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import {
    COMMON_DIRECTIONS,
    MANAGERS_ORDERS,
    MANAGERS_RUNS,
    SETTINGS_SELECTABLE_CLIENT,
    VEHICLES,
    SETTINGS_SELECTABLE_REGION,
    SETTINGS_SELECTABLE_CARGO_TYPE,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { ReysOrder } from "./cols"
import TushumList from "./tushum-list"
import { useTranslation } from "react-i18next"

type Option = { id: number; name: string }

type Direction = {
    id: number
    load: number
    load_name: string
    unload: number
    unload_name: string
    cargo_type: number
    cargo_type_name: string
}

type Vehicle = {
    id: number
    truck_number: string
    truck_type_name: string
}

type Client = { id: number; name: string }

type ReysFormValues = {
    client: number | null
    loading: number | null
    unloading: number | null
    cargo_type: number | null
    vehicle: number | null
    date: string
    direction: number | null
    status: string | null
    type: number | null
    out_of_contract: boolean
    nds_percent?: string | null
}

const ORDER_STATUS_OPTIONS: { id: string; name: string }[] = [
    { id: "-1", name: "Qoralama" },
    { id: "0", name: "Kutilmoqda" },
    { id: "1", name: "Boshlandi" },
    { id: "5", name: "Yuklanmoqda" },
    { id: "6", name: "Yo'lda" },
    { id: "7", name: "Tushirilmoqda" },
    { id: "2", name: "Tugallandi" },
    { id: "3", name: "Bekor qilindi" },
    { id: "4", name: "Arxivlangan" },
]

const ORDER_TYPE_OPTIONS: Option[] = [
    { id: 1, name: "Yukli" },
    { id: 2, name: "Yuksiz" },
]


const withCurrent = (
    options: { id: number; name: string }[],
    id?: number | null,
    name?: string | null,
) =>
    id && !options.some((option) => option.id === id) ?
        [...options, { id, name: `${name ?? id} (o'chirilgan)` }]
    :   options

const EditReysModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("edit-reys")
    const { getData, clearKey } = useGlobalStore()
    const current = getData<ReysOrder>(MANAGERS_RUNS)

    const form = useForm<ReysFormValues>({
        defaultValues: {
            client: current?.client ?? null,
            loading: current?.loading ?? null,
            unloading: current?.unloading ?? null,
            cargo_type: current?.cargo_type ?? null,
            vehicle: null,
            date: current?.date ?? "",
            direction: (current as any)?.direction ?? null,
            status: current?.status != null ? String(current.status) : null,
            type: current?.type ?? null,
            out_of_contract: (current as any)?.out_of_contract ?? false,
            nds_percent: String(current?.nds_percent ?? current?.pct ?? ""),
        },
    })

    const { handleSubmit, control, setValue } = form

    const { data: directionsResponse } = useGet<ListResponse<Direction>>(
        COMMON_DIRECTIONS,
        { params: { page_size: 10000 } },
    )

    const { data: clientsData } = useGet<Client[]>(SETTINGS_SELECTABLE_CLIENT, {
        params: { model_name: "client" },
    })

    const { data: vehiclesData } = useGet<ListResponse<Vehicle>>(VEHICLES, {
        params: { page_size: 10000 },
    })

    const directions = useMemo(
        () => directionsResponse?.results ?? [],
        [directionsResponse],
    )

    const directionOptions = useMemo(
        () =>
            directions.map((d) => ({
                id: d.id,
                name: `${d.load_name} → ${d.unload_name} (${d.cargo_type_name})`,
            })),
        [directions],
    )

    const { data: regionsData } = useGet<{ id: number; name: string }[]>(
        SETTINGS_SELECTABLE_REGION,
    )

    const { data: cargoTypesReference } = useGet<{ id: number; name: string }[]>(
        SETTINGS_SELECTABLE_CARGO_TYPE,
        { params: { model_name: "cargo-type" } },
    )

    const loadsData = useMemo(
        () => withCurrent(regionsData ?? [], current?.loading, current?.loading_name),
        [regionsData, current?.loading, current?.loading_name],
    )

    const unloadsData = useMemo(
        () => withCurrent(regionsData ?? [], current?.unloading, current?.unloading_name),
        [regionsData, current?.unloading, current?.unloading_name],
    )

    const cargoTypesData = useMemo(
        () =>
            withCurrent(
                cargoTypesReference ?? [],
                current?.cargo_type,
                current?.cargo_type_name,
            ),
        [cargoTypesReference, current?.cargo_type, current?.cargo_type_name],
    )

    const vehicleOptions = useMemo(
        () =>
            (vehiclesData?.results ?? []).map((v) => ({
                id: v.id,
                label:
                    v.truck_type_name ?
                        `${v.truck_number} — ${v.truck_type_name}`
                    :   v.truck_number,
            })),
        [vehiclesData],
    )

    const vehiclePrefilledRef = useRef(false)
    useEffect(() => {
        if (vehiclePrefilledRef.current) return
        const list = vehiclesData?.results
        if (!list?.length) return
        if (current?.truck_number) {
            const match = list.find(
                (v) => v.truck_number === current.truck_number,
            )
            if (match) setValue("vehicle", match.id)
        }
        vehiclePrefilledRef.current = true
    }, [vehiclesData, current?.truck_number, setValue])

    const onSuccess = () => {
        toast.success(t("messages.success_edit"))
        clearKey(MANAGERS_RUNS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [MANAGERS_RUNS] })
    }

    const { mutate, isPending } = usePatch({ onSuccess })

    const onSubmit = (values: ReysFormValues) => {
        if (!current?.id) {
            toast.error(t("page.order_id_not_found"))
            return
        }

        const payload: Record<string, unknown> = {}
        if (values.client !== null) payload.client = values.client
        if (values.loading !== null) payload.loading = values.loading
        if (values.unloading !== null) payload.unloading = values.unloading
        if (values.cargo_type !== null) payload.cargo_type = values.cargo_type
        if (values.direction !== null) payload.direction = values.direction
        if (values.status !== null) payload.status = Number(values.status)
        if (values.type !== null) payload.type = values.type
        if (values.date) payload.date = values.date
        const percent =
            values.nds_percent === "" || values.nds_percent == null ?
                null
            :   Number(values.nds_percent)
        const inheritsPercent = current?.nds_percent == null
        if (!(inheritsPercent && percent === current?.pct)) {
            payload.nds_percent = percent
        }
        payload.out_of_contract = values.out_of_contract

        mutate(`${MANAGERS_ORDERS}/${current.id}`, payload)
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-2 gap-4"
        >
            <FormCombobox
                label={t("form.company_name")}
                name="client"
                control={control}
                options={clientsData ?? []}
                valueKey="id"
                labelKey="name"
                placeholder={t("form.company_name")}
            />

            <FormDatePicker
                label={t("form.date")}
                control={control}
                name="date"
                placeholder={t("form.select_date")}
                className="w-full"
            />

            <FormCombobox
                label={t("form.direction")}
                name="direction"
                control={control}
                options={directionOptions}
                valueKey="id"
                labelKey="name"
                placeholder="Yo'nalishni tanlang"
            />

            <FormCombobox
                label={t("table.status")}
                name="status"
                control={control}
                options={ORDER_STATUS_OPTIONS}
                valueKey="id"
                labelKey="name"
                placeholder={t("table.status")}
            />

            <FormCombobox
                label={t("form.loading_location")}
                name="loading"
                control={control}
                options={loadsData}
                valueKey="id"
                labelKey="name"
                placeholder={t("form.loading_location")}
            />

            <FormCombobox
                label={t("form.unloading_location")}
                name="unloading"
                control={control}
                options={unloadsData}
                valueKey="id"
                labelKey="name"
                placeholder={t("form.unloading_location")}
            />

            <FormCombobox
                label={t("form.cargo_type")}
                name="cargo_type"
                control={control}
                options={cargoTypesData}
                valueKey="id"
                labelKey="name"
                placeholder={t("form.cargo_type")}
            />

            <FormCombobox
                label={t("form.trip_type")}
                name="type"
                control={control}
                options={ORDER_TYPE_OPTIONS}
                valueKey="id"
                labelKey="name"
                placeholder={t("form.trip_type")}
            />

            <FormCombobox
                label={t("form.truck")}
                name="vehicle"
                control={control}
                options={vehicleOptions}
                valueKey="id"
                labelKey="label"
                placeholder={t("form.truck")}
            />

            <FormNumberInput
                name="nds_percent"
                label={t("form.rate_percent")}
                control={control}
                allowNegative={false}
                decimalScale={0}
                placeholder={t("form.rate_percent")}
            />

            <FormCheckbox
                control={control}
                name="out_of_contract"
                label={t("form.out_of_contract")}
            />

            {current?.id ?
                <TushumList orderId={current.id} />
            :   null}

            <div className="col-span-2 flex justify-end pt-2">
                <Button type="submit" loading={isPending} className="min-w-36">
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default EditReysModal
