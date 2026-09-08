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
import { AlertTriangle } from "lucide-react"
import { useMemo } from "react"
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
    // Denormalised labels the list endpoint returns. They are the only source
    // of a readable name when the referenced row was soft-deleted and so is
    // missing from the `selectable/*` dropdown feeds.
    owner_name?: string
    load_name?: string
    unload_name?: string
    cargo_type_name?: string
}

type SelectItem = { id: number | string; name: string }

const CURRENCY_OPTIONS = [
    { id: 1, name: "UZS - So'm" },
    { id: 2, name: "USD - AQSh dollari" },
]

/**
 * Dropdown feeds (`selectable/*`) hide soft-deleted rows, so a direction that
 * points at a deleted region/client renders as an empty "choose…" placeholder
 * even though the table shows a name. Keep the saved value selectable by
 * appending it to the option list, flagged so the user knows it is archived.
 */
const withCurrentValue = (
    options: SelectItem[] | undefined,
    value: number | null | undefined,
    label: string | undefined,
): SelectItem[] => {
    const list = options ?? []
    if (value === null || value === undefined) return list
    if (list.some((o) => Number(o.id) === Number(value))) return list
    return [
        ...list,
        { id: value, name: `${label || `ID ${value}`} (arxivlangan)` },
    ]
}

/**
 * F5-35 / YANGI-03-F3 (3-raund): xato matni ikki nusxada chizilardi — bu
 * sahifaning lokal `FieldMessage` i va maydon komponentining o'z xabari birga
 * ko'rinardi. Butun loyihada bitta qoida qabul qilindi: XATO MATNINI MAYDON
 * KOMPONENTI CHIZADI (`components/form/*` da `hideError` standart `false`),
 * sahifa esa hech nima qo'shmaydi. Lokal `FieldMessage` shuning uchun yo'q.
 */

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

    const { handleSubmit, control, reset, setError, clearErrors } = form

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

    const loadOptions = useMemo(
        () => withCurrentValue(regionsData, current?.load, current?.load_name),
        [regionsData, current?.load, current?.load_name],
    )
    const unloadOptions = useMemo(
        () =>
            withCurrentValue(regionsData, current?.unload, current?.unload_name),
        [regionsData, current?.unload, current?.unload_name],
    )
    const ownerOptions = useMemo(
        () => withCurrentValue(clientData, current?.owner, current?.owner_name),
        [clientData, current?.owner, current?.owner_name],
    )
    const cargoOptions = useMemo(
        () =>
            withCurrentValue(
                cargoType,
                current?.cargo_type,
                current?.cargo_type_name,
            ),
        [cargoType, current?.cargo_type, current?.cargo_type_name],
    )

    // True when at least one saved reference is missing from its live dropdown
    // feed — i.e. the referenced row was archived after this direction was made.
    const hasArchivedRef = useMemo(() => {
        if (!current?.id) return false
        const missing = (
            options: SelectItem[] | undefined,
            value: number | null | undefined,
        ) =>
            value != null &&
            !!options &&
            !options.some((o) => Number(o.id) === Number(value))
        return (
            missing(regionsData, current.load) ||
            missing(regionsData, current.unload) ||
            missing(clientData, current.owner) ||
            missing(cargoType, current.cargo_type)
        )
    }, [current, regionsData, clientData, cargoType])

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
        // A direction from X to X is not a trip. The server accepts it today
        // (see backend-kerak/F3.md — S1-18), so block it here as well.
        if (
            values.load != null &&
            values.unload != null &&
            Number(values.load) === Number(values.unload)
        ) {
            setError("unload", {
                type: "validate",
                message:
                    "Yuk tushirish manzili yuklash manzilidan farq qilishi kerak",
            })
            toast.error(
                "Boshlanish va tugash nuqtasi bir xil bo'lishi mumkin emas",
            )
            return
        }
        clearErrors("unload")

        if (current?.id) {
            updateMutate(`${COMMON_DIRECTIONS}/${current.id}/update`, values)
        } else {
            postMutate(`${COMMON_DIRECTIONS}/create`, values)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            {hasArchivedRef && (
                <div className="col-span-2 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>
                        Bu yo'nalishdagi ba'zi ma'lumotnomalar arxivlangan
                        (o'chirilgan). Ular ro'yxatda "arxivlangan" belgisi
                        bilan ko'rsatilgan — o'zgartirmasangiz avvalgi qiymat
                        saqlanib qoladi.
                    </span>
                </div>
            )}
            <div>
                <FormCombobox
                    required
                    label="Yuklash manzili"
                    name="load"
                    control={control}
                    options={loadOptions}
                    valueKey="id"
                    labelKey="name"
                    placeholder="Hududni tanlang"
                />
            </div>
            <div>
                <FormCombobox
                    required
                    label="Yuk tushirish manzili"
                    name="unload"
                    control={control}
                    options={unloadOptions}
                    valueKey="id"
                    labelKey="name"
                    placeholder="Hududni tanlang"
                />
            </div>
            <div>
                <FormCombobox
                    required
                    label="Yuk egasi"
                    name="owner"
                    control={control}
                    options={ownerOptions}
                    labelKey="name"
                    valueKey="id"
                    placeholder="Yuk egasini tanlang"
                />
            </div>
            <div>
                <FormCombobox
                    required
                    label="Yuk turi"
                    name="cargo_type"
                    control={control}
                    options={cargoOptions}
                    valueKey="id"
                    labelKey="name"
                    placeholder="Yuk turini tanlang"
                />
            </div>
            <div>
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
            </div>
            <div>
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
            </div>
            <FormNumberInput
                required
                allowNegative={false}
                thousandSeparator=" "
                name="price"
                label="Summa"
                placeholder="12 206 000"
                control={control}
                registerOptions={{
                    required: "Summani kiriting",
                    validate: (value: unknown) => {
                        const num = Number(value)
                        if (value === null || value === "" || Number.isNaN(num))
                            return "Summani kiriting"
                        if (num <= 0)
                            return "Summa 0 dan katta bo'lishi kerak (manfiy tarif hisob-kitobni buzadi)"
                        return true
                    },
                }}
            />
            <FormDatePicker
                required
                hideError={false}
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
