import { FormDatePicker } from "@/components/form/date-picker"
import { FormNumberInput } from "@/components/form/number-input"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { COMMON_DIRECTIONS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { formatMoney } from "@/lib/format-money"
import { usePost } from "@/hooks/usePost"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Check, SquarePen, X } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export type PendingProposal = {
    id: number
    price: string | number
    valid_from?: string | null
    source?: string
    created?: string
}

type ProposalTarget = { directionId: number; proposal: PendingProposal; currentPrice?: string | number | null }

const EDIT_MODAL = "direction-proposal-edit"
const STORE_KEY = "direction-proposal"

const errText = (e: any, fallback: string) => {
    const d = e?.response?.data
    if (typeof d === "string") return d
    if (Array.isArray(d)) return String(d[0])
    if (d && typeof d === "object") {
        const v = d.detail ?? Object.values(d)[0]
        return Array.isArray(v) ? String(v[0]) : String(v ?? fallback)
    }
    return fallback
}

const useProposalActions = () => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const refresh = () => qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === COMMON_DIRECTIONS })
    const approve = usePost({
        onSuccess: (data: { orders_updated?: number }) => {
            const n = data?.orders_updated ?? 0
            toast.success(n > 0 ? t("form.dm_proposal_approved_n", { count: n }) : t("form.dm_proposal_approved"))
            refresh()
        },
        onError: (e) => toast.error(errText(e, t("messages.error"))),
    })
    const reject = usePost({
        onSuccess: () => {
            toast.success(t("form.dm_proposal_rejected"))
            refresh()
        },
        onError: (e) => toast.error(errText(e, t("messages.error"))),
    })
    return {
        approve: (id: number, payload: Record<string, unknown>, onDone?: () => void) =>
            approve.mutate(`${COMMON_DIRECTIONS}/${id}/proposal/approve`, payload, { onSuccess: () => onDone?.() }),
        reject: (id: number) => reject.mutate(`${COMMON_DIRECTIONS}/${id}/proposal/reject`, {}),
        busy: approve.isPending || reject.isPending,
    }
}

export const ProposalBadge = ({
    directionId,
    proposal,
    currentPrice,
}: ProposalTarget) => {
    const { t } = useTranslation()
    const canControl = useHasAction("settings_directions_control")
    const { approve, reject, busy } = useProposalActions()
    const { openModal } = useModal(EDIT_MODAL)
    const { setData } = useGlobalStore()
    const when = proposal.created ? format(new Date(proposal.created), "dd/MM/yyyy HH:mm") : ""

    return (
        canControl ? (
            <div className="mt-1 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <Button
                    variant="ghost"
                    className="h-3 p-0"
                    disabled={busy}
                    title={`${t("form.dm_proposal_approve")}. ${t("form.dm_proposal_hint", { when })}${proposal.valid_from ? ` ${t("form.dm_proposal_from", { date: format(new Date(proposal.valid_from), "dd/MM/yyyy") })}` : ""}`}
                    icon={<Check className="text-green-500" size={16} />}
                    onClick={() => approve(directionId, {})}
                />
                <Button
                    variant="ghost"
                    className="h-3 p-0"
                    disabled={busy}
                    title={t("form.dm_proposal_edit")}
                    icon={<SquarePen className="text-primary" size={16} />}
                    onClick={() => {
                        setData(STORE_KEY, { directionId, proposal, currentPrice })
                        openModal()
                    }}
                />
                <Button
                    variant="ghost"
                    className="h-3 p-0"
                    disabled={busy}
                    title={t("form.dm_proposal_reject")}
                    icon={<X className="text-destructive" size={16} />}
                    onClick={() => {
                        if (window.confirm(t("form.dm_proposal_reject_confirm"))) reject(directionId)
                    }}
                />
            </div>
        ) : null
    )
}

const EditForm = () => {
    const { t } = useTranslation()
    const { getData } = useGlobalStore()
    const target = getData<ProposalTarget>(STORE_KEY)
    const { closeModal } = useModal(EDIT_MODAL)
    const { approve, busy } = useProposalActions()
    const form = useForm<{ price: number | ""; valid_from: string }>({
        defaultValues: { price: "", valid_from: "" },
    })
    useEffect(() => {
        if (target)
            form.reset({
                price: Number(target.proposal.price),
                valid_from: target.proposal.valid_from ?? "",
            })
    }, [target, form])
    if (!target) return null

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) =>
                approve(
                    target.directionId,
                    { price: Number(v.price), ...(v.valid_from ? { valid_from: v.valid_from } : {}) },
                    closeModal,
                ),
            )}
        >
            <p className="text-sm text-muted-foreground">
                {t("form.dm_proposal_edit_hint", {
                    incoming: formatMoney(Number(target.proposal.price)),
                })}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormNumberInput
                    required
                    control={form.control}
                    name="price"
                    label={t("form.amount")}
                    thousandSeparator=" "
                    decimalScale={0}
                    allowNegative={false}
                />
                <FormDatePicker fullWidth control={form.control} name="valid_from" label={t("form.dm_proposal_valid_from")} />
            </div>
            <div className="flex justify-end">
                <Button className="min-w-32" type="submit" loading={busy}>
                    {t("form.dm_proposal_save_approve")}
                </Button>
            </div>
        </form>
    )
}

export const ProposalEditModal = () => {
    const { t } = useTranslation()
    return (
        <Modal title={t("form.dm_proposal_edit")} modalKey={EDIT_MODAL} size="max-w-lg">
            <EditForm />
        </Modal>
    )
}
