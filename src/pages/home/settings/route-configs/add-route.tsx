import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import {
    COMMON_DIRECTIONS,
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
    cargo_type: number | null
    payment_type: number | null
    currency: number | null
    price: string | null
    valid_from: string | null
    current_price?: DirectionPrice | null
    prices?: DirectionPrice[]
}

type SelectItem = { id: number | string; name: string }

const CURRENCY_OPTIONS = [
    { id: 1, name: "UZS - So'm" },
    { id: 2, name: "USD - AQSh dollari" },
]

const AddRouteConfigModal = () => {
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const current = getData<Direction>(COMMON_DIRECTIONS)

    const form = useForm<Direction>({
        defaultValues: {
            owner: current?.owner ?? null,
            load: current?.load ?? null,
            unload: current?.unload ?? null,
            cargo_type: current?.cargo_type ?? null,
            payment_type: current?.payment_type ?? null,
            currency: current?.currency ?? null,
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

    const onSuccess = () => {
        toast.success(
            `Yo'nalish muvaffaqiyatli ${current?.id ? "tahrirlandi!" : "qo'shildi!"}`,
        )
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
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <FormCombobox
                required
                label="Yuklash manzili"
                name="load"
                control={control}
                options={regionsData}
                valueKey="id"
                labelKey="name"
                placeholder="Hududni tanlang"
            />
            <FormCombobox
                required
                label="Yuk tushirish manzili"
                name="unload"
                control={control}
                options={regionsData}
                valueKey="id"
                labelKey="name"
                placeholder="Hududni tanlang"
            />
            <FormCombobox
                required
                label="Yuk egasi"
                name="owner"
                control={control}
                options={clientData}
                labelKey="name"
                valueKey="id"
                placeholder="Yuk egasini tanlang"
            />
            <FormCombobox
                required
                label="Yuk turi"
                name="cargo_type"
                control={control}
                options={cargoType}
                valueKey="id"
                labelKey="name"
                placeholder="Yuk turini tanlang"
            />
            <FormCombobox
                required
                label="To'lov turi"
                name="payment_type"
                control={control}
                options={paymentType}
                valueKey="id"
                labelKey="name"
                placeholder="To'lov turini tanlang"
            />
            <FormCombobox
                required
                label="Valyuta"
                name="currency"
                control={control}
                options={CURRENCY_OPTIONS}
                valueKey="id"
                labelKey="name"
                placeholder="Valyutani tanlang"
            />
            <FormNumberInput
                required
                thousandSeparator=" "
                name="price"
                label="Summa"
                placeholder="12 206 000"
                control={control}
            />
            <FormDatePicker
                required
                label="Qaysi sanadan amal qiladi"
                control={control}
                name="valid_from"
                placeholder="Sanani tanlang"
                className="w-full"
            />

            <div className="col-span-2 flex items-center justify-end mt-3">
                <Button className="min-w-36" type="submit" loading={isPending}>
                    Saqlash
                </Button>
            </div>
        </form>
    )
}

export default AddRouteConfigModal
