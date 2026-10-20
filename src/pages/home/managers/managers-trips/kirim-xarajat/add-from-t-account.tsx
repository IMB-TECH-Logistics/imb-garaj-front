import { useEffect, useState } from "react"
import { Combobox } from "@/components/ui/combobox"
import { useGet } from "@/hooks/useGet"
import { MANAGERS_EXPENSE_CATEGORIES } from "@/constants/api-endpoints"
import { useTranslation } from "react-i18next"
import { Category } from "./types"
import { AddFinanceForm } from "./add-finance-form"

// ──── Returnable breakdown ────

// ──── Add from T hisob ────

export function AddFromTAccount({ type, tripId, presetCategoryCode, defaultPaymentMethod, advanceId }: { type: "tushum" | "xarajat"; tripId?: number; presetCategoryCode?: string; defaultPaymentMethod?: number; advanceId?: number }) {
    const { t } = useTranslation()
    const action: 1 | -1 = type === "xarajat" ? -1 : 1
    const { data: categoriesData } = useGet<ListResponse<Category>>(
        MANAGERS_EXPENSE_CATEGORIES,
        {
            params: { page_size: 100000, action, trip_id: tripId },
            enabled: !!tripId,
            options: { queryKey: [MANAGERS_EXPENSE_CATEGORIES, "t-hisob-add", action, tripId] },
        },
    )
    const categories = (categoriesData?.results ?? []).filter((c) => c.code !== "salary")
    const [catId, setCatId] = useState<number | null>(null)
    useEffect(() => {
        if (categories.length && !categories.some((c) => c.id === catId)) {
            const preset = presetCategoryCode ? categories.find((c) => c.code === presetCategoryCode) : undefined
            setCatId((preset ?? categories[0]).id ?? null)
        }
    }, [categoriesData, presetCategoryCode])
    const cat = categories.find((c) => c.id === catId)
    const isFuel = type === "xarajat" && (cat?.code === "fuel" || /yoqilg['ʻ']i|fuel|solyarka|metan|dizel|benzin/i.test(cat?.name ?? ""))

    return (
        <div className="flex flex-col gap-3">
            {!(presetCategoryCode && cat?.code === presetCategoryCode) && (
            <div className="flex flex-col gap-1.5 text-sm font-medium">
                {type === "xarajat" ? t("form.expense_type") : t("trips.kirim.income_type")}
                <Combobox
                    label={type === "xarajat" ? t("form.expense_type") : t("trips.kirim.income_type")}
                    options={categories}
                    value={catId}
                    setValue={(v: any) => v != null && v !== "" && setCatId(Number(v))}
                    labelKey="name"
                    valueKey="id"
                    isClearIcon={false}
                    isSearch={false}
                />
            </div>
            )}
            {cat && (
                <AddFinanceForm
                    key={`${type}-${cat.id}`}
                    modalKey="t-hisob-add"
                    type={type}
                    categoryName={cat.name}
                    isFuel={isFuel}
                    tripId={tripId}
                    selectedCategoryId={cat.id ?? null}
                    selectedCategoryCode={cat.code ?? null}
                    action={action}
                    defaultPaymentMethod={defaultPaymentMethod}
                    advanceId={advanceId}
                />
            )}
        </div>
    )
}
