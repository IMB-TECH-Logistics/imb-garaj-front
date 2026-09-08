import { FormCombobox } from "@/components/form/combobox"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { SETTINGS_EXPENSES } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

/**
 * Backend: apps/checkout/models/expense_category.py → ExpenseCategory.Type
 *   TRUCK = 1, ORDER = 2, TRIP = 3
 * Ilgari frontend faqat 1 va 2 ni bilardi, shuning uchun bazadagi barcha
 * yozuvlar (hammasi type=3) jadvalda "Noma'lum" ko'rinar va tahrirlash
 * oynasida tur bo'sh chiqib, jimgina boshqa turga almashib ketardi (S3-28/S3-29).
 */
export enum ExpenseTypeEnum {
    TRUCK = 1,
    ORDER = 2,
    TRIP = 3,
}

export const EXPENSE_TYPE_OPTIONS = [
    { label: "Yuk mashinasi uchun", value: ExpenseTypeEnum.TRUCK },
    { label: "Buyurtma uchun", value: ExpenseTypeEnum.ORDER },
    { label: "Reys uchun", value: ExpenseTypeEnum.TRIP },
]

/**
 * Backend: ExpenseCategory.FlowType → INCOME = 1, EXPENSE = -1.
 * Formada bu maydon umuman yo'q edi, shuning uchun UI orqali faqat
 * chiqim (default -1) kategoriyasi yaratish mumkin edi (S3-31).
 */
export enum ExpenseFlowEnum {
    INCOME = 1,
    EXPENSE = -1,
}

export const EXPENSE_FLOW_OPTIONS = [
    { label: "Chiqim", value: ExpenseFlowEnum.EXPENSE },
    { label: "Kirim", value: ExpenseFlowEnum.INCOME },
]

export type ExpenseCategoryType = {
    id?: number
    name: string
    type?: number
    flow_type?: number
}

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

const AddExpensesModal = () => {
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const currentExpense = getData<ExpenseCategoryType>(SETTINGS_EXPENSES)

    // Takroriy nom tekshiruvi uchun mavjud ro'yxat (S3-35)
    const { data: existing } = useGet<ListResponse<ExpenseCategoryType>>(
        SETTINGS_EXPENSES,
        { params: { page_size: 1000 } },
    )

    // `values` — reaktiv: tahrirlashda saqlangan tur va yo'nalish
    // oynada to'g'ri ko'rinadi (S3-29).
    const form = useForm<ExpenseCategoryType>({
        values:
            currentExpense?.id ?
                {
                    ...currentExpense,
                    type: currentExpense.type ?? ExpenseTypeEnum.TRIP,
                    flow_type:
                        currentExpense.flow_type ?? ExpenseFlowEnum.EXPENSE,
                }
            :   undefined,
        defaultValues: {
            name: "",
            type: ExpenseTypeEnum.TRIP,
            flow_type: ExpenseFlowEnum.EXPENSE,
        },
    })

    const { handleSubmit, reset } = form

    const onSuccess = () => {
        toast.success(
            `Xarajat turi muvaffaqiyatli ${
                currentExpense?.id ? "tahrirlandi!" : "qo'shildi"
            }`,
        )
        reset()
        clearKey(SETTINGS_EXPENSES)
        closeModal()
        queryClient.refetchQueries({ queryKey: [SETTINGS_EXPENSES] })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
    })

    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
    })

    const isPending = isPendingCreate || isPendingUpdate

    const isDuplicateName = (value: unknown) => {
        const normalized = String(value ?? "")
            .trim()
            .toLowerCase()
        if (!normalized) return true
        const clash = (existing?.results ?? []).some(
            (item) =>
                item.id !== currentExpense?.id &&
                String(item.name ?? "")
                    .trim()
                    .toLowerCase() === normalized,
        )
        return clash ? "Bu nomdagi xarajat turi allaqachon mavjud" : true
    }

    const toNumber = (value: unknown, fallback: number) => {
        const parsed = Number(String(value ?? "").replaceAll('"', ""))
        return Number.isFinite(parsed) && parsed !== 0 ? parsed : fallback
    }

    const onSubmit = (values: ExpenseCategoryType) => {
        const payload = {
            ...values,
            type: toNumber(values.type, ExpenseTypeEnum.TRIP),
            flow_type: toNumber(values.flow_type, ExpenseFlowEnum.EXPENSE),
        }

        if (currentExpense?.id) {
            updateMutate(`${SETTINGS_EXPENSES}/${currentExpense.id}`, payload)
        } else {
            postMutate(SETTINGS_EXPENSES, payload)
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-1">
            <form
                onSubmit={handleSubmit(onSubmit, showValidationErrors)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                <FormInput
                    required
                    name="name"
                    label="Xarajat nomi"
                    methods={form}
                    registerOptions={{ validate: isDuplicateName }}
                />
                <FormCombobox
                    required
                    name="type"
                    label="Xarajat turi"
                    options={EXPENSE_TYPE_OPTIONS}
                    control={form.control}
                    labelKey="label"
                    valueKey="value"
                />
                <FormCombobox
                    required
                    name="flow_type"
                    label="Yo'nalishi"
                    options={EXPENSE_FLOW_OPTIONS}
                    control={form.control}
                    labelKey="label"
                    valueKey="value"
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
    )
}

export default AddExpensesModal
