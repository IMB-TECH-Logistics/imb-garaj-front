import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"

import { FormCombobox } from "@/components/form/combobox"
import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    MANAGERS_EXPENSES,
    SETTINGS_EXPENSES,
    SETTINTS_PAYMENT_TYPE,
} from "@/constants/api-endpoints"
import { useDelete } from "@/hooks/useDelete"
import { useGet } from "@/hooks/useGet"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { Check, Edit, Plus, Trash } from "lucide-react"

type ExpensesManager = {
    backendId?: number
    id?: number
    amount: number
    category: number
    payment_type: number
    comment: string
    editable?: boolean
}

type FormValues = {
    expenses: ExpensesManager[]
}

type Props = {
    expenses: ExpensesManager[]
}

export default function ExpensesModal({ expenses }: Props) {
    const { getData } = useGlobalStore()
    const currentSelected = getData("expense-id")
    const queryClient = useQueryClient()

    const { data: payments } = useGet(SETTINTS_PAYMENT_TYPE, {
        params: { page_size: 100000 },
    })
    const { data: category } = useGet(SETTINGS_EXPENSES, {
        params: { trip: 3 },
    })

    const { mutate: createExpense } = usePost()
    const { mutate: editExpense } = usePatch()
    const { mutate: deleteExpense } = useDelete()

    const form = useForm<FormValues>({ defaultValues: { expenses: [] } })
    const { control, reset, getValues, setValue } = form
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "expenses",
    })
    useEffect(() => {
        if (expenses?.length) {
            reset({
                expenses: expenses.map((e) => ({
                    ...e,
                    editable: false,
                    backendId: e.id,
                })),
            })
        }
    }, [expenses, reset])

    const handleAdd = () =>
        append({
            amount: 0,
            category: 0,
            payment_type: 0,
            comment: "",
            editable: true,
        })

    const handleDelete = (index: number, backendId?: number) => {
        if (backendId) {
            deleteExpense(`${MANAGERS_EXPENSES}/${backendId}`, {
                onSuccess: () => {
                    toast.success("O'chirildi")
                    queryClient.invalidateQueries({
                        queryKey: [MANAGERS_EXPENSES],
                    })
                },
            })
        }
        remove(index)
    }

    const handleEditToggle = (index: number) => {
        const field = getValues(`expenses.${index}`)
        update(index, { ...field, editable: !field.editable })
    }

    const handleSave = (index: number) => {
        const expense = getValues(`expenses.${index}`)
        const payload = {
            amount: expense.amount,
            category: expense.category,
            payment_type: expense.payment_type,
            comment: expense.comment,
        }

        if (expense.backendId) {
            editExpense(`${MANAGERS_EXPENSES}/${expense.backendId}`, payload, {
                onSuccess: () => {
                    toast.success("Yangilandi")
                    update(index, { ...expense, editable: false })
                    queryClient.invalidateQueries({
                        queryKey: [MANAGERS_EXPENSES],
                    })
                },
            })
        } else {
            createExpense(
                MANAGERS_EXPENSES,
                { trip: currentSelected?.id, ...payload },
                {
                    onSuccess: () => {
                        toast.success("Qo'shildi")
                        update(index, { ...expense, editable: false })
                        queryClient.invalidateQueries({
                            queryKey: [MANAGERS_EXPENSES],
                        })
                    },
                },
            )
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleAdd} size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Qo'shish
                </Button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar-x">
                {fields.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                        Xarajat mavjud emas
                    </p>
                )}

                {fields.map((field, index) => (
                    <Card key={field.id ?? index} className="p-3 relative">
                        <div className="grid grid-cols-2 gap-2">
                            <FormNumberInput
                                control={control}
                                name={`expenses.${index}.amount`}
                                label="Sum"
                                disabled={!field.editable}
                                thousandSeparator=" "
                                decimalScale={0}
                                required
                            />

                            <div
                                className={`pointer-events-${field.editable ? "auto" : "none"} opacity-${field.editable ? "100" : "60"}`}
                            >
                                <FormCombobox
                                    label="Kategoriya"
                                    control={control}
                                    name={`expenses.${index}.category`}
                                    options={category?.results}
                                    valueKey="id"
                                    labelKey="name"
                                    required
                                />
                            </div>

                            <div
                                className={`pointer-events-${field.editable ? "auto" : "none"} opacity-${field.editable ? "100" : "60"}`}
                            >
                                <FormCombobox
                                    label="To'lov turi"
                                    control={control}
                                    name={`expenses.${index}.payment_type`}
                                    options={payments?.results}
                                    valueKey="id"
                                    labelKey="name"
                                    required
                                />
                            </div>

                            <FormInput
                                methods={form}
                                name={`expenses.${index}.comment`}
                                label="Izoh"
                                readOnly={!field.editable}
                                disabled={!field.editable}
                            />
                        </div>

                        <div className="flex justify-end gap-2 mt-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditToggle(index)}
                            >
                                <Edit className="w-4 h-4" />
                            </Button>

                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                    handleDelete(index, field?.backendId)
                                }
                            >
                                <Trash className="w-4 h-4" />
                            </Button>
                            {field.editable && (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleSave(index)}
                                >
                                    <Check className="h-4 w-4 mr-1" /> Saqlash
                                </Button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}
