import Modal from "@/components/custom/modal"
import ParamTabs from "@/components/as-params/tabs"
import { useState } from "react"
import { useSearch } from "@tanstack/react-router"
import { useGlobalStore } from "@/store/global-store"
import { MANAGERS_TRIPS } from "@/constants/api-endpoints"
import { useUser } from "@/constants/useUser"
import { useTranslation } from "react-i18next"
import { AddFinanceForm } from "./kirim-xarajat/add-finance-form"
import { IncomeTab } from "./kirim-xarajat/income-tab"
import { ExpenseTab } from "./kirim-xarajat/expense-tab"
import { TAccountTab } from "./kirim-xarajat/t-account-tab"

// ──── Main export ────

export default function KirimXarajatContent() {
    const { t } = useTranslation()
    const { getData } = useGlobalStore()
    const search = useSearch({ strict: false }) as any
    const tripItem = getData(`${MANAGERS_TRIPS}-moliya`)
    const tripId = tripItem?.id ?? search.moliya_trip_id

    const initialTab = (search.moliya_tab as string) || "tushum"
    const [currentType, setCurrentType] = useState<"tushum" | "xarajat" | "t_hisob">(initialTab as any)
    const [tAccountMode, setTAccountMode] = useState<"aylanma" | "haydovchi">("aylanma")
    const [selectedCategoryName, setSelectedCategoryName] = useState<string>("")
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
    const [selectedCategoryCode, setSelectedCategoryCode] = useState<string | null>(null)

    const isFuel = currentType === "xarajat" && /yoqilg['ʻ']i|fuel|solyarka|metan|dizel|benzin/i.test(selectedCategoryName)
    const action: 1 | -1 = currentType === "xarajat" ? -1 : 1

    const handleCategoryChange = (name: string | null) => {
        setSelectedCategoryName(name ?? "")
    }

    const handleCategoryIdChange = (id: number | null) => {
        setSelectedCategoryId(id)
    }

    const handleCategoryCodeChange = (code: string | null) => {
        setSelectedCategoryCode(code)
    }

    const { data: me } = useUser()
    if (me?.kassa_mode === "driver_cash" && me?.kassa_version === 2) {
        return (
            <div className="flex flex-col h-full overflow-hidden gap-3">
                <div className="h-7 shrink-0" aria-hidden />
                <TAccountTab mode="haydovchi" onToggle={() => {}} tripId={tripId} hideToggle />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full overflow-hidden [&>div]:flex [&>div]:flex-col [&>div]:flex-1 [&>div]:min-h-0 [&>div>div[role=tabpanel]]:flex-1 [&>div>div[role=tabpanel]]:min-h-0">
            <ParamTabs
                paramName="moliya_tab"
                className="shrink-0"
                onValueChange={(val) => {
                    setCurrentType(val as "tushum" | "xarajat" | "t_hisob")
                    setSelectedCategoryName("")
                    setSelectedCategoryId(null)
                    setSelectedCategoryCode(null)
                }}
                options={[
                    {
                        value: "tushum",
                        label: t("page.income_list"),
                        content: <IncomeTab tripId={tripId} onCategoryChange={handleCategoryChange} onCategoryIdChange={handleCategoryIdChange} onCategoryCodeChange={handleCategoryCodeChange} />,
                    },
                    {
                        value: "xarajat",
                        label: t("page.expense_list"),
                        content: <ExpenseTab tripId={tripId} onCategoryChange={handleCategoryChange} onCategoryIdChange={handleCategoryIdChange} />,
                    },
                    {
                        value: "t_hisob",
                        label: t("trips.kirim.t_account"),
                        content: <TAccountTab mode={tAccountMode} onToggle={setTAccountMode} tripId={tripId} />,
                    },
                ]}
            />

            <Modal
                modalKey="kirim-xarajat-add"
                title={currentType === "tushum" ? t("page.add_income") : t("page.add_expense")}
                size="max-w-md"
            >
                <AddFinanceForm
                    type={currentType as "tushum" | "xarajat"}
                    categoryName={selectedCategoryName}
                    isFuel={isFuel}
                    tripId={tripId}
                    selectedCategoryId={selectedCategoryId}
                    selectedCategoryCode={selectedCategoryCode}
                    action={action as 1 | -1}
                />
            </Modal>
        </div>
    )
}
