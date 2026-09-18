import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { USERS_PERMISSIONS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
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

export default function PermissionField({
    inherited = [],
}: {
    /** Roldan meros qolgan kodlar: belgilangan va o‘zgartirib bo‘lmaydigan. */
    inherited?: string[]
}) {
    const form = useFormContext()
    const inheritedSet = new Set(inherited)
    const { data: modules = [], isLoading } = useGet<Module[]>(USERS_PERMISSIONS)

    const actions =
        (useWatch({
            control: form.control,
            name: "actions",
            defaultValue: [],
        }) as string[]) || []

    const isChecked = (code?: string) =>
        !!code && (actions?.includes(code) || inheritedSet.has(code))

    const isInherited = (code?: string) => !!code && inheritedSet.has(code)

    const getAllCodes = (acts: Action[]): string[] =>
        acts
            .flatMap((a) => [
                a.key,
                ...(a.actions ? getAllCodes(a.actions) : []),
            ])
            .filter(Boolean) as string[]

    const updateActions = (newActions: string[]) => {
        form.setValue("actions", Array.from(new Set(newActions)))
    }

    const handleParentChange = (item: Action | Module, checked: boolean) => {
        const allCodes = getAllCodes(item.actions || [])
        const parentCode = "key" in item && item.key ? [item.key] : []
        updateActions(
            checked ?
                [...actions, ...parentCode, ...allCodes]
            :   actions.filter(
                    (code) => ![...parentCode, ...allCodes].includes(code),
                ),
        )
    }

    const handleActionChange = (
        code?: string,
        checked?: boolean,
        parent?: Action,
    ) => {
        if (!code) return
        let updated =
            checked ? [...actions, code] : actions.filter((c) => c !== code)

        if (code.endsWith("_control")) {
            const viewCode = code.replace("_control", "_view")
            if (checked && !updated.includes(viewCode)) updated.push(viewCode)
            if (!checked) updated = updated.filter((c) => c !== viewCode)
        }

        if (checked && parent?.key && !updated.includes(parent.key)) {
            updated.push(parent.key)
        }

        if (
            !checked &&
            parent?.actions?.every((a) => !updated.includes(a.key!))
        ) {
            updated = updated.filter((c) => c !== parent.key)
        }

        updateActions(updated)
    }

    if (isLoading) {
        return (
            <div className="md:col-span-2 py-6 text-center text-sm text-muted-foreground">
                Ruxsatlar ro'yxati yuklanmoqda...
            </div>
        )
    }

    return (
        <div className="md:col-span-2">
            <div className="grid xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 gap-3">
                {modules.map((mod) => (
                    <div key={mod.name} className="bg-muted/50 rounded-xl p-4">
                        <Label className="flex items-center gap-2 font-semibold">
                            <Checkbox
                                checked={mod.actions.some(
                                    (a) =>
                                        isChecked(a.key) ||
                                        a.actions?.some((sa) =>
                                            isChecked(sa.key),
                                        ),
                                )}
                                disabled={getAllCodes(mod.actions).every(
                                    isInherited,
                                )}
                                onCheckedChange={(checked) =>
                                    handleParentChange(mod, !!checked)
                                }
                            />
                            {mod.name}
                        </Label>

                        <div className="pl-4 mt-3 flex flex-col gap-3">
                            {mod.actions.map((act) => (
                                <div key={act.name}>
                                    <Label className="flex items-center gap-2">
                                        <Checkbox
                                            checked={
                                                !act.actions?.length ?
                                                    isChecked(act.key)
                                                :   act.actions?.some((sa) =>
                                                        isChecked(sa.key),
                                                    )
                                            }
                                            disabled={
                                                (act.actions?.length
                                                    ? getAllCodes(
                                                          act.actions,
                                                      ).every(isInherited)
                                                    : isInherited(act.key)) ||
                                                (act.key?.endsWith("_view") &&
                                                    actions.includes(
                                                        act.key.replace(
                                                            "_view",
                                                            "_control",
                                                        ),
                                                    ))
                                            }
                                            onCheckedChange={(checked) =>
                                                act.actions?.length ?
                                                    handleParentChange(
                                                        act,
                                                        !!checked,
                                                    )
                                                :   handleActionChange(
                                                        act.key,
                                                        !!checked,
                                                    )
                                            }
                                        />
                                        {act.name}
                                    </Label>

                                    {act.actions && act.actions.length > 0 && (
                                        <div className="pl-5 mt-2 flex flex-col gap-2">
                                            {act.actions.map((sub) => (
                                                <Label
                                                    key={sub.name}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Checkbox
                                                        checked={isChecked(
                                                            sub.key,
                                                        )}
                                                        disabled={
                                                            isInherited(
                                                                sub.key,
                                                            ) ||
                                                            (sub.key?.endsWith(
                                                                "_view",
                                                            ) &&
                                                                actions.includes(
                                                                    sub.key.replace(
                                                                        "_view",
                                                                        "_control",
                                                                    ),
                                                                ))
                                                        }
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            handleActionChange(
                                                                sub.key,
                                                                !!checked,
                                                                act,
                                                            )
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
