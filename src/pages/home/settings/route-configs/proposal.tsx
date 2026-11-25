import { FormDatePicker } from "@/components/form/date-picker"
import { FormNumberInput } from "@/components/form/number-input"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { COMMON_DIRECTIONS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { formatMoney } from "@/lib/format-money"
import { useGet } from "@/hooks/useGet"
import { usePost } from "@/hooks/usePost"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Check, History, SquarePen, X } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export type PendingProposal = {
    id: number
    status?: number
    price: string | number
    api_price?: string | number | null
    percent?: string | number | null
    valid_from?: string | null
    source?: string
    created?: string
    approved_price?: string | number | null
    approved_valid_from?: string | null
    decided_at?: string | null
    decided_by_name?: string | null
    comment?: string
}

export const PROPOSAL_STATUS = { PENDING: 1, APPROVED: 2, REJECTED: 3 } as const

type ProposalTarget = { directionId: number; proposal: PendingProposal; currentPrice?: string | number | null }

const EDIT_MODAL = "direction-proposal-edit"
const STORE_KEY = "direction-proposal"
const HISTORY_MODAL = "direction-proposal-history"
const HISTORY_KEY = "direction-proposal-history"

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
    const refresh = () =>
        qc.invalidateQueries({
            predicate: (q) => typeof q.queryKey[0] === "string" && String(q.queryKey[0]).startsWith(COMMON_DIRECTIONS),
        })
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
        // proposalId — kelgan narx yozuvining ID'si: har bir narx alohida tasdiqlanadi yoki rad etiladi
        approve: (proposalId: number, payload: Record<string, unknown>, onDone?: () => void) =>
            approve.mutate(`${COMMON_DIRECTIONS}/proposals/${proposalId}/approve`, payload, { onSuccess: () => onDone?.() }),
        reject: (proposalId: number) => reject.mutate(`${COMMON_DIRECTIONS}/proposals/${proposalId}/reject`, {}),
        busy: approve.isPending || reject.isPending,
    }
}

export const ProposalBadge = ({
    directionId,
    proposal,
    currentPrice,
    count = 1,
}: ProposalTarget & { count?: number }) => {
    const { t } = useTranslation()
    const canControl = useHasAction("settings_directions_control")
    const { approve, reject, busy } = useProposalActions()
    const { openModal } = useModal(EDIT_MODAL)
    const { openModal: openHistory } = useModal(HISTORY_MODAL)
    const { setData } = useGlobalStore()
    const showHistory = () => {
        setData(HISTORY_KEY, { directionId, currentPrice })
        openHistory()
    }
    const when = proposal.created ? format(new Date(proposal.created), "dd/MM/yyyy HH:mm") : ""

    return (
        canControl ? (
            <div
                className="ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-md border border-amber-400/60 bg-amber-500/10 p-0.5"
                onClick={(e) => e.stopPropagation()}
            >
                {count > 1 ? (
                    <button
                        type="button"
                        title={t("form.dm_proposal_history")}
                        className="inline-flex h-6 items-center gap-1 rounded px-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-500/15 dark:text-amber-400"
                        onClick={showHistory}
                    >
                        <History size={14} />
                        {t("form.dm_proposal_count", { count })}
                    </button>
                ) : (
                <>
                <button
                    type="button"
                    disabled={busy}
                    title={`${t("form.dm_proposal_approve")}. ${t("form.dm_proposal_hint", { when })}${proposal.valid_from ? ` ${t("form.dm_proposal_from", { date: format(new Date(proposal.valid_from), "dd/MM/yyyy") })}` : ""}`}
                    className="inline-flex size-6 items-center justify-center rounded text-green-600 transition-colors hover:bg-green-500/15 disabled:opacity-50"
                    onClick={() => approve(proposal.id, {})}
                >
                    <Check size={15} strokeWidth={2.5} />
                </button>
                <button
                    type="button"
                    disabled={busy}
                    title={t("form.dm_proposal_edit")}
                    className="inline-flex size-6 items-center justify-center rounded text-primary transition-colors hover:bg-primary/15 disabled:opacity-50"
                    onClick={() => {
                        setData(STORE_KEY, { directionId, proposal, currentPrice })
                        openModal()
                    }}
                >
                    <SquarePen size={14} />
                </button>
                <button
                    type="button"
                    disabled={busy}
                    title={t("form.dm_proposal_reject")}
                    className="inline-flex size-6 items-center justify-center rounded text-destructive transition-colors hover:bg-destructive/15 disabled:opacity-50"
                    onClick={() => {
                        if (window.confirm(t("form.dm_proposal_reject_confirm"))) reject(proposal.id)
                    }}
                >
                    <X size={15} strokeWidth={2.5} />
                </button>
                <button
                    type="button"
                    title={t("form.dm_proposal_history")}
                    className="inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted"
                    onClick={showHistory}
                >
                    <History size={14} />
                </button>
                </>
                )}
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
                    target.proposal.id,
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

const money = (v?: string | number | null) => (v == null || v === "" ? "—" : formatMoney(Number(v)))
const day = (v?: string | null) => (v ? format(new Date(v), "dd/MM/yyyy") : "—")
const moment = (v?: string | null) => (v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "—")

type HistoryTarget = { directionId: number; currentPrice?: string | number | null }

const HistoryList = () => {
    const { t } = useTranslation()
    const { getData, setData } = useGlobalStore()
    const target = getData<HistoryTarget>(HISTORY_KEY)
    const canControl = useHasAction("settings_directions_control")
    const { approve, reject, busy } = useProposalActions()
    const { openModal: openEdit } = useModal(EDIT_MODAL)
    const { data, isLoading } = useGet<PendingProposal[]>(`${COMMON_DIRECTIONS}/${target?.directionId}/proposals`, {
        enabled: !!target?.directionId,
        options: { staleTime: 0 },
    })
    if (!target) return null
    const rows = data ?? []
    const statusText = (s?: number) =>
        s === PROPOSAL_STATUS.APPROVED
            ? t("form.dm_proposal_st_approved")
            : s === PROPOSAL_STATUS.REJECTED
              ? t("form.dm_proposal_st_rejected")
              : t("form.dm_proposal_st_pending")
    const statusCls = (s?: number) =>
        s === PROPOSAL_STATUS.APPROVED ? "text-green-600" : s === PROPOSAL_STATUS.REJECTED ? "text-destructive" : "text-amber-600"

    return (
        <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{t("form.dm_proposal_history_hint")}</p>
            <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                        <tr>
                            <th className="px-2 py-1.5 text-left font-medium">{t("form.dm_proposal_col_created")}</th>
                            <th className="px-2 py-1.5 text-left font-medium">{t("form.dm_proposal_valid_from")}</th>
                            <th className="px-2 py-1.5 text-right font-medium">{t("form.dm_proposal_col_api")}</th>
                            <th className="px-2 py-1.5 text-right font-medium">{t("form.dm_proposal_col_percent")}</th>
                            <th className="px-2 py-1.5 text-right font-medium">{t("form.amount")}</th>
                            <th className="px-2 py-1.5 text-left font-medium">{t("form.dm_proposal_col_status")}</th>
                            <th className="px-2 py-1.5" />
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr>
                                <td colSpan={7} className="px-2 py-4 text-center text-muted-foreground">
                                    …
                                </td>
                            </tr>
                        )}
                        {rows.map((p) => {
                            const pending = p.status === PROPOSAL_STATUS.PENDING
                            const approved = p.status === PROPOSAL_STATUS.APPROVED
                            const shown = approved && p.approved_price != null ? p.approved_price : p.price
                            const from = approved && p.approved_valid_from ? p.approved_valid_from : p.valid_from
                            return (
                                <tr key={p.id} className="border-t">
                                    <td className="whitespace-nowrap px-2 py-1.5">{moment(p.created)}</td>
                                    <td className="whitespace-nowrap px-2 py-1.5">{day(from)}</td>
                                    <td className="whitespace-nowrap px-2 py-1.5 text-right">{money(p.api_price)}</td>
                                    <td className="whitespace-nowrap px-2 py-1.5 text-right">
                                        {p.percent == null ? "—" : `${Number(p.percent)}%`}
                                    </td>
                                    <td className="whitespace-nowrap px-2 py-1.5 text-right font-medium">{money(shown)}</td>
                                    <td className={`whitespace-nowrap px-2 py-1.5 ${statusCls(p.status)}`}>
                                        {statusText(p.status)}
                                        {!pending && p.decided_by_name ? (
                                            <span className="block text-xs text-muted-foreground">
                                                {p.decided_by_name} · {moment(p.decided_at)}
                                            </span>
                                        ) : null}
                                    </td>
                                    <td className="whitespace-nowrap px-2 py-1.5 text-right">
                                        {pending && canControl ? (
                                            <div className="inline-flex items-center gap-0.5">
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    title={t("form.dm_proposal_approve")}
                                                    className="inline-flex size-6 items-center justify-center rounded text-green-600 hover:bg-green-500/15 disabled:opacity-50"
                                                    onClick={() => approve(p.id, {})}
                                                >
                                                    <Check size={15} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    title={t("form.dm_proposal_edit")}
                                                    className="inline-flex size-6 items-center justify-center rounded text-primary hover:bg-primary/15 disabled:opacity-50"
                                                    onClick={() => {
                                                        setData(STORE_KEY, {
                                                            directionId: target.directionId,
                                                            proposal: p,
                                                            currentPrice: target.currentPrice,
                                                        })
                                                        openEdit()
                                                    }}
                                                >
                                                    <SquarePen size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    title={t("form.dm_proposal_reject")}
                                                    className="inline-flex size-6 items-center justify-center rounded text-destructive hover:bg-destructive/15 disabled:opacity-50"
                                                    onClick={() => {
                                                        if (window.confirm(t("form.dm_proposal_reject_confirm"))) reject(p.id)
                                                    }}
                                                >
                                                    <X size={15} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        ) : null}
                                    </td>
                                </tr>
                            )
                        })}
                        {!isLoading && !rows.length && (
                            <tr>
                                <td colSpan={7} className="px-2 py-4 text-center text-muted-foreground">
                                    {t("form.dm_proposal_history_empty")}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export const ProposalHistoryModal = () => {
    const { t } = useTranslation()
    return (
        <Modal title={t("form.dm_proposal_history")} modalKey={HISTORY_MODAL} size="max-w-4xl">
            <HistoryList />
        </Modal>
    )
}
