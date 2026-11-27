import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useGet } from "@/hooks/useGet"
import { usePost } from "@/hooks/usePost"
import { handleFormError } from "@/lib/show-form-errors"
import { useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { SEPARATE_CITIES, VILOYAT_TARIFFS } from "./cols"

type City = {
    district_id: number
    name: string
    viloyat: number
    viloyat_name: string
    orders_count: number
    separate: boolean
}

type CitiesResponse = { results: City[]; recent_days: number }

const CitiesModal = ({ canEdit }: { canEdit: boolean }) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [query, setQuery] = useState("")
    const [busyId, setBusyId] = useState<number | null>(null)
    const { data, isLoading } = useGet<CitiesResponse>(SEPARATE_CITIES)
    const { mutate } = usePost({
        onSuccess: () => {
            toast.success(t("messages.success_edit"))
            queryClient.invalidateQueries({ queryKey: [SEPARATE_CITIES] })
            queryClient.invalidateQueries({ queryKey: [VILOYAT_TARIFFS] })
        },
        onError: (e: unknown) => handleFormError(e),
        onSettled: () => setBusyId(null),
    })

    const groups = useMemo(() => {
        const q = query.trim().toLowerCase()
        const map = new Map<string, City[]>()
        for (const c of data?.results ?? []) {
            if (q && !`${c.name} ${c.viloyat_name}`.toLowerCase().includes(q)) continue
            const list = map.get(c.viloyat_name) ?? []
            list.push(c)
            map.set(c.viloyat_name, list)
        }
        return [...map.entries()]
    }, [data, query])

    return (
        <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
                {t("page.vt_cities_hint", { days: data?.recent_days ?? 90 })}
            </p>
            <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("page.vt_cities_search")}
            />
            <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-4 pr-1">
                {isLoading && <p className="text-sm text-muted-foreground">…</p>}
                {!isLoading && groups.length === 0 && (
                    <p className="text-sm text-muted-foreground">{t("page.vt_cities_empty")}</p>
                )}
                {groups.map(([viloyat, cities]) => (
                    <div key={viloyat}>
                        <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                            {viloyat}
                        </div>
                        <div className="flex flex-col divide-y rounded-md border">
                            {cities.map((c) => (
                                <label
                                    key={c.district_id}
                                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="font-medium">{c.name}</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {t("page.vt_cities_orders", { count: c.orders_count })}
                                        </Badge>
                                    </span>
                                    <Switch
                                        checked={c.separate}
                                        disabled={!canEdit || busyId === c.district_id}
                                        onCheckedChange={(checked) => {
                                            setBusyId(c.district_id)
                                            mutate(SEPARATE_CITIES, {
                                                district_id: c.district_id,
                                                separate: checked,
                                            })
                                        }}
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default CitiesModal
