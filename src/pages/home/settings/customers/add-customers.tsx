import { FormFormatNumberInput } from "@/components/form/format-number-input"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { SETTINGS_CUSTOMERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { fromUzPhone, toUzPhone, uzLocalDigits } from "@/lib/phone"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { KeyboardEvent, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

/**
 * Validatsiya xabarlarini toast orqali ko'rsatish.
 * Sabab: umumiy `FormInput` komponentida `hideError={false}` berilganda
 * `error.message` himoyasiz o'qiladi (components/form/input.tsx:83) va xatosiz
 * holatda sahifa qulab tushadi. O'sha komponent boshqa agent zonasida
 * bo'lgani uchun bu yerda tegilmaydi — xabar toast bilan yetkaziladi (S2-09).
 */
const showValidationErrors = (errors: Record<string, any>) => {
    const messages = Object.values(errors)
        .map((e) => (e as { message?: string })?.message)
        .filter(Boolean) as string[]
    if (messages.length) {
        toast.error(messages.join(" · "), { duration: 6000 })
    }
}

const AddCustomerModal = () => {
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()

    const currentForwarder = getData<CustomersType>(SETTINGS_CUSTOMERS)

    // Takroriy firma nomi / kodi tekshiruvi uchun mavjud ro'yxat (S2-35).
    const { data: existing } = useGet<ListResponse<CustomersType>>(
        SETTINGS_CUSTOMERS,
        { params: { page_size: 1000 } },
    )

    const form = useForm<CustomersType>({
        values:
            currentForwarder?.id ?
                {
                    ...currentForwarder,
                    // Server `+998901112233` beradi, maska esa faqat 9 ta
                    // milliy raqamni kutadi — `lib/phone.ts` dagi yagona
                    // qoidadan foydalaniladi.
                    phone_number: fromUzPhone(currentForwarder?.phone_number),
                }
            :   undefined,
        defaultValues: {
            name: "",
            code: "",
            phone_number: "",
        },
    })

    const { handleSubmit, reset } = form

    /**
     * B-55: telefon maydoni maskali (`+998 ## ### ## ##`) va maska raqam
     * bo'lmagan belgilarni JIMGINA yutib yuboradi. Foydalanuvchi
     * "abc-telefon" yozsa maydon qiymati BO'SH qolardi, "Saqlash" bosilganda
     * yozuv telefonsiz saqlanardi ("Mijoz muvaffaqiyatli qo'shildi") va hech
     * qanday ogohlantirish chiqmasdi — bazada `phone=""` qolib ketardi.
     *
     * Faqat qiymatga qarab bu holatni ajratib bo'lmaydi: qiymat "" — xuddi
     * umuman teginilmagan maydondek ko'rinadi. Shuning uchun maydonga BELGI
     * KIRITISHGA urinilgani alohida belgilanadi, qiymat haqiqatan o'zgarsa
     * (ya'ni belgilar qabul qilindi) belgi bekor qilinadi.
     */
    const phoneTypedRef = useRef(false)
    const phoneValue = form.watch("phone_number")

    useEffect(() => {
        phoneTypedRef.current = false
    }, [phoneValue])

    const markPhoneTyped = (e: KeyboardEvent<HTMLInputElement>) => {
        // Faqat belgi kiritadigan tugmalar hisobga olinadi — Tab, o'q
        // tugmalari, Backspace va Ctrl/Cmd qisqartmalari hisoblanmaydi.
        if (
            e.key.length === 1 &&
            e.key.trim() !== "" &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey
        ) {
            phoneTypedRef.current = true
        }
    }

    // Qo'yib kiritishda (paste) tugma bosilmaydi — alohida belgilanadi.
    const markPhonePasted = () => {
        phoneTypedRef.current = true
    }

    /**
     * Telefon MAJBURIY EMAS: butunlay bo'sh qoldirilgan maydon avvalgidek
     * qabul qilinadi. Faqat "yozdim, lekin to'liq raqam chiqmadi" holati
     * bloklanadi (S2-33 / B-55).
     */
    const validatePhone = (value: unknown) => {
        const local = uzLocalDigits(value)
        if (local.length === 9) return true
        if (!local && !phoneTypedRef.current) return true
        return "Telefon raqami to'liq kiritilmagan (+998 va 9 ta raqam)"
    }

    const onSuccess = () => {
        toast.success(
            `Mijoz muvaffaqiyatli ${currentForwarder?.id ? "tahrirlandi!" : "qo'shildi"} `,
        )

        reset()
        clearKey(SETTINGS_CUSTOMERS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [SETTINGS_CUSTOMERS] })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
    })

    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
    })

    const isPending = isPendingCreate || isPendingUpdate

    const others = (existing?.results ?? []).filter(
        (item) => item.id !== currentForwarder?.id,
    )

    const isDuplicateName = (value: unknown) => {
        const normalized = String(value ?? "")
            .trim()
            .toLowerCase()
        if (!normalized) return true
        return others.some(
            (item) =>
                String(item.name ?? "")
                    .trim()
                    .toLowerCase() === normalized,
        ) ?
                "Bu nomdagi mijoz allaqachon mavjud"
            :   true
    }

    const isDuplicateCode = (value: unknown) => {
        const normalized = String(value ?? "")
            .trim()
            .toLowerCase()
        if (!normalized) return true
        return others.some(
            (item) =>
                String(item.code ?? "")
                    .trim()
                    .toLowerCase() === normalized,
        ) ?
                "Bu firma kodi allaqachon band"
            :   true
    }

    // NDS moliyaviy hisob-kitobda ishlatiladi — 0..100 dan tashqari qiymat
    // ilgari ogohlantirishsiz saqlanardi (S2-34).
    const validateNds = (value: unknown) => {
        if (value === "" || value === null || value === undefined) {
            return "NDS foizini kiriting"
        }
        const parsed = Number(value)
        if (!Number.isFinite(parsed)) return "NDS foizi son bo'lishi kerak"
        if (parsed < 0) return "NDS foizi manfiy bo'lishi mumkin emas"
        if (parsed > 100) return "NDS foizi 100 dan katta bo'lishi mumkin emas"
        return true
    }

    const onSubmit = async (values: CustomersType) => {
        const isValid = await form.trigger()

        if (!isValid) {
            toast.error("Iltimos, barcha maydonlarni to'g'ri to'ldiring")
            return
        }

        // Telefon to'liqligi endi maydonning o'z `validate` qoidasida
        // tekshiriladi (yuqoriga qarang) — bu yerga faqat to'liq yoki
        // butunlay bo'sh raqam yetib keladi.
        const payload = {
            ...values,
            name: String(values.name ?? "").trim(),
            code: String(values.code ?? "").trim(),
            // Prefiks ham saqlanadi — ilgari faqat ko'rinishda bor edi.
            phone_number: toUzPhone(values.phone_number) ?? "",
        }

        if (currentForwarder?.id) {
            updateMutate(
                `${SETTINGS_CUSTOMERS}/${currentForwarder.id}`,
                payload,
            )
        } else {
            postMutate(SETTINGS_CUSTOMERS, payload)
        }
    }

    return (
        <>
            <div className="w-full max-w-4xl mx-auto p-1">
                <form
                    onSubmit={handleSubmit(onSubmit, showValidationErrors)}
                    className="grid md:grid-cols-2 gap-4"
                >
                    <FormInput
                        required
                        name="name"
                        label="Firma nomi"
                        methods={form}
                        registerOptions={{ validate: isDuplicateName }}
                    />

                    <FormInput
                        name="code"
                        label="Firma kodi"
                        methods={form}
                        placeholder="Masalan: 100A"
                        registerOptions={{ validate: isDuplicateCode }}
                    />

                    {/*
                      * B-55: to'liqsiz telefon endi jimgina yo'qolmaydi —
                      * `validate` xatoni maydon OSTIDA chizadi va formani
                      * yuborilishdan to'xtatadi. `onKeyDown`/`onPaste` esa
                      * maska yutib yuborgan belgilarni ham sezish uchun.
                      */}
                    <FormFormatNumberInput
                        control={form.control}
                        format="+998 ## ### ## ##"
                        label={"Telefon"}
                        name={"phone_number"}
                        placeholder="+998 __ ___ __ __"
                        onKeyDown={markPhoneTyped}
                        onPaste={markPhonePasted}
                        registerOptions={{ validate: validatePhone }}
                    />

                    <FormInput
                        required
                        name="nds_percent"
                        label="NDS foizi (%)"
                        methods={form}
                        type="number"
                        step="0.01"
                        placeholder="Masalan: 12"
                        registerOptions={{ validate: validateNds }}
                    />

                    <div className="flex items-center justify-end gap-2 md:col-span-2">
                        <Button
                            className="min-w-36 w-full md:w-max"
                            type="submit"
                            loading={isPending}
                        >
                            {"Saqlash"}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    )
}

export default AddCustomerModal
