import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { FlowTypeEnum, useExpenseTypeOptions, useFlowTypeOptions } from "./add-expenses"
import { useTranslation } from "react-i18next"

export const useColumnsExpensesTable = () => {
    const { t } = useTranslation()
    const expenseTypeOptions = useExpenseTypeOptions()
    const flowTypeOptions = useFlowTypeOptions()
    return useMemo<ColumnDef<VehicleRoleType>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("form.expense_name"),
                enableSorting: true,
            },
            {
                accessorKey: "type",
                header: t("form.applies_to"),
                enableSorting: true,
                cell: ({ row }) => {
                    const typeValue = row.original.type

                    const typeOption = expenseTypeOptions.find(
                        (option: { value: any }) => option.value === typeValue,
                    )

                    return (
                        <span>
                            {typeOption ? typeOption.label : t("settings.common.unknown")}
                        </span>
                    )
                },
            },
            {
                accessorKey: "flow_type",
                header: t("form.direction"),
                enableSorting: true,
                cell: ({ row }) => {
                    const flow = row.original.flow_type
                    const label = flowTypeOptions.find(
                        (option) => option.value === flow,
                    )?.label
                    if (!label) return "—"
                    return (
                        <Badge
                            variant="outline"
                            className={
                                flow === FlowTypeEnum.INCOME ?
                                    "bg-green-500/10 text-green-600 border-transparent"
                                :   "bg-red-500/10 text-red-600 border-transparent"
                            }
                        >
                            {label}
                        </Badge>
                    )
                },
            },
        ],
        [t, expenseTypeOptions, flowTypeOptions],
    )
}
