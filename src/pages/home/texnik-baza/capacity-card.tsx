import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { TECH_BASE } from "@/constants/api-endpoints"
import { usePatch } from "@/hooks/usePatch"
import { handleFormError } from "@/lib/show-form-errors"
import { useQueryClient } from "@tanstack/react-query"
import { Pencil } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { fmtTons } from "./utils"

type Props = {
    id: number
    capacity: number | null
    canControl: boolean
}

const CapacityCard = ({ id, capacity, canControl }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("")

    const { mutate, isPending } = usePatch({
        onSuccess: () => {
            toast.success(t("tb.capacity_saved"))
            queryClient.invalidateQueries({
                predicate: (q) => String(q.queryKey[0]).startsWith(TECH_BASE),
            })
            setOpen(false)
        },
        onError: (e: unknown) => handleFormError(e),
    })

    const openDialog = () => {
        setValue(capacity === null ? "" : String(capacity))
        setOpen(true)
    }

    const save = () => {
        const trimmed = value.trim().replace(",", ".")
        mutate(`${TECH_BASE}/${id}`, {
            capacity_tons: trimmed === "" ? null : trimmed,
        })
    }

    return (
        <section className="rounded-lg border p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">⚖️ {t("tb.capacity")}</h2>
                {canControl && (
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={<Pencil size={14} />}
                        onClick={openDialog}
                    >
                        {t("tb.edit_capacity")}
                    </Button>
                )}
            </div>
            <p className="text-2xl font-semibold tabular-nums">
                {capacity === null ?
                    <span className="text-base font-normal text-muted-foreground">
                        {t("tb.capacity_empty")}
                    </span>
                :   `${fmtTons(capacity)} t`}
            </p>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{t("tb.capacity")}</DialogTitle>
                    </DialogHeader>
                    <label className="flex flex-col gap-1.5 text-sm">
                        {t("tb.capacity_tons")}
                        <Input
                            inputMode="decimal"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="24"
                            autoFocus
                        />
                    </label>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            {t("actions.cancel")}
                        </Button>
                        <Button onClick={save} loading={isPending}>
                            {t("actions.save")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}

export default CapacityCard
