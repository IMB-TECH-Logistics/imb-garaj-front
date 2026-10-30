import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { formatMoney, formatNumber } from "@/lib/format-money"
import { formatDateTime } from "@/lib/format-date"
import { cn } from "@/lib/utils"
import { ColumnDef } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useModal } from "@/hooks/useModal"
import { toast } from "sonner"
import { useGet } from "@/hooks/useGet"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { MANAGERS_CASHFLOW, MANAGERS_CASHFLOW_DRIVER_STAT, MANAGERS_CASHFLOW_TRIP_STAT, MANAGERS_EXPENSE_CATEGORIES, MANAGERS_EXPENSES, MANAGERS_INCOMES, MANAGERS_TRIPS } from "@/constants/api-endpoints"
import PendingAdvances from "../pending-advances"
import MoveItemButton from "../move-item-button"
import { ADVANCE_ACTION, ADVANCE_DELETE_MODAL, ADVANCE_EDIT_MODAL, ADVANCE_RETURN_MODAL, AdvanceChangeModals, AdvanceReturnModal, RowMarks, SALARY_REQUEST_MODAL, SalaryRequestModal } from "../row-extras"
import { useHasAction, useUser } from "@/constants/useUser"
import { useTranslation } from "react-i18next"
import { useTripCashClosed } from "../use-trip-cash-closed"
import { FinanceRow, uzsOf, formatAmount } from "./types"
import { AddFinanceForm } from "./add-finance-form"
import { useIncomeCols, noReceiptRow, ReceiptCell, useExpenseCols } from "./columns"
import { AvansForm } from "./avans-form"
import { ModeToggle } from "./mode-toggle"
import { SummaryCard } from "./summary-card"
import { AddFromTAccount } from "./add-from-t-account"

// ──── T hisob tab ────

type Section = "tushum" | "avans" | "xarajat" | "zapravka" | "oylik"

const SECTION_ORDER: Section[] = ["avans", "tushum", "xarajat", "oylik", "zapravka"]

function useSectionAccess() {
    const access = {
        avans: { view: useHasAction(["trip_kassa_advance_view", "trip_kassa_advance_control"]), control: useHasAction("trip_kassa_advance_control") },
        tushum: { view: useHasAction(["trip_kassa_income_view", "trip_kassa_income_control"]), control: useHasAction("trip_kassa_income_control") },
        xarajat: { view: useHasAction(["trip_kassa_expense_view", "trip_kassa_expense_control"]), control: useHasAction("trip_kassa_expense_control") },
        oylik: { view: useHasAction(["trip_kassa_salary_view", "trip_kassa_salary_control"]), control: useHasAction("trip_kassa_salary_control") },
        zapravka: { view: useHasAction(["trip_kassa_fuel_transfer_view", "trip_kassa_fuel_transfer_control"]), control: useHasAction("trip_kassa_fuel_transfer_control") },
    } satisfies Record<Section, { view: boolean; control: boolean }>
    return {
        ...access,
        balance: useHasAction("trip_kassa_balance_view"),
        fuelTank: useHasAction("trip_kassa_fuel_tank_view"),
    }
}

const sectionOfRow = (row: FinanceRow): Section => {
    if (row.action === ADVANCE_ACTION || row.return_id) return "avans"
    if (row.action === 1) return "tushum"
    if (row.category_code === "salary") return "oylik"
    if (row.category_code === "fuel" && /o.?tkaz/i.test(row.payment_type_name ?? "")) return "zapravka"
    return "xarajat"
}

export function TAccountTab({ mode, onToggle, tripId, hideToggle }: { mode: "aylanma" | "haydovchi"; onToggle: (m: "aylanma" | "haydovchi") => void; tripId?: number; hideToggle?: boolean }) {
    const { t } = useTranslation()
    const locked = useTripCashClosed(tripId)
    const lockedTitle = locked ? t("trips.reys_cols.trip_locked") : undefined
    const { openModal: openAvansModal } = useModal("avans-berish")
    const { setData } = useGlobalStore()
    const { data: me } = useUser()
    const isKassaV2 = me?.kassa_mode === "driver_cash" && me?.kassa_version === 2
    const { openModal: openDeleteIncomeModal } = useModal(`${MANAGERS_INCOMES}-thisob-delete`)
    const { openModal: openDeleteExpenseModal } = useModal(`${MANAGERS_EXPENSES}-thisob-delete`)
    const { openModal: openAdvEdit } = useModal(ADVANCE_EDIT_MODAL)
    const { openModal: openAdvDelete } = useModal(ADVANCE_DELETE_MODAL)
    const { openModal: openRowEdit } = useModal("t-hisob-edit")
    const [advRow, setAdvRow] = useState<FinanceRow | null>(null)
    const [editRow, setEditRow] = useState<FinanceRow | null>(null)
    const [addType, setAddType] = useState<"tushum" | "xarajat">("tushum")
    const [addPreset, setAddPreset] = useState<{ category?: string; method?: number; advance?: number }>({})
    const [selectedAdvance, setSelectedAdvance] = useState<number | null>(null)
    const { openModal: openAdd } = useModal("t-hisob-add")
    const { openModal: openSalaryRequest } = useModal(SALARY_REQUEST_MODAL)
    const { openModal: openReturn } = useModal(ADVANCE_RETURN_MODAL)
    const { clearKey } = useGlobalStore()
    const startAdd = (type: "tushum" | "xarajat", preset: { category?: string; method?: number; advance?: number } = {}) => {
        clearKey(MANAGERS_EXPENSES)
        setAddType(type)
        setAddPreset(preset)
        openAdd()
    }
    const access = useSectionAccess()
    const [filter, setFilter] = useState<Section>("avans")
    const firstVisible = SECTION_ORDER.find((s) => access[s].view)
    const filterVisible = access[filter].view
    useEffect(() => {
        if (!filterVisible && firstVisible) setFilter(firstVisible)
    }, [filterVisible, firstVisible])
    const canControlRow = (row: FinanceRow) => access[sectionOfRow(row)].control
    const { mutate: postReturnAction } = usePost({ meta: { skipGlobalError: true } })
    const { data: returnsData, refetch: refetchReturns } = useGet<{ results: { id: number; status: number; amount: string; comment: string | null; created: string; target_cash_flow?: number | null }[] }>(
        "checkout/kassa-v2/requests",
        { params: { trip: tripId, kind: "avans_qaytarish", status: "10,-10,20" }, enabled: !!tripId && !!hideToggle },
    )
    const returnRowsOf = (advanceId: number): FinanceRow[] =>
        (returnsData?.results ?? [])
            .filter((r) => r.target_cash_flow === advanceId)
            .map((r) => ({
                id: -r.id,
                return_id: r.id,
                return_status: r.status,
                action: 1,
                amount: Number(r.amount),
                category_name: t("trips.row.remainder_returned"),
                comment: r.comment,
                payment_type_name: t("trips.kirim.cash"),
                created: r.created,
            }) as unknown as FinanceRow)
    const returnRowAction = (row: FinanceRow, kind: "edit" | "delete") => {
        if (row.return_status === 20) return toast.info(t("trips.kirim.cashier_accepted_info"))
        if (kind === "edit") return toast.info(t("trips.kirim.cancel_and_resend"))
        postReturnAction(`checkout/kassa-v2/requests/${row.return_id}/cancel`, {}, {
            onSuccess: () => {
                toast.success(t("trips.kirim.return_cancelled"))
                refetchReturns()
            },
            onError: () => toast.error(t("trips.kirim.cancel_failed")),
        })
    }
    const startEdit = (row: FinanceRow) => {
        if (!canControlRow(row)) return toast.error(t("trips.kirim.no_section_permission"))
        if (row.return_id) return returnRowAction(row, "edit")
        if (row.action === ADVANCE_ACTION) {
            setAdvRow(row)
            openAdvEdit()
            return
        }
        setData(MANAGERS_EXPENSES, row)
        setEditRow(row)
        openRowEdit()
    }

    const handleDeleteIncome = (row: FinanceRow) => {
        setData(MANAGERS_INCOMES, row)
        openDeleteIncomeModal()
    }
    const handleDeleteExpense = (row: FinanceRow) => {
        setData(MANAGERS_EXPENSES, row)
        openDeleteExpenseModal()
    }

    // Trip statistic (aylanma mode)
    const { data: tripStat } = useGet(
        `${MANAGERS_CASHFLOW_TRIP_STAT}/${tripId}/statistic`,
        { enabled: mode === "aylanma" && !!tripId },
    )

    // Driver statistic (haydovchi mode)
    const { data: driverStat } = useGet(
        `${MANAGERS_CASHFLOW_DRIVER_STAT}/${tripId}/statistic`,
        { enabled: mode === "haydovchi" && !!tripId },
    )

    // Cashflow list for the two-column view
    const isDriver = mode === "haydovchi"
    const { data: incomeData } = useGet<ListResponse<FinanceRow>>(
        MANAGERS_CASHFLOW,
        {
            params: { trip: tripId, action: isDriver ? "1,2" : 1, page_size: 100000, ...(isDriver ? { driver: true } : {}) },
            enabled: !!tripId,
            options: { queryKey: [MANAGERS_CASHFLOW, "t-hisob-income", tripId, isDriver] },
        },
    )
    const { data: expenseData } = useGet<ListResponse<FinanceRow>>(
        MANAGERS_CASHFLOW,
        {
            params: { trip: tripId, action: -1, page_size: 100000, ...(isDriver ? { driver: true } : {}) },
            enabled: !!tripId,
            options: { queryKey: [MANAGERS_CASHFLOW, "t-hisob-expense", tripId, isDriver] },
        },
    )

    const incomeRows = incomeData?.results ?? []
    const { data: allExpenseData } = useGet<ListResponse<FinanceRow>>(
        MANAGERS_CASHFLOW,
        {
            params: { trip: tripId, action: -1, page_size: 100000 },
            enabled: !!tripId && !!hideToggle,
            options: { queryKey: [MANAGERS_CASHFLOW, "t-hisob-all-expense", tripId] },
        },
    )
    // UZS kartalar: summa serverdan so'mda keladi (uzsOf)
    const sumOf = (rows: FinanceRow[]) => rows.reduce((a, r) => a + uzsOf(r), 0)
    const avansSum = sumOf(incomeRows.filter((r) => r.action === ADVANCE_ACTION))
    const allExpenses = allExpenseData?.results ?? []
    const transferFuelSum = sumOf(allExpenses.filter((r) => r.category_code === "fuel" && /o.?tkaz/i.test(r.payment_type_name ?? "")))
    const salarySum = sumOf(allExpenses.filter((r) => r.category_code === "salary"))
    const isCashExpense = (r: FinanceRow) =>
        r.category_code !== "salary" && !(r.category_code === "fuel" && /o.?tkaz/i.test(r.payment_type_name ?? ""))
    const cashExpenseSum = sumOf(allExpenses.filter(isCashExpense))
    const { data: closePreview } = useGet<{
        due: number
        salary_orders?: { amount: number | null; tariff: number | null }[]
        empty_leg_salary?: { amount: number; legs: { id: number; route: string; start: string | null; amount: number }[] } | null
        extra_pay_salary?: { amount: number; orders: { order: number; route: string; date: string | null; comment: string | null; amount: number }[] } | null
        manual_salary?: { amount: number; rows: { id: number; date: string | null; comment: string | null; amount: number }[] } | null
    }>(
        `checkout/kassa-v2/trips/${tripId}/close-preview`,
        { enabled: !!tripId && !!hideToggle, options: { retry: false } },
    )
    const extraSalarySum = closePreview ?
        Number(closePreview.empty_leg_salary?.amount ?? 0) + Number(closePreview.extra_pay_salary?.amount ?? 0) + Number(closePreview.manual_salary?.amount ?? 0)
    :   0
    const extraSalaryRows = closePreview ?
        [
            ...(closePreview.extra_pay_salary?.orders ?? []).map((r) => ({ key: `o${r.order}`, route: r.route, date: r.date, comment: r.comment, amount: Number(r.amount) })),
            ...(closePreview.empty_leg_salary?.legs ?? []).map((r) => ({ key: `l${r.id}`, route: r.route, date: r.start, comment: null as string | null, amount: Number(r.amount) })),
            ...(closePreview.manual_salary?.rows ?? []).map((r) => ({ key: `m${r.id}`, route: t("trips.row.extra_salary"), date: r.date, comment: r.comment, amount: Number(r.amount) })),
        ]
    :   []
    const profit = closePreview ?
        Number(closePreview.due) - extraSalarySum -
            (closePreview.salary_orders ?
                closePreview.salary_orders.reduce((a, r) => a + Number(r.amount ?? r.tariff ?? 0), 0)
            :   salarySum)
    :   null
    const latestAdvanceId = [...incomeRows.filter((r) => r.action === ADVANCE_ACTION)]
        .sort((x, y) => String(y.created).localeCompare(String(x.created)))[0]?.id
    const expenseRows = expenseData?.results ?? []

    const incomeCols = useIncomeCols({ withCategory: true })
    const mixedCols = useMemo<ColumnDef<FinanceRow>[]>(
        () => [
            {
                header: t("form.amount_total"),
                accessorKey: "amount",
                cell: ({ row }) => {
                    const out = row.original.action === -1
                    return (
                        <span className={cn("font-medium whitespace-nowrap", out ? "text-red-500" : "text-green-600")}>
                            {out ? "− " : "+ "}{formatAmount(row.original)}
                        </span>
                    )
                },
            },
            {
                header: t("trips.kclose.what_for"),
                accessorKey: "category_name",
                cell: ({ row }) => row.original.category_name || (row.original.action === ADVANCE_ACTION ? (row.original.comment?.toLowerCase().includes("qo'shimcha") ? t("trips.kirim.extra_money") : t("trips.kclose.advance")) : "—"),
            },
            {
                header: t("trips.kclose.trip"),
                id: "route",
                cell: ({ row }) => row.original.order ? `${row.original.loading_name ?? ""} → ${row.original.unloading_name ?? ""}` : "—",
            },
            { header: t("form.comment"), accessorKey: "comment", cell: ({ row }) => <span className="text-muted-foreground">{row.original.comment || "—"}</span> },
            { header: t("form.payment_type"), accessorKey: "payment_type_name", cell: ({ row }) => row.original.payment_type_name || (row.original.category_code === "salary" ? t("trips.kirim.cash") : "—") },
            {
                header: t("trips.kirim.receipt"),
                id: "receipt",
                cell: ({ row }) => <ReceiptCell row={row.original} />,
            },
            {
                header: t("form.date"),
                accessorKey: "created",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        {formatDateTime(row.original.created)}
                        {row.original.return_id ?
                            <Badge variant={(row.original.return_status === 20 ? "default" : row.original.return_status === -10 ? "destructive" : "orange") as any} className="w-fit whitespace-nowrap">
                                {row.original.return_status === 20 ? t("trips.row.returned") : row.original.return_status === -10 ? t("trips.row.rejected") : t("trips.row.awaiting_cashier")}
                            </Badge>
                        :   <RowMarks row={row.original} />}
                        {isKassaV2 && !row.original.return_id && <MoveItemButton tripId={tripId} kind="cashflow" id={row.original.id} locked={!closePreview || locked} />}
                    </div>
                ),
            },
        ],
        [t, isKassaV2, tripId, closePreview],
    )
    const expenseCols = useExpenseCols({ withCategory: true })

    const moliyaTrip = useGlobalStore.getState().getData(`${MANAGERS_TRIPS}-moliya`) as any
    const fuelKind = String(moliyaTrip?.fuel_type ?? moliyaTrip?.vehicle_fuel ?? "").toLowerCase()
    const fuelUnit = fuelKind.includes("methane") || fuelKind.includes("metan") ? "m³" : t("trips.units.liter")
    const stat = mode === "aylanma" ? tripStat : driverStat
    const incomeUzs = Number(stat?.income_uzs ?? 0)
    const expenseUzs = Number(stat?.expense_uzs ?? 0)
    const balanceUzs = incomeUzs - expenseUzs

    return (
        <div className="flex flex-col h-full overflow-hidden gap-4">
            <div className="shrink-0 flex flex-col gap-3">
                {/* Mode switch */}
                {!hideToggle && <ModeToggle mode={mode} onToggle={onToggle} />}

                {/* Summary row */}
                <div className="flex items-center justify-between gap-3">
                    <div className={cn("flex items-stretch gap-3 overflow-x-auto no-scrollbar", hideToggle && "flex-1")}>
                        {hideToggle ?
                            <>
                                {access.avans.view && <SummaryCard label={t("trips.kclose.advance")} amountUzs={avansSum} variant="advance" active={filter === "avans"} onClick={() => setFilter("avans")} />}
                                {access.tushum.view && <SummaryCard label={t("trips.kclose.cash_trip_money")} amountUzs={incomeUzs - avansSum} variant="income" active={filter === "tushum"} onClick={() => setFilter("tushum")} />}
                                {access.xarajat.view && <SummaryCard label={t("trips.kirim.cash_expense")} amountUzs={cashExpenseSum} variant="expense" active={filter === "xarajat"} onClick={() => setFilter("xarajat")} />}
                                {access.oylik.view && <SummaryCard label={t("trips.kclose.salary")} amountUzs={salarySum + extraSalarySum} variant="expense" active={filter === "oylik"} onClick={() => setFilter("oylik")} />}
                                {profit != null && access.balance && <SummaryCard label={t("form.balance")} amountUzs={profit} variant={profit < 0 ? "expense" : "balance"} />}
                            </>
                        :   <SummaryCard label={t("page.all_income")} amountUzs={incomeUzs} variant="income" />}
                        {hideToggle ? null
                        :   <SummaryCard label={t("page.all_expense")} amountUzs={expenseUzs} variant="expense" />}
                        {hideToggle && <div className="ml-auto" />}
                        {hideToggle ?
                            access.zapravka.view && <SummaryCard label={t("trips.kirim.fuel_transfer")} amountUzs={transferFuelSum} variant="expense" active={filter === "zapravka"} onClick={() => setFilter("zapravka")} />
                        :   <SummaryCard label={mode === "haydovchi" ? t("form.balance") : t("table.profit")} amountUzs={balanceUzs} variant="balance" />}
                        {mode === "haydovchi" && driverStat && access.fuelTank && (
                            <>
                                <SummaryCard
                                    label={t("trips.kirim.fuel_in_tank")}
                                    amountUzs={Number(driverStat.return_fuel_amount_uzs ?? 0)}
                                    variant="balance"
                                    hideAmount
                                    sub={Number(driverStat.return_fuel ?? 0) > 0 ? <>{formatNumber(Number(driverStat.return_fuel))} {fuelUnit}</> : undefined}
                                />
                            </>
                        )}
                    </div>
                    {mode === "haydovchi" && !hideToggle && (
                        <Button
                            disabled={locked}
                            title={lockedTitle}
                            onClick={() => openAvansModal()}
                            variant="outline"
                            className="gap-1.5 shrink-0"
                        >
                            <Plus size={16} />
                            {t("actions.give_advance")}
                        </Button>
                    )}
                </div>
            </div>

            {hideToggle ? (() => {
                if (!access[filter].view) return null
                const control = access[filter].control
                const byDate = (rows: FinanceRow[]) => [...rows].sort((x, y) => String(y.created).localeCompare(String(x.created)))
                const isTransferFuel = (r: FinanceRow) => r.category_code === "fuel" && /o.?tkaz/i.test(r.payment_type_name ?? "")
                if (filter === "avans") {
                    const advances = byDate(incomeRows.filter((r) => r.action === ADVANCE_ACTION))
                    const spentOf = (a: FinanceRow) =>
                        a.advance_spent != null ? Number(a.advance_spent) : sumOf((allExpenses.length ? allExpenses : expenseRows).filter((e) => e.advance === a.id))
                    const returnedOf = (a: FinanceRow) => Number(a.advance_returned ?? 0)
                    const leftOf = (a: FinanceRow) =>
                        a.advance_left != null ? Number(a.advance_left) : Number(a.amount) - spentOf(a) - returnedOf(a)
                    const advanceCols: ColumnDef<FinanceRow>[] = [
                        { header: t("form.amount_total"), accessorKey: "amount", cell: ({ row }) => <span className="font-medium whitespace-nowrap text-red-500">− {formatAmount(row.original)}</span> },
                        { header: t("trips.kclose.what_for"), id: "kind", cell: ({ row }) => (row.original.comment?.toLowerCase().includes("qo'shimcha") ? t("trips.kirim.extra_money") : t("trips.kclose.advance")) },
                        { header: t("form.comment"), accessorKey: "comment", cell: ({ row }) => <span className="text-muted-foreground">{row.original.comment || "—"}</span> },
                        {
                            header: t("form.date"),
                            accessorKey: "created",
                            cell: ({ row }) => (
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    {formatDateTime(row.original.created)}
                                    <RowMarks row={row.original} />
                                </div>
                            ),
                        },
                    ]
                    const sel = advances.find((a) => a.id === selectedAdvance)
                    const deleteRow = (original: FinanceRow) => {
                        if (!canControlRow(original)) return toast.error(t("trips.kirim.no_section_permission"))
                        if (original.return_id) return returnRowAction(original, "delete")
                        if (original.action === ADVANCE_ACTION) {
                            setAdvRow(original)
                            openAdvDelete()
                            return
                        }
                        handleDeleteExpense(original)
                    }
                    if (sel) {
                        const linked = byDate([...(allExpenses.length ? allExpenses : expenseRows).filter((e) => e.advance === sel.id), ...returnRowsOf(sel.id)])
                        const left = leftOf(sel)
                        return (
                            <div className="flex-1 min-h-0 overflow-y-auto">
                                <DataTable
                                    columns={mixedCols}
                                    data={linked}
                                    rowColor={noReceiptRow}
                                    numeration
                                    viewAll
                                    actionsDisabled={locked}
                                    actionsDisabledTitle={lockedTitle}
                                    onEdit={({ original }) => startEdit(original)}
                                    onDelete={({ original }) => deleteRow(original)}
                                    head={
                                        <>
                                        <div className="flex flex-wrap mb-3 items-center gap-3">
                                            <Badge className="gap-1.5 cursor-pointer text-sm" onClick={() => setSelectedAdvance(null)}>
                                                {sel.comment?.toLowerCase().includes("qo'shimcha") ? t("trips.kirim.extra_money") : t("trips.kclose.advance")} · {formatDateTime(sel.created)} ✕
                                            </Badge>
                                            {control && (
                                                <div className="ml-auto flex items-center gap-2">
                                                    <Button size="sm" variant="outline" className="gap-1" disabled={locked} title={lockedTitle} onClick={() => openReturn()}>
                                                        {t("trips.kirim.return_remainder")}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <AdvanceReturnModal advanceId={sel.id} left={left} />
                                        </>
                                    }
                                />
                            </div>
                        )
                    }
                    return (
                        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4">
                            <DataTable
                                columns={advanceCols}
                                data={advances}
                                numeration
                                viewAll
                                actionsDisabled={locked}
                                actionsDisabledTitle={lockedTitle}
                                onEdit={control ? ({ original }) => startEdit(original) : undefined}
                                onDelete={control ? ({ original }) => deleteRow(original) : undefined}
                                head={
                                    <>
                                        <div className="flex mb-3 items-center gap-3">
                                            <h1 className="text-lg font-semibold">{t("trips.kirim.advances")}</h1>
                                            <Badge className="text-sm">{advances.length}</Badge>
                                            {control && (
                                                <div className="ml-auto">
                                                    <Button size="sm" className="gap-1" disabled={locked} title={lockedTitle} onClick={() => openAvansModal()}><Plus size={16} />{t("actions.give_advance")}</Button>
                                                </div>
                                            )}
                                        </div>
                                        <PendingAdvances tripId={tripId} />
                                    </>
                                }
                            />
                        </div>
                    )
                }
                const rows =
                    filter === "tushum" ? incomeRows.filter((r) => r.action === 1)
                    : filter === "zapravka" ? allExpenses.filter(isTransferFuel)
                    : filter === "xarajat" ? byDate(allExpenses.filter(isCashExpense))
                    : allExpenses.filter((r) => r.category_code === "salary")
                const title = { tushum: t("trips.kclose.cash_trip_money"), avans: t("trips.kirim.advance_and_expenses"), xarajat: t("trips.kirim.cash_expense"), zapravka: t("trips.kirim.fuel_transfer"), oylik: t("trips.kclose.salary") }[filter]
                const actions =
                    !control ? null
                    : filter === "tushum" ?
                        <Button size="sm" className="gap-1" disabled={locked} title={lockedTitle} onClick={() => startAdd("tushum")}><Plus size={16} />{t("page.add_income")}</Button>
                    : filter === "zapravka" ?
                        <Button size="sm" className="gap-1" disabled={locked} title={lockedTitle} onClick={() => startAdd("xarajat", { category: "fuel", method: 3 })}><Plus size={16} />{t("trips.kirim.fuel_up")}</Button>
                    : filter === "xarajat" ?
                        <Button size="sm" className="gap-1" disabled={locked} title={lockedTitle} onClick={() => startAdd("xarajat", { advance: latestAdvanceId })}><Plus size={16} />{t("page.add_expense")}</Button>
                    :   <Button size="sm" className="gap-1" disabled={locked} title={lockedTitle} onClick={() => openSalaryRequest()}><Plus size={16} />{t("trips.row.extra_salary")}</Button>
                return (
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        <DataTable
                            columns={mixedCols}
                            data={rows}
                            rowColor={noReceiptRow}
                            numeration
                            viewAll
                            actionsDisabled={locked}
                            actionsDisabledTitle={lockedTitle}
                            onEdit={control ? ({ original }) => startEdit(original) : undefined}
                            onDelete={!control ? undefined : ({ original }) => {
                                if (original.action === ADVANCE_ACTION) {
                                    setAdvRow(original)
                                    openAdvDelete()
                                    return
                                }
                                if (original.action === 1) handleDeleteIncome(original)
                                else handleDeleteExpense(original)
                            }}
                            head={
                                <>
                                    <div className="flex mb-3 items-center gap-3">
                                        <h1 className="text-lg font-semibold">{title}</h1>
                                        <Badge className="text-sm">{rows.length}</Badge>
                                        <div className="ml-auto flex items-center gap-2">{actions}</div>
                                    </div>
                                </>
                            }
                        />
                        {filter === "oylik" && extraSalaryRows.length > 0 && (
                            <div className="mt-4">
                                <div className="mb-2 flex items-center gap-3">
                                    <h2 className="text-base font-semibold">{t("trips.reys_cols.extra_pay_list")}</h2>
                                    <Badge className="text-sm">{extraSalaryRows.length}</Badge>
                                </div>
                                <div className="flex flex-col divide-y rounded-md border">
                                    {extraSalaryRows.map((r) => (
                                        <div key={r.key} className="flex items-center gap-3 px-3 py-2 text-sm">
                                            <span className="whitespace-nowrap font-medium text-red-500 tabular-nums">−{formatMoney(r.amount)}</span>
                                            <span className="flex-1">{r.route}</span>
                                            {r.comment && <span className="text-muted-foreground">{r.comment}</span>}
                                            <span className="whitespace-nowrap text-muted-foreground">{r.date ? String(r.date).slice(0, 10) : "—"}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )
            })() : (
            <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 overflow-hidden">
                <div className="overflow-y-auto min-h-0">
                    <DataTable
                        columns={incomeCols}
                        data={incomeRows}
                        numeration
                        viewAll
                        onDelete={({ original }) => {
                            if (original.action === ADVANCE_ACTION) {
                                setAdvRow(original)
                                openAdvDelete()
                                return
                            }
                            handleDeleteIncome(original)
                        }}
                        actionsDisabled={locked}
                        actionsDisabledTitle={lockedTitle}
                        onEdit={({ original }) => startEdit(original)}
                        head={
                            <>
                                <div className="flex mb-3 items-center gap-3">
                                    <h1 className="text-xl text-green-600">{t("form.income")}</h1>
                                    <Badge className="text-sm">{incomeRows.length}</Badge>
                                    <Button size="sm" className="ml-auto gap-1" disabled={locked} title={lockedTitle} onClick={() => startAdd("tushum")}>
                                        <Plus size={16} />
                                        {t("page.add_income")}
                                    </Button>
                                </div>
                                {isDriver && <PendingAdvances tripId={tripId} />}
                            </>
                        }
                    />
                </div>
                <div className="overflow-y-auto min-h-0">
                    <DataTable
                        columns={expenseCols}
                        data={expenseRows}
                        rowColor={noReceiptRow}
                        numeration
                        viewAll
                        onDelete={({ original }) => handleDeleteExpense(original)}
                        actionsDisabled={locked}
                        actionsDisabledTitle={lockedTitle}
                        onEdit={({ original }) => startEdit(original)}
                        head={
                            <div className="flex mb-3 items-center gap-3">
                                <h1 className="text-xl text-red-600">{t("form.expense")}</h1>
                                <Badge className="text-sm">{expenseRows.length}</Badge>
                                <Button size="sm" className="ml-auto gap-1" disabled={locked} title={lockedTitle} onClick={() => startAdd("xarajat")}>
                                    <Plus size={16} />
                                    {t("page.add_expense")}
                                </Button>
                            </div>
                        }
                    />
                </div>
            </div>
            )}

            <AdvanceChangeModals row={advRow} />
            <Modal modalKey="t-hisob-add" title={addType === "xarajat" ? (addPreset.category === "fuel" ? t("trips.kirim.fuel_up") : t("page.add_expense")) : t("page.add_income")} size="max-w-md">
                <AddFromTAccount type={addType} tripId={tripId} presetCategoryCode={addPreset.category} defaultPaymentMethod={addPreset.method} advanceId={addPreset.advance} />
            </Modal>
            <SalaryRequestModal tripId={tripId} driverId={moliyaTrip?.driver} />
            <Modal
                modalKey="t-hisob-edit"
                title={editRow?.action === -1 ? t("trips.kclose.edit_expense") : t("trips.kirim.edit_income")}
                size="max-w-md"
            >
                {editRow && (
                    <AddFinanceForm
                        modalKey="t-hisob-edit"
                        advanceId={editRow.advance ?? undefined}
                        type={editRow.action === -1 ? "xarajat" : "tushum"}
                        categoryName={editRow.category_name ?? ""}
                        isFuel={editRow.category_code === "fuel"}
                        tripId={tripId}
                        selectedCategoryId={editRow.category ?? null}
                        selectedCategoryCode={editRow.category_code ?? null}
                        action={editRow.action === -1 ? -1 : 1}
                    />
                )}
            </Modal>
            <Modal modalKey="avans-berish" title={isKassaV2 ? t("trips.kirim.give_advance_request") : t("actions.give_advance")} size="max-w-md">
                <AvansForm tripId={tripId} />
            </Modal>
            <DeleteModal
                path={MANAGERS_INCOMES}
                id={useGlobalStore.getState().getData(MANAGERS_INCOMES)?.id}
                modalKey={`${MANAGERS_INCOMES}-thisob-delete`}
                refetchKeys={[
                    MANAGERS_CASHFLOW,
                    MANAGERS_EXPENSE_CATEGORIES,
                    `${MANAGERS_CASHFLOW_TRIP_STAT}/${tripId}/statistic`,
                    `${MANAGERS_CASHFLOW_DRIVER_STAT}/${tripId}/statistic`,
                ]}
            />
            <DeleteModal
                path={MANAGERS_EXPENSES}
                id={useGlobalStore.getState().getData(MANAGERS_EXPENSES)?.id}
                modalKey={`${MANAGERS_EXPENSES}-thisob-delete`}
                refetchKeys={[
                    MANAGERS_CASHFLOW,
                    MANAGERS_EXPENSE_CATEGORIES,
                    `${MANAGERS_CASHFLOW_TRIP_STAT}/${tripId}/statistic`,
                    `${MANAGERS_CASHFLOW_DRIVER_STAT}/${tripId}/statistic`,
                ]}
            />
        </div>
    )
}
