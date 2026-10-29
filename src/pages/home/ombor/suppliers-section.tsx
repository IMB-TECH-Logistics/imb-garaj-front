import Modal from "@/components/custom/modal"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { cn } from "@/lib/utils"
import { Kontragent, kontragentUrl, num, onApiError, som, useKontragents, useRefreshFinance } from "@/pages/home/kontragent/api"
import { AddContragentForm } from "@/pages/home/kontragent/forms"
import { LedgerTable, useLedger } from "@/pages/home/kontragent/ledger-table"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpRight, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

const SUPPLIER_CREATE = "supplier-create"
const SUPPLIER_DETAIL = "supplier-detail"
const SUPPLIER_PAY = "supplier-pay"

const openDebt = (s: Kontragent) => Math.max(num(s.balance) - num(s.pending), 0)

const PayForm = ({ supplier }: { supplier: Kontragent }) => {
    const { t } = useTranslation()
    const { closeModal } = useModal(SUPPLIER_PAY)
    const refresh = useRefreshFinance()
    const max = openDebt(supplier)
    const form = useForm<{ amount: number | ""; comment: string }>({ defaultValues: { amount: max, comment: "" } })
    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("wh.receipt.kassa_request_sent"))
            closeModal()
            refresh()
        },
        onError: onApiError(t("messages.error")),
    })

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) => mutate(kontragentUrl(supplier.id, "pay-request"), { amount: Number(v.amount), comment: v.comment.trim() }))}
        >
            <div className="rounded-lg border bg-muted/30 px-3 py-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("suppliers.list.debt")}</span>
                <span className="font-semibold tabular-nums">{som(max)}</span>
            </div>
            <FormNumberInput
                required
                control={form.control}
                name="amount"
                label={t("suppliers.fields.amount")}
                thousandSeparator=" "
                decimalScale={0}
                allowNegative={false}
                isAllowed={({ floatValue }) => floatValue === undefined || floatValue <= max}
                registerOptions={{ validate: (v: unknown) => Number(v) > 0 || t("investors.errors.gt_zero") }}
            />
            <p className="text-xs text-muted-foreground">{t("suppliers.pay_hint")}</p>
            <FormTextarea name="comment" label={t("suppliers.fields.comment")} methods={form} rows={3} />
            <div className="flex justify-end">
                <Button className="min-w-32" type="submit" loading={isPending}>{t("actions.save")}</Button>
            </div>
        </form>
    )
}

const SupplierDetail = ({ supplier }: { supplier: Kontragent }) => {
    const { t } = useTranslation()
    const { openModal: openPay } = useModal(SUPPLIER_PAY)
    const { data: ledger, isLoading } = useLedger(supplier.id)

    return (
        <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
                {[
                    [t("suppliers.list.taken"), num(supplier.taken)],
                    [t("suppliers.list.paid"), num(supplier.given)],
                    [t("suppliers.list.debt"), Math.max(num(supplier.balance), 0)],
                ].map(([label, value]) => (
                    <div key={label as string} className="rounded-lg border px-3 py-2 flex flex-col">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="font-semibold tabular-nums">{som(value as number)}</span>
                    </div>
                ))}
            </div>
            {num(supplier.pending) > 0 && (
                <p className="text-xs text-muted-foreground">{t("contragent.pending_sum", { amount: som(supplier.pending) })}</p>
            )}
            <div className="flex justify-end">
                <Button onClick={openPay} disabled={openDebt(supplier) <= 0}>
                    <ArrowUpRight className="w-4 h-4" />
                    {t("suppliers.actions.pay")}
                </Button>
            </div>
            <LedgerTable rows={ledger} loading={isLoading} />
        </div>
    )
}

const SuppliersSection = () => {
    const { t } = useTranslation()
    const { data: rows = [], isLoading } = useKontragents("supplier")
    const { openModal: openCreate } = useModal(SUPPLIER_CREATE)
    const { openModal: openDetail } = useModal(SUPPLIER_DETAIL)
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const selected = rows.find((r) => r.id === selectedId) ?? null
    const totalDebt = rows.reduce((s, r) => s + Math.max(num(r.balance), 0), 0)

    const cols = useMemo<ColumnDef<Kontragent>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("suppliers.fields.name"),
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="font-medium">{row.original.name}</span>
                        {row.original.phone && <span className="text-xs text-muted-foreground">{row.original.phone}</span>}
                    </div>
                ),
            },
            { accessorKey: "comment", header: t("suppliers.fields.comment"), cell: ({ row }) => row.original.comment || "—" },
            { accessorKey: "taken", header: t("suppliers.list.taken"), cell: ({ row }) => <span className="tabular-nums">{som(row.original.taken)}</span> },
            { accessorKey: "given", header: t("suppliers.list.paid"), cell: ({ row }) => <span className="tabular-nums">{som(row.original.given)}</span> },
            {
                accessorKey: "balance",
                header: t("suppliers.list.debt"),
                cell: ({ row }) => {
                    const v = Math.max(num(row.original.balance), 0)
                    return <span className={cn("tabular-nums", v > 0 && "font-semibold text-amber-600")}>{v > 0 ? som(v) : "—"}</span>
                },
            },
        ],
        [t],
    )

    return (
        <div className="flex flex-col w-full gap-3">
            <DataTable
                numeration
                loading={isLoading}
                columns={cols}
                data={rows}
                onRowClick={(r) => {
                    setSelectedId(r.id)
                    openDetail()
                }}
                head={
                    <div className="flex justify-between items-center gap-3 mb-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg">{t("suppliers.title")}</h1>
                            <Badge>{rows.length}</Badge>
                            {totalDebt > 0 && (
                                <span className="text-sm text-muted-foreground">
                                    {t("suppliers.list.total_debt")}: <span className="font-semibold text-amber-600">{som(totalDebt)}</span>
                                </span>
                            )}
                        </div>
                        <Button icon={<Plus size={16} />} onClick={openCreate}>
                            {t("suppliers.actions.add")}
                        </Button>
                    </div>
                }
            />
            <Modal title={t("suppliers.actions.add")} modalKey={SUPPLIER_CREATE}>
                <AddContragentForm fixedType="supplier" modalKey={SUPPLIER_CREATE} />
            </Modal>
            <Modal title={selected?.name} modalKey={SUPPLIER_DETAIL} size="max-w-4xl">
                {selected && <SupplierDetail supplier={selected} />}
            </Modal>
            <Modal title={t("suppliers.actions.pay_title")} modalKey={SUPPLIER_PAY}>
                {selected && <PayForm key={`${selected.id}-${selected.balance}-${selected.pending}`} supplier={selected} />}
            </Modal>
        </div>
    )
}

export default SuppliersSection
