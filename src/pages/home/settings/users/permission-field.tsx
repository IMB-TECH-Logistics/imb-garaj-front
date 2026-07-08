import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useFormContext, useWatch } from "react-hook-form"

type Action = {
    name: string
    key?: string
    actions?: Action[]
}

type Module = {
    name: string
    actions: Action[]
}

export default function PermissionField() {
    const form = useFormContext()

    const actions =
        (useWatch({
            control: form.control,
            name: "actions",
            defaultValue: [],
        }) as string[]) || []

    const isChecked = (code?: string) => !!code && actions?.includes(code)

    const getAllCodes = (acts: Action[]): string[] =>
        acts
            .flatMap((a) => [a.key, ...(a.actions ? getAllCodes(a.actions) : [])])
            .filter(Boolean) as string[]

    const updateActions = (newActions: string[]) => {
        form.setValue("actions", Array.from(new Set(newActions)))
    }

    const handleParentChange = (item: Action | Module, checked: boolean) => {
        const allCodes = getAllCodes(item.actions || [])
        const parentCode = "key" in item && item.key ? [item.key] : []
        updateActions(
            checked
                ? [...actions, ...parentCode, ...allCodes]
                : actions.filter((code) => ![...parentCode, ...allCodes].includes(code)),
        )
    }

    const handleActionChange = (code?: string, checked?: boolean, parent?: Action) => {
        if (!code) return
        let updated = checked ? [...actions, code] : actions.filter((c) => c !== code)

        if (code.endsWith("_control")) {
            const viewCode = code.replace("_control", "_view")
            if (checked && !updated.includes(viewCode)) updated.push(viewCode)
            if (!checked) updated = updated.filter((c) => c !== viewCode)
        }

        if (checked && parent?.key && !updated.includes(parent.key)) {
            updated.push(parent.key)
        }

        if (!checked && parent?.actions?.every((a) => !updated.includes(a.key!))) {
            updated = updated.filter((c) => c !== parent.key)
        }

        updateActions(updated)
    }

    return (
        <div className="md:col-span-2">
            <div className="grid xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 gap-3">
                    {defaultModules.map((mod) => (
                        <div key={mod.name} className="bg-muted/50 rounded-xl p-4">
                            <Label className="flex items-center gap-2 font-semibold">
                                <Checkbox
                                    checked={mod.actions.some(
                                        (a) =>
                                            isChecked(a.key) ||
                                            a.actions?.some((sa) => isChecked(sa.key)),
                                    )}
                                    onCheckedChange={(checked) => handleParentChange(mod, !!checked)}
                                />
                                {mod.name}
                            </Label>

                            <div className="pl-4 mt-3 flex flex-col gap-3">
                                {mod.actions.map((act) => (
                                    <div key={act.name}>
                                        <Label className="flex items-center gap-2">
                                            <Checkbox
                                                checked={
                                                    !act.actions?.length
                                                        ? isChecked(act.key)
                                                        : act.actions?.some((sa) => isChecked(sa.key))
                                                }
                                                disabled={
                                                    act.key?.endsWith("_view") &&
                                                    actions.includes(act.key.replace("_view", "_control"))
                                                }
                                                onCheckedChange={(checked) =>
                                                    act.actions?.length
                                                        ? handleParentChange(act, !!checked)
                                                        : handleActionChange(act.key, !!checked)
                                                }
                                            />
                                            {act.name}
                                        </Label>

                                        {act.actions && act.actions.length > 0 && (
                                            <div className="pl-5 mt-2 flex flex-col gap-2">
                                                {act.actions.map((sub) => (
                                                    <Label key={sub.name} className="flex items-center gap-2">
                                                        <Checkbox
                                                            checked={isChecked(sub.key)}
                                                            disabled={
                                                                sub.key?.endsWith("_view") &&
                                                                actions.includes(
                                                                    sub.key.replace("_view", "_control"),
                                                                )
                                                            }
                                                            onCheckedChange={(checked) =>
                                                                handleActionChange(sub.key, !!checked, act)
                                                            }
                                                        />
                                                        {sub.name}
                                                    </Label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
        </div>
    )
}

const defaultModules: Module[] = [
    // 1. Meneger
    {
        name: "Meneger",
        actions: [
            {
                name: "Transportlar",
                actions: [
                    { name: "Ko'rish", key: "manager_vehicles_view" },
                    { name: "To'liq boshqarish", key: "manager_vehicles_control" },
                ],
            },
            {
                name: "Kassa",
                actions: [
                    { name: "Ko'rish", key: "manager_cashflow_view" },
                    { name: "To'liq boshqarish", key: "manager_cashflow_control" },
                ],
            },
            {
                name: "Texnik ko'rik",
                actions: [
                    { name: "Ko'rish", key: "manager_tech_check_view" },
                    { name: "To'liq boshqarish", key: "manager_tech_check_control" },
                ],
            },
        ],
    },
    // 2. Buxgalteriya
    {
        name: "Buxgalteriya",
        actions: [
            { name: "Ko'rish", key: "accounting_view" },
            { name: "To'liq boshqarish", key: "accounting_control" },
        ],
    },
    // 3. Investor
    {
        name: "Investor",
        actions: [
            { name: "Ko'rish", key: "investor_view" },
            { name: "To'liq boshqarish", key: "investor_control" },
        ],
    },
    // 4. Moliya
    {
        name: "Moliya",
        actions: [
            { name: "Ko'rish", key: "finance_view" },
            { name: "To'liq boshqarish", key: "finance_control" },
        ],
    },
    // 5. Monitoring
    {
        name: "Monitoring",
        actions: [
            { name: "Ko'rish", key: "monitoring_view" },
            { name: "To'liq boshqarish", key: "monitoring_control" },
        ],
    },
    // 6. Sozlamalar
    {
        name: "Sozlamalar",
        actions: [
            {
                name: "Manzillar",
                actions: [
                    { name: "Ko'rish", key: "settings_locations_view" },
                    { name: "To'liq boshqarish", key: "settings_locations_control" },
                ],
            },
            {
                name: "Yo'nalishlar",
                actions: [
                    { name: "Ko'rish", key: "settings_directions_view" },
                    { name: "To'liq boshqarish", key: "settings_directions_control" },
                ],
            },
            {
                name: "Foydalanuvchilar",
                actions: [
                    { name: "Ko'rish", key: "settings_users_view" },
                    { name: "To'liq boshqarish", key: "settings_users_control" },
                ],
            },
            {
                name: "Haydovchilar",
                actions: [
                    { name: "Ko'rish", key: "settings_drivers_view" },
                    { name: "To'liq boshqarish", key: "settings_drivers_control" },
                ],
            },
            {
                name: "Rollar",
                actions: [
                    { name: "Ko'rish", key: "settings_roles_view" },
                    { name: "To'liq boshqarish", key: "settings_roles_control" },
                ],
            },
            {
                name: "Xaridorlar",
                actions: [
                    { name: "Ko'rish", key: "settings_customers_view" },
                    { name: "To'liq boshqarish", key: "settings_customers_control" },
                ],
            },
            {
                name: "Avtomobillar",
                actions: [
                    { name: "Ko'rish", key: "settings_vehicles_view" },
                    { name: "To'liq boshqarish", key: "settings_vehicles_control" },
                ],
            },
            {
                name: "Mashina turlari",
                actions: [
                    { name: "Ko'rish", key: "settings_vehicle_types_view" },
                    { name: "To'liq boshqarish", key: "settings_vehicle_types_control" },
                ],
            },
            {
                name: "Yuk turi",
                actions: [
                    { name: "Ko'rish", key: "settings_cargo_types_view" },
                    { name: "To'liq boshqarish", key: "settings_cargo_types_control" },
                ],
            },
            {
                name: "To'lov turlari",
                actions: [
                    { name: "Ko'rish", key: "settings_payment_types_view" },
                    { name: "To'liq boshqarish", key: "settings_payment_types_control" },
                ],
            },
            {
                name: "Xarajat turlari",
                actions: [
                    { name: "Ko'rish", key: "settings_expense_types_view" },
                    { name: "To'liq boshqarish", key: "settings_expense_types_control" },
                ],
            },
        ],
    },
]
