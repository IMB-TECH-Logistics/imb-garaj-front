import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useDocumentAlerts } from "@/hooks/use-document-alerts"
import { formatDate } from "@/lib/format-date"
import { useNavigate } from "@tanstack/react-router"
import { ArrowRight, FileWarning } from "lucide-react"
import { useState } from "react"

const daysText = (days: number | null) => {
    if (days === null) return ""
    if (days < 0) return `${-days} kun oldin tugagan`
    if (days === 0) return "Bugun tugaydi"
    return `${days} kun qoldi`
}

export function DocumentNotification() {
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const { data, isLoading, canSee, count } = useDocumentAlerts()

    if (!canSee) return null

    const documents = data?.results ?? []

    const goToDocuments = (truckNumber?: string) => {
        setOpen(false)
        navigate({
            to: "/documents",
            search: (truckNumber ?
                { documents_search: truckNumber }
            :   { doc_alert: "1" }) as any,
        })
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="relative size-9 shrink-0"
                    title="Hujjatlar muddati"
                >
                    <FileWarning size={18} className={count > 0 ? "text-red-500" : ""} />
                    {count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                            {count > 99 ? "99+" : count}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
                <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold">Hujjatlar muddati</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {data?.expired ?? 0} ta muddati o'tgan, {data?.expiring ?? 0} ta 5 kun ichida tugaydi
                    </p>
                </div>
                <div className="divide-y divide-border max-h-72 overflow-y-auto">
                    {isLoading ?
                        <p className="text-sm text-muted-foreground text-center py-6">
                            Yuklanmoqda...
                        </p>
                    : documents.length === 0 ?
                        <p className="text-sm text-muted-foreground text-center py-6">
                            Muddati tugayotgan hujjat yo'q
                        </p>
                    :   documents.map((doc) => (
                            <button
                                key={doc.id}
                                type="button"
                                className="w-full text-left px-4 py-3 flex items-start justify-between gap-2 hover:bg-muted/50"
                                onClick={() => goToDocuments(doc.truck_number)}
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {doc.truck_number} · {doc.doc_type_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {doc.driver_name || "-"}
                                    </p>
                                    <p
                                        className={`text-xs mt-1 font-semibold ${doc.status === "expired" ? "text-red-600" : "text-amber-600"}`}
                                    >
                                        {doc.expires_date && formatDate(doc.expires_date)} · {daysText(doc.days_left)}
                                    </p>
                                </div>
                                <ArrowRight size={14} className="mt-0.5 text-muted-foreground shrink-0" />
                            </button>
                        ))
                    }
                </div>
                {documents.length > 0 && (
                    <button
                        type="button"
                        className="w-full border-t border-border px-4 py-2 text-xs font-medium text-primary hover:bg-muted/50"
                        onClick={() => goToDocuments()}
                    >
                        Barchasini ko'rish
                    </button>
                )}
            </PopoverContent>
        </Popover>
    )
}
