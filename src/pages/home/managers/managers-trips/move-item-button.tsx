import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MANAGERS_TRIPS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { usePost } from "@/hooks/usePost"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { ArrowLeftRight } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

type MoveTarget = { id: number; start: string | null; end: string | null; status: string }

export type MoveKind = "order" | "cashflow" | "request"

const day = (iso: string | null) => (iso ? format(parseISO(iso.slice(0, 10)), "dd.MM.yyyy") : "")

const errorText = (e: any, fallback: string) => {
    const d = e?.response?.data
    if (!d) return fallback
    if (typeof d === "string") return d.slice(0, 200)
    if (d.detail) return String(d.detail)
    const first = Object.values(d)[0]
    return Array.isArray(first) ? String(first[0]) : typeof first === "string" ? first : fallback
}

export default function MoveItemButton({ tripId, kind, id, locked }: { tripId?: number | null; kind: MoveKind; id: number; locked?: boolean }) {
    const { t } = useTranslation()
    const hasControl = useHasAction("manager_vehicles_control")
    const qc = useQueryClient()
    const [open, setOpen] = useState(false)
    const [target, setTarget] = useState<number | null>(null)
    const enabled = !!hasControl && !!tripId && !locked
    const { data: targets } = useGet<MoveTarget[]>(`checkout/kassa-v2/trips/${tripId}/move-targets`, { enabled, options: { staleTime: 30000 } })
    const { mutate, isPending } = usePost({ meta: { skipGlobalError: true } })
    if (!enabled || !targets?.length) return null

    const submit = () => {
        if (!target) return
        mutate(`checkout/kassa-v2/trips/${tripId}/move-item`, { kind, id, target }, {
            onSuccess: () => {
                toast.success(t("trips.move.done", { src: tripId, target }))
                qc.invalidateQueries({
                    predicate: (q) => {
                        const k = String(q.queryKey[0])
                        return k.includes("cashflow") || k.startsWith("checkout/kassa-v2") || k.startsWith(MANAGERS_TRIPS)
                    },
                })
                setOpen(false)
                setTarget(null)
            },
            onError: (e: unknown) => toast.error(errorText(e, t("trips.row.error"))),
        })
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button type="button" title={t("trips.move.action")} className="text-muted-foreground hover:text-primary" onClick={(e) => e.stopPropagation()}>
                    <ArrowLeftRight size={15} />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                <div className="text-sm font-medium">{t("trips.move.action")}</div>
                <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
                    {targets.map((x) => (
                        <button
                            key={x.id}
                            type="button"
                            onClick={() => setTarget(x.id)}
                            className={cn("rounded-md border px-2 py-1.5 text-left text-sm", target === x.id && "border-primary bg-primary/5")}
                        >
                            #{x.id} {day(x.start)} – {x.end ? day(x.end) : t("fin.kv2.ongoing")}
                        </button>
                    ))}
                </div>
                <Button size="sm" disabled={!target} loading={isPending} onClick={submit}>{t("trips.move.confirm")}</Button>
            </PopoverContent>
        </Popover>
    )
}
