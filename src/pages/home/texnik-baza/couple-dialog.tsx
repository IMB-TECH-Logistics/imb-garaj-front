import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/datepicker"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import Select from "@/components/ui/select"
import { TECH_BASE } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { usePost } from "@/hooks/usePost"
import { handleFormError } from "@/lib/show-form-errors"
import { todayIso } from "@/lib/today-iso"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import type { Passport, TechRow } from "./types"

export type CoupleMode = "couple" | "uncouple"

type Props = {
    passport: Passport
    mode: CoupleMode | null
    onClose: () => void
}

const CoupleDialog = ({ passport, mode, onClose }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [partnerId, setPartnerId] = useState("")
    const [date, setDate] = useState(todayIso())
    const isTruck = passport.kind === "truck"
    const coupled = passport.coupled

    const { data: partners } = useGet<ListResponse<TechRow>>(TECH_BASE, {
        params: { kind: isTruck ? "trailer" : "truck", page_size: 1000 },
        enabled: mode === "couple",
    })

    const close = () => {
        setPartnerId("")
        onClose()
    }

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(
                mode === "uncouple" ? t("tb.uncoupled_ok") : t("tb.coupled_ok"),
            )
            queryClient.invalidateQueries({
                predicate: (q) => String(q.queryKey[0]).startsWith(TECH_BASE),
            })
            close()
        },
        onError: (e: unknown) => handleFormError(e),
    })

    const submit = () => {
        if (mode === "uncouple" && coupled) {
            const truckId = isTruck ? passport.id : coupled.id
            mutate(`${TECH_BASE}/${truckId}/uncouple`, { date })
            return
        }
        const truckId = isTruck ? passport.id : Number(partnerId)
        const trailerId = isTruck ? Number(partnerId) : passport.id
        mutate(`${TECH_BASE}/${truckId}/couple`, { trailer_id: trailerId, date })
    }

    return (
        <Dialog open={mode !== null} onOpenChange={(next) => !next && close()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "uncouple" ?
                            t("tb.uncouple_title")
                        :   t("tb.couple_title")}
                    </DialogTitle>
                    {mode === "uncouple" && coupled && (
                        <DialogDescription>
                            {t("tb.uncouple_confirm", { plate: coupled.plate })}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <div className="flex flex-col gap-3">
                    {mode === "couple" && (
                        <Select
                            value={partnerId}
                            setValue={setPartnerId}
                            options={(partners?.results ?? [])
                                .filter((p) => p.id !== passport.id)
                                .map((p) => ({ id: p.id, name: p.plate }))}
                            valueKey="id"
                            labelKey="name"
                            label={
                                isTruck ?
                                    t("tb.choose_trailer")
                                :   t("tb.choose_truck")
                            }
                        />
                    )}
                    <DatePicker
                        fullWidth
                        date={date}
                        setDate={setDate}
                        placeholder={t("tb.date")}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={close}>
                        {t("actions.cancel")}
                    </Button>
                    <Button
                        variant={mode === "uncouple" ? "destructive" : "default"}
                        loading={isPending}
                        disabled={mode === "couple" && !partnerId}
                        onClick={submit}
                    >
                        {mode === "uncouple" ? t("tb.uncouple") : t("tb.couple")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default CoupleDialog
