import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTechCheckAlerts } from "@/hooks/use-tech-check-alerts"
import { formatDate } from "@/lib/format-date"
import { lifespanHint } from "@/pages/home/texnik-check/cols"
import { useNavigate } from "@tanstack/react-router"
import { ArrowRight, Wrench } from "lucide-react"
import { useState } from "react"

export function TechCheckNotification() {
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const { data, isLoading, canSee, count } = useTechCheckAlerts()

    if (!canSee) return null

    const inspections = data?.results ?? []

    const goToTechCheck = (truckNumber?: string) => {
        setOpen(false)
        navigate({
            to: "/technic-check",
            search: (truckNumber ?
                { ti_alert: "1", vehicle_search: truckNumber }
            :   { ti_alert: "1" }) as any,
        })
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="default"
                    size="icon"
                    className="relative size-9 shrink-0"
                    title="Texnik ko'rik muddati"
                >
                    <Wrench size={18} className={count > 0 ? "text-red-500" : ""} />
                    {count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                            {count > 99 ? "99+" : count}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
                <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold">Texnik ko'rik muddati</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {data?.expired ?? 0} ta muddati o'tgan, {data?.expiring ?? 0} ta 7 kun ichida tugaydi
                    </p>
                </div>
                <div className="divide-y divide-border max-h-72 overflow-y-auto">
                    {isLoading ?
                        <p className="text-sm text-muted-foreground text-center py-6">
                            Yuklanmoqda...
                        </p>
                    : inspections.length === 0 ?
                        <p className="text-sm text-muted-foreground text-center py-6">
                            Muddati tugayotgan texnik ko'rik yo'q
                        </p>
                    :   inspections.map((ti) => (
                            <button
                                key={ti.id}
                                type="button"
                                className="w-full text-left px-4 py-3 flex items-start justify-between gap-2 hover:bg-muted/50"
                                onClick={() => goToTechCheck(ti.vehicle_name)}
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {ti.vehicle_name} · {ti.category_name}
                                    </p>
                                    <p
                                        className={`text-xs mt-1 font-semibold ${ti.status === "expired" ? "text-red-600" : "text-amber-600"}`}
                                    >
                                        {ti.lifespan && formatDate(ti.lifespan)} · {lifespanHint(ti.days_left)}
                                    </p>
                                </div>
                                <ArrowRight size={14} className="mt-0.5 text-muted-foreground shrink-0" />
                            </button>
                        ))
                    }
                </div>
                {inspections.length > 0 && (
                    <button
                        type="button"
                        className="w-full border-t border-border px-4 py-2 text-xs font-medium text-primary hover:bg-muted/50"
                        onClick={() => goToTechCheck()}
                    >
                        Barchasini ko'rish
                    </button>
                )}
            </PopoverContent>
        </Popover>
    )
}
