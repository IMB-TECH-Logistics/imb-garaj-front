import FormTextarea from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { handleFormError } from "@/lib/show-form-errors"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

type FormValues = {
    rejected_comment: string
}

type Props = {
    modalKey: string
    url: string | undefined
    rejectStatus: number
    refetchKeys: unknown[]
}

const DecisionRejectModal = ({ modalKey, url, rejectStatus, refetchKeys }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal, isOpen } = useModal(modalKey)

    const form = useForm<FormValues>({ defaultValues: { rejected_comment: "" } })
    const { handleSubmit, reset } = form

    useEffect(() => {
        if (!isOpen) reset({ rejected_comment: "" })
    }, [isOpen, reset])

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(t("toast.updated"))
            queryClient.refetchQueries({
                predicate: (q) => refetchKeys.includes(q.queryKey[0]),
            })
            closeModal()
        },
        meta: { skipGlobalError: true },
    })

    const onSubmit = (values: FormValues) => {
        if (!url) return
        mutate(
            url,
            { status: rejectStatus, rejected_comment: values.rejected_comment },
            { onError: (e: unknown) => handleFormError(e, form) },
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormTextarea
                required
                autoFocus
                label={t("kassa.reject_reason")}
                name="rejected_comment"
                methods={form}
                registerOptions={{
                    required: t("kassa.reject_comment_required"),
                }}
            />
            <div className="flex justify-end mt-1">
                <Button
                    className="min-w-32"
                    type="submit"
                    variant="destructive"
                    loading={isPending}
                >
                    {t("kassa.reject")}
                </Button>
            </div>
        </form>
    )
}

export default DecisionRejectModal
