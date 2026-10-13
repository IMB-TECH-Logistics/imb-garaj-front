import { FormInput } from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { Plus, Trash2 } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"
import { useFieldArray, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { ExpenseForm } from "./types"

const GRID =
    "grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_180px_auto] gap-2 items-center"

type Props = {
    form: UseFormReturn<ExpenseForm>
}

const ServiceLines = ({ form }: Props) => {
    const { t } = useTranslation()
    const { control } = form
    const { fields, append, remove } = useFieldArray({
        control,
        name: "services",
    })
    const lines = useWatch({ control, name: "services" }) ?? []
    const total = lines.reduce((sum, l) => sum + (Number(l?.amount) || 0), 0)

    return (
        <fieldset className="flex flex-col w-full col-span-2">
            <div className="flex items-center justify-between gap-2 flex-wrap pb-1.5">
                <span className="font-medium select-none text-sm">
                    {t("wh.tech.services_block")}
                </span>
                <Button
                    type="button"
                    size="sm"
                    icon={<Plus size={16} />}
                    onClick={() => append({ comment: "", amount: "" })}
                >
                    {t("wh.tech.add_service")}
                </Button>
            </div>

            <div className="rounded-lg bg-muted/60 p-3 text-sm flex flex-col gap-3">
                {fields.length ?
                    <>
                        <div
                            className={cn(
                                GRID,
                                "max-sm:hidden text-xs text-muted-foreground px-0.5",
                            )}
                        >
                            <span>{t("wh.tech.service_comment")}</span>
                            <span>{t("form.amount")}</span>
                            <span className="w-8" />
                        </div>
                        {fields.map((field, index) => (
                            <div key={field.id} className={GRID}>
                                <FormInput
                                    hideError
                                    methods={form}
                                    name={`services.${index}.comment`}
                                    placeholder={t("wh.tech.service_placeholder")}
                                    registerOptions={{
                                        validate: (v) => !!String(v ?? "").trim(),
                                    }}
                                />
                                <FormNumberInput
                                    hideError
                                    control={control}
                                    name={`services.${index}.amount`}
                                    thousandSeparator=" "
                                    decimalScale={2}
                                    allowNegative={false}
                                    placeholder="0"
                                    registerOptions={{
                                        validate: (v) => Number(v) > 0,
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 shrink-0 !text-red-500"
                                    title={t("actions.delete")}
                                    icon={<Trash2 size={16} />}
                                    onClick={() => remove(index)}
                                />
                            </div>
                        ))}
                        <div className="flex justify-end gap-2 px-0.5 text-sm">
                            <span className="text-muted-foreground">
                                {t("wh.tech.services_total")}:
                            </span>
                            <span className="font-semibold tabular-nums">
                                {formatMoney(total)} {t("page.som")}
                            </span>
                        </div>
                    </>
                :   <div className="text-muted-foreground text-center py-2">
                        {t("wh.tech.no_services")}
                    </div>
                }
            </div>
        </fieldset>
    )
}

export default ServiceLines
