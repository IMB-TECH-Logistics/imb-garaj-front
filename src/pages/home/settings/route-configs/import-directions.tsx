import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { COMMON_DIRECTIONS } from "@/constants/api-endpoints"
import { useDownloadAsExcel } from "@/hooks/useDownloadAsExcel"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Download, FileSpreadsheet, Upload } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ImportDropzone, ImportRowsTable, ImportSummary } from "./import-parts"
import { ImportResponse } from "./import-types"

const MODAL_KEY = "import-directions"

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
            <ImportDropzone file={file} setDragging={setDragging} pickFile={pickFile} dragging={dragging} />

            {summary && (
                <ImportSummary summary={summary} result={result} />
            )}

            {result && result.rows.some((r) => r.action !== "unchanged") && (
                <ImportRowsTable result={result} />
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
