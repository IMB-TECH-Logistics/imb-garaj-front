import Modal from "@/components/custom/modal"
import FormTextarea from "@/components/form/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useHasAction } from "@/constants/useUser"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { formatMoney, formatMoneyText } from "@/lib/format-money"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { toast } from "sonner"

const REQUESTS = "checkout/kassa-v2/requests"
const REJECTED = -10

export type LogisticsAdvance = {
    id: number
    kind_label: string
    status: number
    amount: string
    comment: string | null
    rejected_comment: string | null
    image?: string | null
}

type Props = {
    row: LogisticsAdvance
    onDone: () => void
    errorText: (e: unknown) => string
}

export default function LogisticsAdvanceRow({ row, onDone, errorText }: Props) {
    const { t } = useTranslation()
    const canApprove = useHasAction("manager_cashflow_control" as never)
    const approve = useModal(`kv2-logistics-approve-${row.id}`)
    const reject = useModal(`kv2-logistics-reject-${row.id}`)
    const [preview, setPreview] = useState(false)
    const form = useForm<{ rejected_comment: string }>({ defaultValues: { rejected_comment: "" } })
    const { mutate, isPending } = usePost({ meta: { skipGlobalError: true } })
    const rejected = row.status === REJECTED

    const send = (action: "logistics-approve" | "logistics-reject", body: object, done: string, close: () => void) =>
        mutate(`${REQUESTS}/${row.id}/${action}`, body, {
            onSuccess: () => {
                toast.success(done)
                onDone()
                close()
            },
            onError: (e: unknown) => toast.error(errorText(e)),
        })

    return (
        <div
            className={
                rejected
                    ? "rounded-lg border border-red-600/30 bg-red-600/5 px-3 py-2"
                    : "rounded-lg border border-sky-500/30 bg-sky-500/5 px-3 py-2"
            }
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    {row.image && (
                        <button
                            type="button"
                            onClick={() => setPreview(true)}
                            aria-label={t("trips.pending.check_photo")}
                            className="shrink-0 overflow-hidden rounded-md border hover:opacity-80 transition-opacity"
                        >
                            <img src={row.image} alt={t("trips.pending.check_photo")} className="h-12 w-12 object-cover" />
                        </button>
                    )}
                    <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold tabular-nums whitespace-nowrap">+{formatMoney(Number(row.amount))}</span>
                            <span className="text-sm">{row.kind_label}</span>
                            <Badge variant={rejected ? "destructive" : "orange"} className="w-fit whitespace-nowrap">
                                {rejected ? t("trips.pending.rejected") : t("trips.pending.awaiting_manager")}
                            </Badge>
                        </div>
                        <span className="text-xs font-medium text-sky-700 dark:text-sky-400">{t("trips.pending.logistics_from")}</span>
                    </div>
                </div>
                {canApprove && !rejected && (
                    <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="h-8" onClick={reject.openModal}>
                            {t("trips.pending.reject")}
                        </Button>
                        <Button size="sm" className="h-8" onClick={approve.openModal}>
                            {t("trips.pending.approve")}
                        </Button>
                    </div>
                )}
            </div>
            {rejected && row.rejected_comment && (
                <p className="text-xs text-muted-foreground mt-1">{t("trips.pending.reason_label", { reason: row.rejected_comment })}</p>
            )}
            {!rejected && row.comment && <p className="text-xs text-muted-foreground mt-1">{row.comment}</p>}

            <Dialog open={preview} onOpenChange={setPreview}>
                <DialogContent className="max-w-2xl p-2">
                    {row.image && <img src={row.image} alt={t("trips.pending.check_photo")} className="w-full h-auto rounded-lg" />}
                </DialogContent>
            </Dialog>

            <Modal modalKey={`kv2-logistics-approve-${row.id}`} title={t("trips.pending.approve_title")} size="max-w-md">
                <div className="flex flex-col gap-4">
                    <p className="text-sm">
                        <Trans
                            i18nKey="trips.pending.approve_text"
                            values={{ amount: formatMoneyText(Number(row.amount)) }}
                            components={{ b: <b /> }}
                        />
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={approve.closeModal}>{t("actions.no")}</Button>
                        <Button
                            loading={isPending}
                            onClick={() => send("logistics-approve", {}, t("trips.pending.approved"), approve.closeModal)}
                        >
                            {t("trips.pending.approve")}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal modalKey={`kv2-logistics-reject-${row.id}`} title={t("trips.pending.reject_title")} size="max-w-md">
                <form
                    className="flex flex-col gap-3"
                    onSubmit={form.handleSubmit((v) =>
                        send("logistics-reject", { rejected_comment: v.rejected_comment }, t("trips.pending.rejected_done"), () => {
                            form.reset()
                            reject.closeModal()
                        }),
                    )}
                >
                    <FormTextarea
                        required
                        label={t("trips.pending.reject_reason")}
                        name="rejected_comment"
                        methods={form}
                    />
                    <div className="flex justify-end">
                        <Button type="submit" variant="destructive" className="min-w-32" loading={isPending}>
                            {t("trips.pending.reject")}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
