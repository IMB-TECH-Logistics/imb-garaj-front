import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ALERTS, ALERTS_COUNTS } from "@/constants/api-endpoints"
import { usePost } from "@/hooks/usePost"
import { handleFormError } from "@/lib/show-form-errors"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import type { AlertItem } from "./types"

type FormValues = { comment: string }

type Props = {
    alert: AlertItem | null
    onClose: () => void
}

export function ResolveAlertDialog({ alert, onClose }: Props) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const form = useForm<FormValues>({ defaultValues: { comment: "" } })

    useEffect(() => {
        if (alert) form.reset({ comment: "" })
    }, [alert, form])

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("alerts.resolved_toast"))
            queryClient.invalidateQueries({ queryKey: [ALERTS] })
            queryClient.invalidateQueries({ queryKey: [ALERTS_COUNTS] })
            onClose()
        },
        onError: (error: unknown) => handleFormError(error, form),
    })

    const onSubmit = ({ comment }: FormValues) => {
        if (!alert) return
        mutate(`${ALERTS}/${alert.id}/resolve`, { comment: comment.trim() })
    }

    return (
        <Dialog open={!!alert} onOpenChange={(open) => !open && onClose()}>
            {alert && (
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t("alerts.resolve_title")}</DialogTitle>
                        <DialogDescription>
                            {alert.vehicle.truck_number} - {alert.title}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                        <FormTextarea
                            required
                            name="comment"
                            label={t("alerts.comment")}
                            placeholder={t("alerts.comment_placeholder")}
                            methods={form}
                            registerOptions={{
                                validate: (value) => !!value.trim() || t("validation.required_field", { field: t("alerts.comment") }),
                            }}
                        />
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={onClose}>
                                {t("actions.cancel")}
                            </Button>
                            <Button type="submit" loading={isPending}>
                                {t("alerts.resolve")}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            )}
        </Dialog>
    )
}
