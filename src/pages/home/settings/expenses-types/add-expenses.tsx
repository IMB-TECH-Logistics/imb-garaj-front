import { FormCombobox } from "@/components/form/combobox"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { SETTINGS_EXPENSES } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

export enum ExpenseTypeEnum {
    TRUCK = 1,
    ORDER = 2,
    TRIP = 3,
    OFFICE = 4,
}

export const useExpenseTypeOptions = () => {
    const { t } = useTranslation()
    return [
        { label: t("settings.expenses.for_truck"), value: ExpenseTypeEnum.TRUCK },
        { label: t("settings.expenses.for_order"), value: ExpenseTypeEnum.ORDER },
        { label: t("settings.expenses.for_trip"), value: ExpenseTypeEnum.TRIP },
        { label: t("settings.expenses.for_office"), value: ExpenseTypeEnum.OFFICE },
    ]
}

export enum FlowTypeEnum {
    EXPENSE = -1,
    INCOME = 1,
}

export const useFlowTypeOptions = () => {
    const { t } = useTranslation()
    return [
        { label: t("form.expense"), value: FlowTypeEnum.EXPENSE },
        { label: t("settings.expenses.flow_income"), value: FlowTypeEnum.INCOME },
    ]
}

export const useReportLineOptions = () => {
    const { t } = useTranslation()
    return [
        { label: t("fin_report.line_none"), value: "none" },
        { label: t("fin_report.lines.management"), value: "management" },
        { label: t("fin_report.lines.tax_profit"), value: "tax_profit" },
        { label: t("fin_report.lines.tax_vat"), value: "tax_vat" },
        { label: t("fin_report.lines.tax_payroll"), value: "tax_payroll" },
        { label: t("fin_report.lines.tax_cash"), value: "tax_cash" },
        { label: t("fin_report.lines.tax_other"), value: "tax" },
        { label: t("fin_report.lines.rent"), value: "rent" },
        { label: t("fin_report.lines.other_expense"), value: "other" },
    ]
}

const AddExpensesModal = () => {
    const { t } = useTranslation()
    const expenseTypeOptions = useExpenseTypeOptions()
    const flowTypeOptions = useFlowTypeOptions()
    const reportLineOptions = useReportLineOptions()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const currentRole = getData<VehicleRoleType>(SETTINGS_EXPENSES)

    const form = useForm<VehicleRoleType>({
        defaultValues: { ...currentRole, report_line: currentRole?.report_line || "none" } as VehicleRoleType,
    })
    const typeValue = Number(String(form.watch("type") ?? "").replaceAll('"', ""))
    const canBeTrailer =
        (typeValue === ExpenseTypeEnum.TRUCK || typeValue === ExpenseTypeEnum.OFFICE) &&
        Number(String(form.watch("flow_type") ?? "").replaceAll('"', "")) === FlowTypeEnum.EXPENSE
    const isOfficeExpense =
        Number(String(form.watch("type") ?? "").replaceAll('"', "")) === ExpenseTypeEnum.OFFICE &&
        Number(String(form.watch("flow_type") ?? "").replaceAll('"', "")) === FlowTypeEnum.EXPENSE

    const { handleSubmit, reset } = form

    const onSuccess = () => {
        toast.success(
            currentRole?.id ? t("messages.success_edit") : t("messages.success_add"),
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

    const onSubmit = (values: VehicleRoleType) => {
        const payload = {
            ...values,
            type: Number(String(values.type).replaceAll('"', "")),
            flow_type: Number(String(values.flow_type).replaceAll('"', "")),
        }
        payload.for_trailer = canBeTrailer && !!values.for_trailer
        const line = String(values.report_line ?? "").replaceAll('"', "")
        payload.report_line =
            (
                payload.type === ExpenseTypeEnum.OFFICE &&
                payload.flow_type === FlowTypeEnum.EXPENSE &&
                line !== "none"
            ) ?
                line
            :   ""

        if (currentRole?.id) {
            updateMutate(`${SETTINGS_EXPENSES}/${currentRole.id}`, payload)
        } else {
            postMutate(SETTINGS_EXPENSES, payload)
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-1">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                <FormInput
                    required
                    name="name"
                    label={t("form.expense_name")}
                    methods={form}
                    wrapperClassName="md:col-span-2"
                />

                <FormCombobox
                    required
                    name="type"
                    label={t("form.applies_to")}
                    options={expenseTypeOptions}
                    control={form.control}
                    labelKey="label"
                    valueKey="value"
                />

                <FormCombobox
                    required
                    name="flow_type"
                    label={t("form.direction")}
                    options={flowTypeOptions}
                    control={form.control}
                    labelKey="label"
                    valueKey="value"
                />

                {canBeTrailer && (
                    <label className="md:col-span-2 flex items-start gap-2 text-sm">
                        <input type="checkbox" className="mt-0.5 h-4 w-4" {...form.register("for_trailer")} />
                        <span className="flex flex-col">
                            {t("fin_report.for_trailer")}
                            <span className="text-xs text-muted-foreground">{t("fin_report.for_trailer_hint")}</span>
                        </span>
                    </label>
                )}

                {isOfficeExpense && (
                    <div className="md:col-span-2 flex flex-col gap-1">
                        <FormCombobox
                            name="report_line"
                            label={t("fin_report.report_line")}
                            options={reportLineOptions}
                            control={form.control}
                            labelKey="label"
                            valueKey="value"
                        />
                        <span className="text-xs text-muted-foreground">{t("fin_report.report_line_hint")}</span>
                    </div>
                )}

                <div className="flex items-center justify-end gap-2 md:col-span-2">
                    <Button
                        className="min-w-36 w-full md:w-max"
                        type="submit"
                        loading={isPending}
                    >
                        {t("actions.save")}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default AddExpensesModal
