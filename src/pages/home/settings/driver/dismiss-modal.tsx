import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SETTINGS_DRIVERS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export const DISMISS_MODAL = "driver-dismiss"

const today = () => {
    const d = new Date()
    const p = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const errorText = (e: any, fallback: string) => {
    const d = e?.response?.data
    if (!d) return fallback
    if (typeof d === "string") return d
    if (Array.isArray(d)) return String(d[0])
    if (d.detail) return String(d.detail)
    const first = Object.values(d)[0]
    return Array.isArray(first) ? String(first[0]) : typeof first === "string" ? first : fallback
}

export default function DismissDriverModal({ driver }: { driver: DriversType | null }) {
    const { t } = useTranslation()
    const { closeModal } = useModal(DISMISS_MODAL)
    const qc = useQueryClient()
    const [date, setDate] = useState(today())
    const [comment, setComment] = useState("")
    const { mutate, isPending } = usePost({ meta: { skipGlobalError: true } })
    if (!driver) return null
    const submit = () =>
        mutate(`${SETTINGS_DRIVERS}/${driver.id}/dismiss`, { date: date || null, comment }, {
            onSuccess: () => {
                toast.success(t("dismiss.done"))
                qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith("users/drivers") || String(q.queryKey[0]).startsWith("checkout/kassa-v2") })
                setComment("")
                closeModal()
            },
            onError: (e: unknown) => toast.error(errorText(e, t("trips.row.error"))),
        })
    return (
        <div className="flex flex-col gap-3">
            <p className="text-sm">
                <span className="font-medium">{driver.first_name} {driver.last_name}</span>
                <span className="text-muted-foreground"> — {t("dismiss.hint")}</span>
            </p>
            <label className="flex flex-col gap-1 text-sm">
                {t("dismiss.date")}
                <Input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
                {t("dismiss.comment")}
                <Input value={comment} maxLength={500} onChange={(e) => setComment(e.target.value)} placeholder={t("dismiss.comment_ph")} />
            </label>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeModal}>{t("actions.cancel")}</Button>
                <Button variant="destructive" loading={isPending} onClick={submit}>{t("dismiss.action")}</Button>
            </div>
        </div>
    )
}
