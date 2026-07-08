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

type Props = {
    log: LogItem | null
    onClose: () => void
}

const ACTION_LABEL: Record<number, string> = {
    1: "Yaratildi",
    2: "Yangilandi",
    3: "O'chirildi",
    4: "Kirish",
    5: "Chiqish",
    6: "Eksport qilindi",
    7: "Import qilindi",
}

const formatValue = (v: unknown): string => {
    if (v === null || v === undefined) return "—"
    if (typeof v === "object") return JSON.stringify(v)
    return String(v)
}

const LogDetailSheet = ({ log, onClose }: Props) => {
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
                    <SheetTitle>Log tafsiloti</SheetTitle>
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
                            <div className="text-muted-foreground">Harakat</div>
                            <Badge variant="default">
                                {ACTION_LABEL[log.action] ?? "Noma'lum"}
                            </Badge>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Bo'lim</div>
                            <div>{log.section || "—"}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Foydalanuvchi</div>
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
                            <div className="text-muted-foreground">Qurilma</div>
                            <div>{log.device || "—"}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">IP manzil</div>
                            <div>{log.ip_address || "—"}</div>
                        </div>
                        <div className="col-span-2">
                            <div className="text-muted-foreground">User Agent</div>
                            <div className="truncate text-xs">{log.user_agent || "—"}</div>
                        </div>
                        {log.comment ? (
                            <div className="col-span-2">
                                <div className="text-muted-foreground">Izoh</div>
                                <div>{log.comment}</div>
                            </div>
                        ) : null}
                    </div>

                    <div>
                        <div className="mb-2 text-sm font-medium">
                            Qaysi maydonlar o'zgargani
                        </div>
                        <div className="overflow-hidden rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="border-b px-3 py-2 text-left font-medium w-40">
                                            Maydon
                                        </th>
                                        <th className="border-b px-3 py-2 text-left font-medium">
                                            Eski qiymat
                                        </th>
                                        <th className="border-b px-3 py-2 text-left font-medium">
                                            Yangi qiymat
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
                                                Qiymatlar yo'q
                                            </td>
                                        </tr>
                                    ) : (
                                        diff.map((row) => (
                                            <tr
                                                key={row.field}
                                                className={row.changed ? "bg-yellow-50/40 dark:bg-yellow-950/20" : ""}
                                            >
                                                <td className="border-b px-3 py-2 font-mono text-xs">
                                                    {row.field}
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
