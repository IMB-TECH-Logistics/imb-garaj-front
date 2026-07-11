import { FormCombobox } from "@/components/form/combobox"
import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import {
    ORDER_CASHFLOWS,
    SETTINTS_PAYMENT_TYPE,
} from "@/constants/api-endpoints"
import { useDelete } from "@/hooks/useDelete"
import { useGet } from "@/hooks/useGet"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, X } from "lucide-react"
import { useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

type PaymentType = { id: number; name: string }

export type OrderCashflow = {
    id: number
    order: number
    action: number
    amount: number | string
    payment_type: number
    currency: number
    currency_course: string | number | null
    category: number | null
}

type RowValues = {
    amount: number | string
    payment_type: number | null
    currency: number
    comment?: string | null
}

const CURRENCY_OPTIONS = [
    { id: 1, name: "UZS" },
    { id: 2, name: "USD" },
]

// Income action — matches manager-reys/create-reys submission and the backend's
// CashFlow.Action.INCOME used when an order is created with incomes.
const INCOME_ACTION = 1

const CASHFLOWS_QUERY_PREFIX = ORDER_CASHFLOWS

const TushumRow = ({
    initial,
    paymentTypes,
    orderId,
    inheritedCategory,
    onDone,
    onCancelDraft,
}: {
    initial: OrderCashflow | null
    paymentTypes: PaymentType[]
    orderId: number
    inheritedCategory: number | null
    onDone: () => void
    onCancelDraft?: () => void
}) => {
    const queryClient = useQueryClient()
    const isNew = !initial

    const form = useForm<RowValues>({
        defaultValues: {
            amount: initial?.amount ?? "",
            payment_type: initial?.payment_type ?? null,
            currency: initial?.currency ?? 1,
        },
    })

    const { control, handleSubmit } = form

    const refresh = () =>
        queryClient.invalidateQueries({ queryKey: [CASHFLOWS_QUERY_PREFIX] })

    const { mutate: create, isPending: creating } = usePost({
        onSuccess: () => {
            toast.success("Tushum qo'shildi")
            refresh()
            onDone()
        },
    })

    const { mutate: update, isPending: updating } = usePatch({
        onSuccess: () => {
            toast.success("Tushum yangilandi")
            refresh()
            onDone()
        },
    })

    const { mutate: remove, isPending: removing } = useDelete({
        onSuccess: () => {
            toast.success("Tushum o'chirildi")
            refresh()
        },
    })

    const submit = (v: RowValues) => {
        if (v.payment_type == null) {
            toast.error("To'lov turini tanlang")
            return
        }

        if (!Number(v.amount)) {
            toast.error("Summani kiriting")
            return
        }

        if (isNew) {
            create(ORDER_CASHFLOWS, {
                order: orderId,
                action: INCOME_ACTION,
                category: inheritedCategory,
                amount: Number(v.amount),
                payment_type: v.payment_type,
                currency: v.currency,
                comment: v?.comment,
            })
        } else {
            update(`${ORDER_CASHFLOWS}/${initial!.id}`, {
                amount: Number(v.amount),
                payment_type: v.payment_type,
                currency: v.currency,
                comment: v?.comment,
            })
        }
    }

    const pending = creating || updating || removing

    return (
        <div className="flex items-end gap-2">
            <div className="flex-1">
                <FormNumberInput
                    name="amount"
                    control={control}
                    thousandSeparator=" "
                    placeholder="0"
                />
            </div>

            <div className="flex-[1.4]">
                <FormCombobox
                    name="payment_type"
                    control={control}
                    options={paymentTypes}
                    valueKey="id"
                    labelKey="name"
                    placeholder="To'lov turi"
                />
            </div>

            <div className="w-28">
                <FormCombobox
                    name="currency"
                    control={control}
                    options={CURRENCY_OPTIONS}
                    valueKey="id"
                    labelKey="name"
                    placeholder="Val."
                    isSearch={false}
                    isClearIcon={false}
                />
            </div>

            <div>
                <FormInput
                    name="comment"
                    methods={form}
                    required
                    placeholder="Izoh"
                />
            </div>

            <Button
                type="button"
                size="sm"
                loading={pending}
                onClick={handleSubmit(submit)}
            >
                Saqlash
            </Button>

            {!isNew && (
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(`${ORDER_CASHFLOWS}/${initial!.id}`)}
                    disabled={pending}
                    title="O'chirish"
                >
                    <Trash2 size={16} className="text-destructive" />
                </Button>
            )}

            {isNew && onCancelDraft && (
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={onCancelDraft}
                    disabled={pending}
                    title="Bekor qilish"
                >
                    <X size={16} />
                </Button>
            )}
        </div>
    )
}

const TushumList = ({ orderId }: { orderId: number }) => {
    const { data: paymentTypes } = useGet<ListResponse<PaymentType>>(
        SETTINTS_PAYMENT_TYPE,
        { params: { page_size: 1000 } },
    )

    const { data: cashflows, isLoading } = useGet<ListResponse<OrderCashflow>>(
        ORDER_CASHFLOWS,
        {
            params: {
                order: orderId,
                action: INCOME_ACTION,
                page_size: 100,
            },
            enabled: !!orderId,
        },
    )

    const [draftIds, setDraftIds] = useState<number[]>([])
    const draftCounterRef = useRef(0)
    const addDraft = () =>
        setDraftIds((ids) => [...ids, ++draftCounterRef.current])
    const removeDraft = (id: number) =>
        setDraftIds((ids) => ids.filter((x) => x !== id))

    const rows = cashflows?.results ?? []
    const inheritedCategory = rows[0]?.category ?? null
    const paymentTypeOptions = paymentTypes?.results ?? []

    return (
        <div className="col-span-2 flex flex-col gap-3 rounded-lg border bg-card/50 p-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tushumlar</span>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addDraft}
                >
                    <Plus size={14} className="mr-1" />
                    Tushum qo'shish
                </Button>
            </div>

            {isLoading && (
                <div className="text-sm text-muted-foreground">
                    Yuklanmoqda...
                </div>
            )}

            {!isLoading && rows.length === 0 && draftIds.length === 0 && (
                <div className="text-sm text-muted-foreground">
                    Bu reys uchun tushumlar yo'q
                </div>
            )}

            {rows.map((cf) => (
                <TushumRow
                    key={cf.id}
                    initial={cf}
                    paymentTypes={paymentTypeOptions}
                    orderId={orderId}
                    inheritedCategory={inheritedCategory}
                    onDone={() => {}}
                />
            ))}

            {draftIds.map((draftId) => (
                <TushumRow
                    key={`draft-${draftId}`}
                    initial={null}
                    paymentTypes={paymentTypeOptions}
                    orderId={orderId}
                    inheritedCategory={inheritedCategory}
                    onDone={() => removeDraft(draftId)}
                    onCancelDraft={() => removeDraft(draftId)}
                />
            ))}
        </div>
    )
}

export default TushumList
