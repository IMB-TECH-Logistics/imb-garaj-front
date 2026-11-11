import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { usePatch } from "@/hooks/usePatch"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { MessageSquare, MessageSquareText } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export const NoteButton = ({
    value,
    url,
    payload,
    refetchPrefix,
    canEdit,
    title,
}: {
    value?: string | null
    url: string
    payload: (text: string) => Record<string, unknown>
    refetchPrefix: string
    canEdit: boolean
    title?: string
}) => {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const saved = value ?? ""
    const [open, setOpen] = useState(false)
    const [text, setText] = useState(saved)
    useEffect(() => {
        if (open) setText(saved)
    }, [open, saved])
    const { mutate, isPending } = usePatch({
        onSuccess: () => {
            toast.success(t("messages.success_edit"))
            qc.invalidateQueries({
                predicate: (q) => String(q.queryKey[0]).startsWith(refetchPrefix),
            })
            setOpen(false)
        },
    })
    if (!canEdit && !saved) return <span className="text-muted-foreground">—</span>
    const Icon = saved ? MessageSquareText : MessageSquare
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    title={saved || t("note.add")}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                        "rounded p-1 hover:bg-muted",
                        saved ? "text-primary" : "text-muted-foreground/60",
                    )}
                >
                    <Icon className="w-4 h-4" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="w-80 p-3 flex flex-col gap-2"
                onClick={(e) => e.stopPropagation()}
            >
                <span className="text-sm font-medium">{title || t("note.title")}</span>
                {canEdit ?
                    <>
                        <Textarea
                            autoFocus
                            rows={4}
                            maxLength={2000}
                            value={text}
                            placeholder={t("note.placeholder")}
                            onChange={(e) => setText(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                {t("actions.cancel")}
                            </Button>
                            <Button
                                size="sm"
                                loading={isPending}
                                disabled={text.trim() === saved.trim()}
                                onClick={() => mutate(url, payload(text.trim()))}
                            >
                                {t("actions.save")}
                            </Button>
                        </div>
                    </>
                :   <p className="text-sm whitespace-pre-wrap">{saved}</p>}
            </PopoverContent>
        </Popover>
    )
}
