import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import { Button } from "@/components/ui/button"
import {
    COMMON_DIRECTIONS,
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

    const form = useForm<{
        client: number | null
        loading: number | null
        unloading: number | null
        cargo_type: number | null
        vehicle: number | null
        date: string
    }>({
        defaultValues: {
            client: current?.client ?? null,
            loading: current?.loading ?? null,
            unloading: current?.unloading ?? null,
            cargo_type: current?.cargo_type ?? null,
            vehicle: null,
            date: current?.date ?? "",
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
                label: v.truck_type_name
                    ? `${v.truck_number} — ${v.truck_type_name}`
                    : v.truck_number,
            })),
        [vehiclesData],
    )

    // Vehicle isn't on ReysOrder as an ID — pre-select by matching truck_number
    // against the loaded vehicles list, once both are available.
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

    const { isPending } = usePatch({ onSuccess })

    // TODO: backend API tayyor bo'lganda mutate(`${MANAGERS_RUNS}/${id}`, payload).
    // Payload (speculative): { client, loading, unloading, cargo_type, vehicle,
    // date }. Tushum (amount/payment_type/currency) edits are saved per-row
    // via TushumList and don't go through this main submit.
    const onSubmit = (_values: any) => {
        toast.info("Backend API hali tayyor emas")
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
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
                label="Mashina"
                name="vehicle"
                control={control}
                options={vehicleOptions}
                valueKey="id"
                labelKey="label"
                placeholder="Mashina tanlang"
            />
            {current?.id ? (
                <TushumList orderId={current.id} />
            ) : null}

            <div className="col-span-2 flex justify-end pt-2">
                <Button type="submit" loading={isPending} className="min-w-36">
                    Saqlash
                </Button>
            </div>
        </form>
    )
}

export default EditReysModal
