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
    status: number | null
    type: number | null
    out_of_contract: boolean
    nds_percent?: string | null
}

const ORDER_STATUS_OPTIONS: Option[] = [
    { id: -1, name: "Draft" },
    { id: 0, name: "Pending" },
    { id: 1, name: "Started" },
    { id: 5, name: "Loading" },
    { id: 6, name: "In Transit" },
    { id: 7, name: "Unloading" },
    { id: 2, name: "Completed" },
    { id: 3, name: "Canceled" },
    { id: 4, name: "Archived" },
]

const ORDER_TYPE_OPTIONS: Option[] = [
    { id: 1, name: "Busy" },
    { id: 2, name: "Empty" },
]

const distinctOptions = (
    rows: Direction[],
    picker: (d: Direction) => Option,
): Option[] => {
    const seen = new Set<number>()
    const out: Option[] = []
    for (const row of rows) {
        const { id, name } = picker(row)
        if (seen.has(id)) continue
        seen.add(id)
        out.push({ id, name })
    }
    return out.sort((a, b) => a.name.localeCompare(b.name))
}

const EditReysModal = () => {
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
            status: current?.status ?? null,
            type: current?.type ?? null,
            out_of_contract: (current as any)?.out_of_contract ?? false,
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

    const loadsData = useMemo(
        () =>
            distinctOptions(directions, (d) => ({
                id: d.load,
                name: d.load_name,
            })),
        [directions],
    )

    const unloadsData = useMemo(
        () =>
            distinctOptions(directions, (d) => ({
                id: d.unload,
                name: d.unload_name,
            })),
        [directions],
    )

    const cargoTypesData = useMemo(
        () =>
            distinctOptions(directions, (d) => ({
                id: d.cargo_type,
                name: d.cargo_type_name,
            })),
        [directions],
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
        toast.success("Muvaffaqiyatli tahrirlandi!")
        clearKey(MANAGERS_RUNS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [MANAGERS_RUNS] })
    }

    const { mutate, isPending } = usePatch({ onSuccess })

    const onSubmit = (values: ReysFormValues) => {
        if (!current?.id) {
            toast.error("Order ID topilmadi")
            return
        }

        const payload: Record<string, unknown> = {}
        if (values.client !== null) payload.client = values.client
        if (values.loading !== null) payload.loading = values.loading
        if (values.unloading !== null) payload.unloading = values.unloading
        if (values.cargo_type !== null) payload.cargo_type = values.cargo_type
        if (values.direction !== null) payload.direction = values.direction
        if (values.status !== null) payload.status = values.status
        if (values.type !== null) payload.type = values.type
        if (values.date) payload.date = values.date
        if (values?.nds_percent !== null) payload.nds_percent = values?.nds_percent
        payload.out_of_contract = values.out_of_contract

        mutate(`${MANAGERS_ORDERS}/${current.id}`, payload)
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-2 gap-4"
        >
            <FormCombobox
                label="Firma"
                name="client"
                control={control}
                options={clientsData ?? []}
                valueKey="id"
                labelKey="name"
                placeholder="Firmani tanlang"
            />

            <FormDatePicker
                label="Sana"
                control={control}
                name="date"
                placeholder="Sanani tanlang"
                className="w-full"
            />

            <FormCombobox
                label="Yo'nalish"
                name="direction"
                control={control}
                options={directionOptions}
                valueKey="id"
                labelKey="name"
                placeholder="Yo'nalishni tanlang"
            />

            <FormCombobox
                label="Status"
                name="status"
                control={control}
                options={ORDER_STATUS_OPTIONS}
                valueKey="id"
                labelKey="name"
                placeholder="Statusni tanlang"
            />

            <FormCombobox
                label="Yuklash joyi"
                name="loading"
                control={control}
                options={loadsData}
                valueKey="id"
                labelKey="name"
                placeholder="Yuklash joyini tanlang"
            />

            <FormCombobox
                label="Tushirish joyi"
                name="unloading"
                control={control}
                options={unloadsData}
                valueKey="id"
                labelKey="name"
                placeholder="Tushirish joyini tanlang"
            />

            <FormCombobox
                label="Yuk turi"
                name="cargo_type"
                control={control}
                options={cargoTypesData}
                valueKey="id"
                labelKey="name"
                placeholder="Yuk turini tanlang"
            />

            <FormCombobox
                label="Reys turi"
                name="type"
                control={control}
                options={ORDER_TYPE_OPTIONS}
                valueKey="id"
                labelKey="name"
                placeholder="Reys turini tanlang"
            />

            <FormCombobox
                label="Mashina"
                name="vehicle"
                control={control}
                options={vehicleOptions}
                valueKey="id"
                labelKey="label"
                placeholder="Mashina tanlang"
            />

            <FormNumberInput
                name="nds_percent"
                label="Foiz"
                control={control}
                required
            />

            <FormCheckbox
                control={control}
                name="out_of_contract"
                label="Shartnomadan tashqari"
            />

            {current?.id ?
                <TushumList orderId={current.id} />
            :   null}

            <div className="col-span-2 flex justify-end pt-2">
                <Button type="submit" loading={isPending} className="min-w-36">
                    Saqlash
                </Button>
            </div>
        </form>
    )
}

export default EditReysModal
