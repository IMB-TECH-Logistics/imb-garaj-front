import Modal from "@/components/custom/modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { COMMON_DIRECTIONS } from "@/constants/api-endpoints"
import { useDownloadAsExcel } from "@/hooks/useDownloadAsExcel"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Download, FileSpreadsheet, Upload } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

const MODAL_KEY = "import-directions"

type ImportAction = "created" | "updated" | "unchanged" | "error"

type ImportRow = {
    line: number
    action: ImportAction
    direction_id: number | null
    label: string
    old_price: string | null
    new_price: string | null
    valid_from: string | null
    orders: number
    message: string
}

type ImportResponse = {
    applied: boolean
    summary: Record<ImportAction | "orders" | "total", number>
    rows: ImportRow[]
}

const ACTION_CLASS: Record<ImportAction, string> = {
    created: "bg-emerald-600 hover:bg-emerald-600 text-white",
    updated: "bg-blue-600 hover:bg-blue-600 text-white",
    unchanged: "bg-muted hover:bg-muted text-muted-foreground",
    error: "bg-destructive hover:bg-destructive text-destructive-foreground",
}

const money = (v: string | null) => (v === null ? "—" : formatMoney(Number(v)))

const formatDay = (v: string | null) =>
    v ? format(new Date(v), "dd.MM.yyyy") : "—"

type Props = {
    templateParams?: Record<string, unknown>
}

export const ImportDirectionsButton = ({ templateParams }: Props) => {
    const { t } = useTranslation()
    const { openModal } = useModal(MODAL_KEY)
    return (
        <>
            <Button
                variant="outline"
                className="flex items-center gap-2 shrink-0"
                onClick={openModal}
                icon={<FileSpreadsheet size={18} />}
            >
                {t("settings.route_configs.import.button")}
            </Button>
            <Modal
                title={t("settings.route_configs.import.title")}
                modalKey={MODAL_KEY}
                size="max-w-5xl"
            >
                <ImportDirectionsForm templateParams={templateParams} />
            </Modal>
        </>
    )
}

const ImportDirectionsForm = ({ templateParams }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal(MODAL_KEY)
    const [file, setFile] = useState<File | null>(null)
    const [result, setResult] = useState<ImportResponse | null>(null)
    const [dragging, setDragging] = useState(false)

    const { trigger: downloadTemplate, isFetching: isDownloading } = useDownloadAsExcel({
        url: `${COMMON_DIRECTIONS}/import-template`,
        name: `yonalishlar_${format(new Date(), "yyyy-MM-dd")}`,
        params: templateParams,
    })

    const { mutateAsync, isPending } = usePost<FormData, ImportResponse>()

    const send = async (apply: boolean) => {
        if (!file) return
        const payload = new FormData()
        payload.append("file", file)
        payload.append("apply", apply ? "true" : "false")
        try {
            const data = await mutateAsync(`${COMMON_DIRECTIONS}/import`, payload)
            setResult(data)
            if (apply) {
                queryClient.invalidateQueries({ queryKey: [COMMON_DIRECTIONS] })
                toast.success(
                    t("settings.route_configs.import.applied", {
                        created: data.summary.created,
                        updated: data.summary.updated,
                        orders: data.summary.orders,
                    }),
                )
            }
        } catch (error: any) {
            const detail = error?.response?.data?.detail ?? error?.response?.data
            toast.error(typeof detail === "string" ? detail : t("settings.route_configs.import.read_error"))
        }
    }

    const pickFile = (next: File | null) => {
        setFile(next)
        setResult(null)
    }

    const summary = result?.summary
    const canApply =
        !!result && !result.applied && !!summary && summary.created + summary.updated > 0

    return (
        <div className="flex flex-col gap-4 min-w-0">
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

            {summary && (
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
            )}

            {result && result.rows.some((r) => r.action !== "unchanged") && (
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
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                    variant="outline"
                    className="flex items-center gap-2 shrink-0"
                    onClick={downloadTemplate}
                    loading={isDownloading}
                    icon={<Download size={18} />}
                >
                    {t("settings.route_configs.import.download_template")}
                </Button>
                <div className="flex flex-wrap gap-2">
                    {result?.applied ?
                        <Button onClick={closeModal}>{t("actions.close")}</Button>
                    :   <>
                            <Button
                                variant="outline"
                                className="flex items-center gap-2"
                                disabled={!file}
                                loading={isPending && !canApply}
                                onClick={() => send(false)}
                                icon={<Upload size={18} />}
                            >
                                {t("settings.route_configs.import.check")}
                            </Button>
                            <Button disabled={!canApply} loading={isPending && canApply} onClick={() => send(true)}>
                                {t("settings.route_configs.import.apply")}
                            </Button>
                        </>
                    }
                </div>
            </div>
        </div>
    )
}
