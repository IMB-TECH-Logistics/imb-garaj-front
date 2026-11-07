import { FormCombobox } from "@/components/form/combobox"
import { Button } from "@/components/ui/button"
import { PaymentType, isNaqdPaymentTypeName } from "./payment-fields"
import { Trash2 } from "lucide-react"
import { FormNumberInput } from "@/components/form/number-input"
import { useTranslation } from "react-i18next"
import { isWithinMoneyLimit } from "@/lib/money-limit"
import { Control } from "react-hook-form"

export function ReysIncomesSection({ control, incomeFields, allPaymentTypes, selectedPaymentTypeIds, incomes, removeIncome, appendIncome }: {
    control: Control<any>
    incomeFields: { id: string }[]
    allPaymentTypes: PaymentType[]
    selectedPaymentTypeIds: Set<number | null>
    incomes: { payment_type: number | null; amount: string; cash_receiver?: string }[]
    removeIncome: (index: number) => void
    appendIncome: (value: { payment_type: number | null; amount: string; cash_receiver?: string }) => void
}) {
    const { t } = useTranslation()
    const receiverOptions = [
        { id: "driver", name: t("trips.reys_cols.receiver_driver") },
        { id: "kassa", name: t("trips.reys_cols.receiver_kassa") },
    ]
    return (
            <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                <div className="space-y-3">
                {incomeFields.map((field, index) => {
                    const naqd = isNaqdPaymentTypeName(allPaymentTypes.find((pt) => pt.id === incomes[index]?.payment_type)?.name)
                    return (
                    <div
                        key={field.id}
                        className={naqd ? "grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end" : "grid grid-cols-[1fr_1fr_auto] gap-2 items-end"}
                    >
                        <FormCombobox
                            required
                            hideError={false}
                            control={control}
                            name={`incomes.${index}.payment_type`}
                            label={index === 0 ? t("form.payment_type") : ""}
                            options={allPaymentTypes.filter(
                                (pt) => !selectedPaymentTypeIds.has(pt.id) || pt.id === incomes[index]?.payment_type,
                            )}
                            valueKey="id"
                            labelKey="name"
                            placeholder={t("form.select_type")}
                        />

                        <FormNumberInput
                            required
                            control={control}
                            name={`incomes.${index}.amount`}
                            placeholder={t("form.amount")}
                            label={index === 0 ? t("form.amount") : undefined}
                            registerOptions={{
                                validate: (v) =>
                                    Number(v) > 0
                                        ? isWithinMoneyLimit(v) || t("validation.max_amount")
                                        : t("kassa.amount_gt_zero"),
                            }}
                        />

                        {naqd && (
                            <FormCombobox
                                required
                                control={control}
                                name={`incomes.${index}.cash_receiver`}
                                label={index === 0 ? t("trips.reys_cols.cash_receiver") : ""}
                                options={receiverOptions}
                                valueKey="id"
                                labelKey="name"
                            />
                        )}

                        {incomeFields.length > 1 && (
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-10 w-10 shrink-0"
                                aria-label={t("actions.delete")}
                                onClick={() => removeIncome(index)}
                            >
                                <Trash2 size={16} />
                            </Button>
                        )}
                    </div>
                    )
                })}

                <Button
                    type="button"
                    variant="outline"
                    disabled={selectedPaymentTypeIds.size >= allPaymentTypes.length}
                    onClick={() =>
                        appendIncome({
                            payment_type: null,
                            amount: "",
                            cash_receiver: "driver",
                        })
                    }
                >
                    + {t("actions.add")}
                </Button>
                </div>
            </section>
    )
}
