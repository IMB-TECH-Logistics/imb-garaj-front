import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SETTINGS_PETROL_STATIONS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import axiosInstance from "@/services/axios-instance"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { FileSpreadsheet } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useKontragents } from "@/pages/home/kontragent/api"
import { type IncomeType, useIncomeTypeOptions } from "./income-modal"

export const BANK_IMPORT_MODAL = "bank-import"
const PREVIEW_URL = "checkout/bank/import/preview/"
const CONFIRM_URL = "checkout/bank/import/confirm/"

type Action = "station_top_up" | "bank_fee" | "expense" | "income" | "skip"

type PreviewLine = {
    key: string
    operated_at: string
    doc_no: string
    counterparty_name: string
    counterparty_inn: string
    debit: string | number
    credit: string | number
    purpose: string
    action: Action
    label: string
    petrol_station?: number | null
    new_station_name?: string | null
    fuel_type?: string
    income_type?: IncomeType
    kontragent?: number | null
    new_kontragent_name?: string | null
    new_kontragent_type?: string
    duplicate: boolean
}

type Preview = { own_inn: string; lines: PreviewLine[]; totals: { debit: number; credit: number } }

type Choice = {
    action: Action
    label: string
    petrol_station: number | null
    new_station_name: string | null
    fuel_type?: string
    income_type?: IncomeType
    kontragent?: number | null
    new_kontragent_name?: string | null
    new_kontragent_type?: string
}

type StationOption = { id: number; name: string; fuel_type?: string }

const NEW_STATION = "new"

const errorText = (e: any) => e?.response?.data?.detail || e?.response?.data?.message || e?.message || "Error"

const BankImportModal = ({ refetchKeys }: { refetchKeys: string[] }) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal, isOpen } = useModal(BANK_IMPORT_MODAL)
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<Preview | null>(null)
    const [choices, setChoices] = useState<Record<string, Choice>>({})
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    const { data: stations } = useGet<ListResponse<StationOption>>(SETTINGS_PETROL_STATIONS, {
        params: { is_cash: false, page_size: 1000 },
        enabled: isOpen,
    })
    const stationOptions = stations?.results ?? []
    const { data: kontragents } = useKontragents(undefined, isOpen)
    const incomeTypeOptions = useIncomeTypeOptions()

    useEffect(() => {
        if (!isOpen) {
            setFile(null)
            setPreview(null)
            setChoices({})
        }
    }, [isOpen])

    const actionOptions = useMemo(
        () => [
            { value: "station_top_up", label: t("bank_page.import.action_top_up") },
            { value: "bank_fee", label: t("bank_page.import.action_fee") },
            { value: "expense", label: t("bank_page.import.action_expense") },
            { value: "income", label: t("bank_page.import.action_income") },
            { value: "skip", label: t("bank_page.import.action_skip") },
        ],
        [t],
    )

    const loadPreview = async (picked: File) => {
        setFile(picked)
        setLoading(true)
        try {
            const form = new FormData()
            form.append("file", picked)
            const { data } = await axiosInstance.post<Preview>(PREVIEW_URL, form)
            setPreview(data)
            const next: Record<string, Choice> = {}
            data.lines.forEach((line) => {
                next[line.key] = {
                    action: line.action,
                    label: line.label,
                    petrol_station: line.petrol_station ?? null,
                    new_station_name: line.new_station_name ?? null,
                    fuel_type: line.fuel_type,
                    income_type: line.income_type,
                    kontragent: line.kontragent ?? null,
                    new_kontragent_name: line.new_kontragent_name ?? null,
                    new_kontragent_type: line.new_kontragent_type,
                }
            })
            setChoices(next)
        } catch (e) {
            setPreview(null)
            toast.error(errorText(e))
        } finally {
            setLoading(false)
        }
    }

    const setChoice = (key: string, patch: Partial<Choice>) =>
        setChoices((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))

    const lines = preview?.lines ?? []
    const fresh = lines.filter((l) => !l.duplicate)
    const toSave = fresh.filter((l) => choices[l.key]?.action !== "skip")

    const submit = async () => {
        if (!file) return
        setSaving(true)
        try {
            const form = new FormData()
            form.append("file", file)
            form.append(
                "choices",
                JSON.stringify(toSave.map((l) => ({ key: l.key, ...choices[l.key] }))),
            )
            const { data } = await axiosInstance.post(CONFIRM_URL, form)
            const total = Object.values(data.created as Record<string, number>).reduce((a, b) => a + b, 0)
            toast.success(t("bank_page.import.saved", { count: total }))
            refetchKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
            queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).includes("petrol-stations") })
            closeModal()
        } catch (e) {
            toast.error(errorText(e))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <label
                className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 text-center",
                    "hover:border-primary hover:bg-primary/5",
                    file ? "border-solid border-primary/60" : "border-muted-foreground/30",
                )}
            >
                <input
                    type="file"
                    accept=".xlsx"
                    className="sr-only"
                    onChange={(e) => {
                        const picked = e.target.files?.[0]
                        e.target.value = ""
                        if (picked) loadPreview(picked)
                    }}
                />
                <FileSpreadsheet className={cn("h-8 w-8", file ? "text-primary" : "text-muted-foreground")} />
                <span className="font-medium">{file ? file.name : t("bank_page.import.pick_file")}</span>
                <span className="text-xs text-muted-foreground">{t("bank_page.import.hint")}</span>
            </label>

            {loading && <div className="text-sm text-muted-foreground">{t("bank_page.import.reading")}</div>}

            {preview && (
                <>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <span>{t("bank_page.import.rows", { count: lines.length })}</span>
                        <span className="text-emerald-600">{t("bank_page.income")}: {formatMoney(Number(preview.totals.credit))}</span>
                        <span className="text-rose-600">{t("bank_page.expense")}: {formatMoney(Number(preview.totals.debit))}</span>
                        {lines.length !== fresh.length && (
                            <span className="text-muted-foreground">
                                {t("bank_page.import.duplicates", { count: lines.length - fresh.length })}
                            </span>
                        )}
                    </div>
                    <div className="max-h-[55vh] overflow-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                                <tr className="text-left">
                                    <th className="px-2 py-2">{t("bank_page.date")}</th>
                                    <th className="px-2 py-2">{t("bank_page.import.counterparty")}</th>
                                    <th className="px-2 py-2 text-right">{t("bank_page.amount")}</th>
                                    <th className="px-2 py-2">{t("bank_page.import.action")}</th>
                                    <th className="px-2 py-2">{t("bank_page.import.target")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lines.map((line) => {
                                    const choice = choices[line.key]
                                    const isIn = Number(line.credit) > 0
                                    const amount = isIn ? line.credit : line.debit
                                    return (
                                        <tr key={line.key} className={cn("border-t align-top", line.duplicate && "opacity-50")}>
                                            <td className="px-2 py-2 whitespace-nowrap">
                                                {format(new Date(line.operated_at), "dd.MM.yyyy HH:mm")}
                                            </td>
                                            <td className="px-2 py-2 min-w-[220px]">
                                                <div className="font-medium">{line.counterparty_name}</div>
                                                <div className="text-xs text-muted-foreground line-clamp-2" title={line.purpose}>
                                                    {line.purpose}
                                                </div>
                                            </td>
                                            <td
                                                className={cn(
                                                    "px-2 py-2 text-right tabular-nums whitespace-nowrap font-medium",
                                                    isIn ? "text-emerald-600" : "text-rose-600",
                                                )}
                                            >
                                                {isIn ? "+" : "−"}
                                                {formatMoney(Number(amount))}
                                            </td>
                                            <td className="px-2 py-2">
                                                {line.duplicate ?
                                                    <Badge variant="outline">{t("bank_page.import.already")}</Badge>
                                                :   <select
                                                        className="h-8 rounded-md border bg-background px-2"
                                                        value={choice?.action}
                                                        onChange={(e) => setChoice(line.key, { action: e.target.value as Action })}
                                                    >
                                                        {actionOptions
                                                            .filter((o) =>
                                                                isIn ?
                                                                    o.value === "income" || o.value === "skip"
                                                                :   o.value !== "income",
                                                            )
                                                            .map((o) => (
                                                                <option key={o.value} value={o.value}>
                                                                    {o.label}
                                                                </option>
                                                            ))}
                                                    </select>
                                                }
                                            </td>
                                            <td className="px-2 py-2 min-w-[220px]">
                                                {!line.duplicate && choice?.action === "station_top_up" ?
                                                    <div className="flex flex-col gap-1">
                                                        <select
                                                            className="h-8 rounded-md border bg-background px-2"
                                                            value={choice.petrol_station ? String(choice.petrol_station) : NEW_STATION}
                                                            onChange={(e) =>
                                                                e.target.value === NEW_STATION ?
                                                                    setChoice(line.key, {
                                                                        petrol_station: null,
                                                                        new_station_name: choice.new_station_name || line.counterparty_name,
                                                                    })
                                                                :   setChoice(line.key, { petrol_station: Number(e.target.value), new_station_name: null })
                                                            }
                                                        >
                                                            <option value={NEW_STATION}>{t("bank_page.import.new_station")}</option>
                                                            {stationOptions.map((s) => (
                                                                <option key={s.id} value={s.id}>
                                                                    {s.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {!choice.petrol_station && (
                                                            <input
                                                                className="h-8 rounded-md border bg-background px-2"
                                                                value={choice.new_station_name ?? ""}
                                                                onChange={(e) => setChoice(line.key, { new_station_name: e.target.value })}
                                                            />
                                                        )}
                                                    </div>
                                                : !line.duplicate && choice?.action === "income" ?
                                                    <div className="flex flex-col gap-1">
                                                        <select
                                                            className="h-8 rounded-md border bg-background px-2"
                                                            value={choice.income_type ?? "bank_boshqa"}
                                                            onChange={(e) =>
                                                                setChoice(line.key, {
                                                                    income_type: e.target.value as IncomeType,
                                                                    new_kontragent_name:
                                                                        choice.new_kontragent_name || line.counterparty_name,
                                                                })
                                                            }
                                                        >
                                                            {incomeTypeOptions.map((o) => (
                                                                <option key={o.id} value={o.id}>
                                                                    {o.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {choice.income_type === "bank_kontragent" && (
                                                            <select
                                                                className="h-8 rounded-md border bg-background px-2"
                                                                value={choice.kontragent ? String(choice.kontragent) : NEW_STATION}
                                                                onChange={(e) =>
                                                                    setChoice(line.key, {
                                                                        kontragent:
                                                                            e.target.value === NEW_STATION ? null : Number(e.target.value),
                                                                    })
                                                                }
                                                            >
                                                                <option value={NEW_STATION}>{t("bank_page.import.new_kontragent")}</option>
                                                                {(kontragents ?? []).map((k) => (
                                                                    <option key={k.id} value={k.id}>
                                                                        {k.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )}
                                                        {choice.income_type === "bank_kontragent" && !choice.kontragent && (
                                                            <input
                                                                className="h-8 rounded-md border bg-background px-2"
                                                                value={choice.new_kontragent_name ?? ""}
                                                                onChange={(e) => setChoice(line.key, { new_kontragent_name: e.target.value })}
                                                            />
                                                        )}
                                                        {choice.income_type === "bank_boshqa" && (
                                                            <input
                                                                className="h-8 w-full rounded-md border bg-background px-2"
                                                                value={choice.label}
                                                                onChange={(e) => setChoice(line.key, { label: e.target.value })}
                                                            />
                                                        )}
                                                    </div>
                                                : !line.duplicate && choice && choice.action !== "skip" ?
                                                    <input
                                                        className="h-8 w-full rounded-md border bg-background px-2"
                                                        value={choice.label}
                                                        onChange={(e) => setChoice(line.key, { label: e.target.value })}
                                                    />
                                                :   null}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" onClick={closeModal}>
                            {t("actions.cancel")}
                        </Button>
                        <Button onClick={submit} loading={saving} disabled={!toSave.length}>
                            {t("bank_page.import.save", { count: toSave.length })}
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}

export default BankImportModal
