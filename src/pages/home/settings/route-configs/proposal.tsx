import { FormDatePicker } from "@/components/form/date-picker"
import { FormNumberInput } from "@/components/form/number-input"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { COMMON_DIRECTIONS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { formatMoney } from "@/lib/format-money"
import { usePost } from "@/hooks/usePost"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Check, Pencil, X } from "lucide-react"
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
            toast.success(t("form.dm_proposal_approved", { count: data?.orders_updated ?? 0 }))
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
        <div className="mt-1 flex flex-col gap-1">
            <TooltipProvider delayDuration={200}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-md border border-amber-400 bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                            {t("form.dm_proposal_badge")}: {formatMoney(Number(proposal.price))}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                        {t("form.dm_proposal_hint", { when })}
                        {proposal.valid_from ? ` ${t("form.dm_proposal_from", { date: format(new Date(proposal.valid_from), "dd/MM/yyyy") })}` : ""}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            {canControl && (
                <div className="flex items-center gap-1">
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-6 gap-1 px-2 text-xs text-emerald-700"
                        disabled={busy}
                        onClick={(e) => {
                            e.stopPropagation()
                            approve(directionId, {})
                        }}
                    >
                        <Check className="size-3" /> {t("form.dm_proposal_approve")}
                    </Button>
                    <Button
                        size="icon"
                        variant="outline"
                        className="size-6"
                        title={t("form.dm_proposal_edit")}
                        disabled={busy}
                        onClick={(e) => {
                            e.stopPropagation()
                            setData(STORE_KEY, { directionId, proposal, currentPrice })
                            openModal()
                        }}
                    >
                        <Pencil className="size-3" />
                    </Button>
                    <Button
                        size="icon"
                        variant="outline"
                        className="size-6 text-destructive"
                        title={t("form.dm_proposal_reject")}
                        disabled={busy}
                        onClick={(e) => {
                            e.stopPropagation()
                            reject(directionId)
                        }}
                    >
                        <X className="size-3" />
                    </Button>
                </div>
            )}
        </div>
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
                    current: target.currentPrice != null ? formatMoney(Number(target.currentPrice)) : t("form.no_price"),
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
