import { Badge } from "@/components/ui/badge"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { format } from "date-fns"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { getFieldLabel } from "./fields"
import { getSectionLabel } from "./sections"

type Props = {
    log: LogItem | null
    onClose: () => void
}

const useActionLabel = (): Record<number, string> => {
    const { t } = useTranslation()
    return {
        1: t("log.created"),
        2: t("log.updated"),
        3: t("log.deleted"),
        4: t("log.login"),
        5: t("log.logout"),
        6: t("log.exported"),
        7: t("log.imported"),
    }
}

const formatValue = (v: unknown): string => {
    if (v === null || v === undefined) return "—"
    if (typeof v === "object") return JSON.stringify(v)
    return String(v)
}

const LogDetailSheet = ({ log, onClose }: Props) => {
    const { t } = useTranslation()
    const ACTION_LABEL = useActionLabel()
    const diff = useMemo(() => {
        const before = (log?.old_data ?? {}) as Record<string, unknown>
        const after = (log?.new_data ?? {}) as Record<string, unknown>
        const keys = new Set<string>([...Object.keys(before), ...Object.keys(after)])
        const rows: { field: string; old: string; new: string; changed: boolean }[] = []
        keys.forEach((k) => {
            const o = formatValue(before[k])
            const n = formatValue(after[k])
            rows.push({ field: k, old: o, new: n, changed: o !== n })
        })
        rows.sort((a, b) => Number(b.changed) - Number(a.changed) || a.field.localeCompare(b.field))
        return rows
    }, [log])

    if (!log) return null

    return (
        <Sheet open={!!log} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-[640px] sm:w-[720px] sm:max-w-none overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{t("page.activity_log_detail")}</SheetTitle>
                    <SheetDescription>
                        {log.model} #{log.obj_id} —{" "}
                        {log.created
                            ? format(new Date(log.created), "yyyy-MM-dd HH:mm:ss")
                            : ""}
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/30 p-3 text-sm">
                        <div>
                            <div className="text-muted-foreground">{t("table.action_log")}</div>
                            <Badge variant="default">
                                {ACTION_LABEL[log.action] ?? t("log.unknown")}
                            </Badge>
                        </div>
                        <div>
                            <div className="text-muted-foreground">{t("page.section")}</div>
                            <div>{getSectionLabel(log.section)}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">{t("table.user_col")}</div>
                            <div>
                                {log.full_name?.trim() || log.username || "—"}{" "}
                                {log.role_name ? (
                                    <span className="text-muted-foreground">
                                        ({log.role_name})
                                    </span>
                                ) : null}
                            </div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">{t("form.device")}</div>
                            <div>{log.device || "—"}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">{t("table.ip_address")}</div>
                            <div>{log.ip_address || "—"}</div>
                        </div>
                        <div className="col-span-2">
                            <div className="text-muted-foreground">{t("table.user_agent")}</div>
                            <div className="truncate text-xs">{log.user_agent || "—"}</div>
                        </div>
                        {log.comment ? (
                            <div className="col-span-2">
                                <div className="text-muted-foreground">{t("form.comment")}</div>
                                <div>{log.comment}</div>
                            </div>
                        ) : null}
                    </div>

                    <div>
                        <div className="mb-2 text-sm font-medium">
                            {t("page.changed_fields")}
                        </div>
                        <div className="overflow-hidden rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="border-b px-3 py-2 text-left font-medium w-40">
                                            {t("table.field_col")}
                                        </th>
                                        <th className="border-b px-3 py-2 text-left font-medium">
                                            {t("table.old_value")}
                                        </th>
                                        <th className="border-b px-3 py-2 text-left font-medium">
                                            {t("table.new_value")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {diff.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-3 py-4 text-center text-muted-foreground"
                                            >
                                                {t("page.no_values")}
                                            </td>
                                        </tr>
                                    ) : (
                                        diff.map((row) => (
                                            <tr
                                                key={row.field}
                                                className={row.changed ? "bg-yellow-50/40 dark:bg-yellow-950/20" : ""}
                                            >
                                                <td className="border-b px-3 py-2 text-xs">
                                                    {getFieldLabel(row.field)}
                                                </td>
                                                <td className="border-b px-3 py-2 align-top">
                                                    {row.changed ? (
                                                        <span className="line-through text-red-600 dark:text-red-400">
                                                            {row.old}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">{row.old}</span>
                                                    )}
                                                </td>
                                                <td className="border-b px-3 py-2 align-top">
                                                    {row.changed ? (
                                                        <span className="text-green-600 dark:text-green-400">
                                                            {row.new}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">{row.new}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default LogDetailSheet
