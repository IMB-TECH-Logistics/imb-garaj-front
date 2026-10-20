import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { FileSpreadsheet } from "lucide-react"
import { useTranslation } from "react-i18next"
import { ACTION_CLASS, ImportResponse } from "./import-types"
const money = (v: string | null) => (v === null ? "—" : formatMoney(Number(v)))

const formatDay = (v: string | null) =>
    v ? format(new Date(v), "dd.MM.yyyy") : "—"
export const ImportDropzone = ({ file, setDragging, pickFile, dragging }: {
    file: File | null
    setDragging: (dragging: boolean) => void
    pickFile: (next: File | null) => void
    dragging: boolean
}) => {
    const { t } = useTranslation()
    return (
        <label
            htmlFor="directions-import-file"
            onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                const dropped = e.dataTransfer.files?.[0]
                if (dropped) pickFile(dropped)
            }}
            className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
                "hover:border-primary hover:bg-primary/5",
                dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30",
                file && "border-solid border-primary/60",
            )}
        >
            <input
                id="directions-import-file"
                type="file"
                accept=".xlsx"
                className="sr-only"
                onChange={(e) => {
                    pickFile(e.target.files?.[0] ?? null)
                    e.target.value = ""
                }}
            />
            <FileSpreadsheet className={cn("h-9 w-9", file ? "text-primary" : "text-muted-foreground")} />
            {file ?
                <>
                    <span className="max-w-full truncate font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(0)} KB · {t("settings.route_configs.import.replace_file")}
                    </span>
                </>
            :   <>
                    <span className="font-medium">{t("settings.route_configs.import.drop_hint")}</span>
                    <span className="text-xs text-muted-foreground">{t("settings.route_configs.import.only_xlsx")}</span>
                </>
            }
        </label>
    )
}

export const ImportSummary = ({ summary, result }: {
    summary: ImportResponse["summary"]
    result: ImportResponse | null
}) => {
    const { t } = useTranslation()
    return (
            <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge className={ACTION_CLASS.created}>
                    {t("settings.route_configs.import.created")}: {summary.created}
                </Badge>
                <Badge className={ACTION_CLASS.updated}>
                    {t("settings.route_configs.import.updated")}: {summary.updated}
                </Badge>
                <Badge className={ACTION_CLASS.unchanged}>
                    {t("settings.route_configs.import.unchanged")}: {summary.unchanged}
                </Badge>
                <Badge className={ACTION_CLASS.error}>
                    {t("settings.route_configs.import.error")}: {summary.error}
                </Badge>
                <span className="text-muted-foreground">
                    {t(
                        result?.applied ?
                            "settings.route_configs.import.orders_done"
                        :   "settings.route_configs.import.orders_preview",
                        { count: summary.orders },
                    )}
                </span>
            </div>
    )
}

export const ImportRowsTable = ({ result }: { result: ImportResponse }) => {
    const { t } = useTranslation()
    return (
            <div className="max-h-[50vh] overflow-auto rounded-lg border">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-secondary">
                        <tr className="text-left">
                            <th className="p-2 w-14">{t("settings.route_configs.import.line")}</th>
                            <th className="p-2">{t("settings.route_configs.import.status")}</th>
                            <th className="p-2">{t("settings.route_configs.import.direction")}</th>
                            <th className="p-2 text-right">{t("settings.route_configs.import.old_price")}</th>
                            <th className="p-2 text-right">{t("settings.route_configs.import.new_price")}</th>
                            <th className="p-2">{t("settings.route_configs.import.valid_from")}</th>
                            <th className="p-2 text-right">{t("settings.route_configs.import.orders")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {result.rows
                            .filter((r) => r.action !== "unchanged")
                            .map((r) => (
                                <tr
                                    key={r.line}
                                    className={cn("border-t align-top", r.action === "error" && "bg-destructive/10")}
                                >
                                    <td className="p-2 tabular-nums">{r.line}</td>
                                    <td className="p-2">
                                        <Badge className={cn("whitespace-nowrap", ACTION_CLASS[r.action])}>
                                            {t(`settings.route_configs.import.${r.action}`)}
                                        </Badge>
                                    </td>
                                    <td className="p-2 min-w-[220px] max-w-[420px] [overflow-wrap:anywhere]">
                                        {r.label && (
                                            <div className="line-clamp-2" title={r.label}>
                                                {r.direction_id ? `#${r.direction_id} ` : ""}
                                                {r.label}
                                            </div>
                                        )}
                                        {r.message && (
                                            <div title={r.message} className={cn("line-clamp-3 text-xs", r.action === "error" ? "text-destructive" : "text-muted-foreground")}>
                                                {r.message}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-2 text-right tabular-nums whitespace-nowrap">{money(r.old_price)}</td>
                                    <td className="p-2 text-right tabular-nums whitespace-nowrap font-medium">{money(r.new_price)}</td>
                                    <td className="p-2 whitespace-nowrap">{formatDay(r.valid_from)}</td>
                                    <td className="p-2 text-right tabular-nums">{r.orders || "—"}</td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
    )
}
