import Modal from "@/components/custom/modal"
import { FormDatePicker } from "@/components/form/date-picker"
import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import FormTextarea from "@/components/form/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowUpRight, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { SupplierRow, SupplierTxRow, supplierLedger, supplierRows, useSuppliersStore } from "./suppliers-store"

const SUPPLIER_CREATE = "supplier-create"
const SUPPLIER_DETAIL = "supplier-detail"
const SUPPLIER_PAY = "supplier-pay"

const som = (v: number) => <span className="tabular-nums">{formatMoney(v)}</span>
const d = (v: string) => format(new Date(v), "dd.MM.yyyy")

const AddSupplierForm = () => {
    const { t } = useTranslation()
    const { closeModal } = useModal(SUPPLIER_CREATE)
    const addSupplier = useSuppliersStore((s) => s.addSupplier)
    const form = useForm({ defaultValues: { name: "", phone: "", comment: "" } })

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) => {
                addSupplier(v)
                toast.success(t("messages.success_add"))
                form.reset()
                closeModal()
            })}
        >
            <FormInput required name="name" label={t("suppliers.fields.name")} methods={form} />
            <FormInput name="phone" label={t("suppliers.fields.phone")} placeholder="+998" methods={form} />
            <FormTextarea name="comment" label={t("suppliers.fields.comment")} methods={form} rows={3} />
            <div className="flex justify-end">
                <Button className="min-w-32" type="submit">{t("actions.save")}</Button>
            </div>
        </form>
    )
}

const PayForm = ({ supplier }: { supplier: SupplierRow }) => {
    const { t } = useTranslation()
    const { closeModal } = useModal(SUPPLIER_PAY)
    const addTx = useSuppliersStore((s) => s.addTx)
    const form = useForm<{ date: string; amount: number | ""; comment: string }>({
        defaultValues: { date: format(new Date(), "yyyy-MM-dd"), amount: supplier.debt, comment: "" },
    })

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) => {
                addTx({ supplier_id: supplier.id, date: v.date, dir: "out", amount: Number(v.amount), comment: v.comment })
                toast.success(t("messages.success_add"))
                closeModal()
            })}
        >
            <div className="rounded-lg border bg-muted/30 px-3 py-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("suppliers.list.debt")}</span>
                <span className="font-semibold tabular-nums">{formatMoney(supplier.debt)} {t("page.som")}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormDatePicker required fullWidth control={form.control} name="date" label={t("suppliers.fields.pay_date")} />
                <FormNumberInput
                    required
                    control={form.control}
                    name="amount"
                    label={t("suppliers.fields.amount")}
                    thousandSeparator=" "
                    decimalScale={0}
                    allowNegative={false}
                    registerOptions={{
                        validate: (v: unknown) => {
                            const n = Number(v)
                            if (!(n > 0)) return t("investors.errors.gt_zero")
                            if (n > supplier.debt) return t("suppliers.errors.max_debt")
                            return true
                        },
                    }}
                />
            </div>
            <p className="text-xs text-muted-foreground">{t("suppliers.pay_hint")}</p>
            <FormTextarea name="comment" label={t("suppliers.fields.comment")} methods={form} rows={3} />
            <div className="flex justify-end">
                <Button className="min-w-32" type="submit">{t("actions.save")}</Button>
            </div>
        </form>
    )
}

const SupplierDetail = ({ supplier }: { supplier: SupplierRow }) => {
    const { t } = useTranslation()
    const txs = useSuppliersStore((s) => s.txs)
    const { openModal: openPay } = useModal(SUPPLIER_PAY)
    const ledger = useMemo(() => supplierLedger(txs.filter((tx) => tx.supplier_id === supplier.id)), [txs, supplier.id])

    const cols = useMemo<ColumnDef<SupplierTxRow>[]>(
        () => [
            { accessorKey: "date", header: t("suppliers.fields.date"), cell: ({ row }) => d(row.original.date) },
            {
                accessorKey: "dir",
                header: t("suppliers.fields.kind"),
                cell: ({ row }) => (
                    <Badge
                        variant="outline"
                        className={cn(
                            "font-medium",
                            row.original.dir === "in" ?
                                "bg-amber-500/10 text-amber-600 border-amber-500/30"
                            :   "bg-green-500/10 text-green-600 border-green-500/30",
                        )}
                    >
                        {t(row.original.dir === "in" ? "suppliers.tx.in" : "suppliers.tx.out")}
                    </Badge>
                ),
            },
            {
                accessorKey: "amount",
                header: t("suppliers.fields.amount"),
                cell: ({ row }) => (
                    <span className={cn("tabular-nums font-medium", row.original.dir === "in" ? "text-amber-600" : "text-green-600")}>
                        {row.original.dir === "in" ? "+" : "−"} {formatMoney(row.original.amount)}
                    </span>
                ),
            },
            { accessorKey: "balance", header: t("suppliers.list.debt"), cell: ({ row }) => <span className="font-semibold">{som(row.original.balance)}</span> },
            { accessorKey: "comment", header: t("suppliers.fields.comment"), cell: ({ row }) => row.original.comment || "—" },
        ],
        [t],
    )

    return (
        <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
                {[
                    [t("suppliers.list.taken"), supplier.taken],
                    [t("suppliers.list.paid"), supplier.paid],
                    [t("suppliers.list.debt"), supplier.debt],
                ].map(([label, value]) => (
                    <div key={label as string} className="rounded-lg border px-3 py-2 flex flex-col">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="font-semibold">{som(value as number)}</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-end">
                <Button onClick={openPay} disabled={supplier.debt <= 0}>
                    <ArrowUpRight className="w-4 h-4" />
                    {t("suppliers.actions.pay")}
                </Button>
            </div>
            <DataTable columns={cols} data={ledger} numeration wrapperClassName="p-0" />
        </div>
    )
}

const SuppliersSection = () => {
    const { t } = useTranslation()
    const suppliers = useSuppliersStore((s) => s.suppliers)
    const txs = useSuppliersStore((s) => s.txs)
    const { openModal: openCreate } = useModal(SUPPLIER_CREATE)
    const { openModal: openDetail } = useModal(SUPPLIER_DETAIL)
    const [selectedId, setSelectedId] = useState<number | null>(null)

    const rows = useMemo(() => supplierRows(suppliers, txs), [suppliers, txs])
    const selected = rows.find((r) => r.id === selectedId) ?? null
    const totalDebt = rows.reduce((s, r) => s + r.debt, 0)

    const cols = useMemo<ColumnDef<SupplierRow>[]>(
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
            { accessorKey: "taken", header: t("suppliers.list.taken"), cell: ({ row }) => som(row.original.taken) },
            { accessorKey: "paid", header: t("suppliers.list.paid"), cell: ({ row }) => som(row.original.paid) },
            {
                accessorKey: "debt",
                header: t("suppliers.list.debt"),
                cell: ({ row }) => (
                    <span className={cn("tabular-nums", row.original.debt > 0 && "font-semibold text-amber-600")}>
                        {row.original.debt > 0 ? formatMoney(row.original.debt) : "—"}
                    </span>
                ),
            },
        ],
        [t],
    )

    return (
        <div className="flex flex-col w-full gap-3">
            <DataTable
                numeration
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
                                    {t("suppliers.list.total_debt")}:{" "}
                                    <span className="font-semibold text-amber-600">{formatMoney(totalDebt)} {t("page.som")}</span>
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
                <AddSupplierForm />
            </Modal>
            <Modal title={selected?.name} modalKey={SUPPLIER_DETAIL} size="max-w-4xl">
                {selected && <SupplierDetail supplier={selected} />}
            </Modal>
            <Modal title={t("suppliers.actions.pay_title")} modalKey={SUPPLIER_PAY}>
                {selected && <PayForm key={`${selected.id}-${selected.debt}`} supplier={selected} />}
            </Modal>
        </div>
    )
}

export default SuppliersSection
