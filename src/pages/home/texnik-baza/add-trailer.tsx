import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import Select from "@/components/ui/select"
import {
    SETTINGS_SELECTABLE_VEHICLE_TYPE,
    TECH_BASE,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { usePost } from "@/hooks/usePost"
import { handleFormError } from "@/lib/show-form-errors"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const AddTrailer = ({ open, onOpenChange }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [plate, setPlate] = useState("")
    const [typeId, setTypeId] = useState("")
    const [front, setFront] = useState<File | null>(null)
    const [back, setBack] = useState<File | null>(null)

    const { data: types } = useGet<{ id: number; name: string }[]>(
        SETTINGS_SELECTABLE_VEHICLE_TYPE,
        { params: { type: "trailer" }, enabled: open },
    )

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("tb.trailer_created"))
            queryClient.invalidateQueries({ queryKey: [TECH_BASE] })
            setPlate("")
            setTypeId("")
            setFront(null)
            setBack(null)
            onOpenChange(false)
        },
        onError: (e: unknown) => handleFormError(e),
    })

    const submit = () => {
        const payload = new FormData()
        payload.append("plate", plate.trim())
        if (typeId) payload.append("type_id", typeId)
        if (front) payload.append("trailer_front", front)
        if (back) payload.append("trailer_back", back)
        mutate(`${TECH_BASE}/trailers`, payload)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("tb.add_trailer")}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                    <label className="flex flex-col gap-1.5 text-sm">
                        {t("tb.plate")}
                        <Input
                            value={plate}
                            onChange={(e) => setPlate(e.target.value)}
                            autoFocus
                        />
                    </label>
                    <div className="flex flex-col gap-1.5 text-sm">
                        {t("tb.type")}
                        <Select
                            value={typeId}
                            setValue={setTypeId}
                            options={types ?? []}
                            valueKey="id"
                            labelKey="name"
                            label={t("tb.type")}
                        />
                    </div>
                    <label className="flex flex-col gap-1.5 text-sm">
                        {t("tb.photo_front")}
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setFront(e.target.files?.[0] ?? null)
                            }
                        />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm">
                        {t("tb.photo_back")}
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setBack(e.target.files?.[0] ?? null)
                            }
                        />
                    </label>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {t("actions.cancel")}
                    </Button>
                    <Button
                        onClick={submit}
                        loading={isPending}
                        disabled={!plate.trim()}
                    >
                        {t("actions.save")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default AddTrailer
