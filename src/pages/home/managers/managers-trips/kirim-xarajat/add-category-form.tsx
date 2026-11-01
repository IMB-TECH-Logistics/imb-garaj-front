import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { useModal } from "@/hooks/useModal"
import { toast } from "sonner"
import { usePost } from "@/hooks/usePost"
import { MANAGERS_EXPENSE_CATEGORIES, SETTINGS_EXPENSES } from "@/constants/api-endpoints"
import { useQueryClient } from "@tanstack/react-query"
import FormInput from "@/components/form/input"
import { useTranslation } from "react-i18next"

// ──── Add category form ────

export function AddCategoryForm({ flowType, modalKey = "add-category", type = 3, queryKey = MANAGERS_EXPENSE_CATEGORIES, onCreated }: { flowType: 1 | -1; modalKey?: string; type?: number; queryKey?: string; onCreated?: (id: number) => void }) {
    const { t } = useTranslation()
    const { closeModal } = useModal(modalKey)
    const form = useForm<{ name: string }>()
    const { handleSubmit, control, reset } = form
    const { mutate, isPending } = usePost()
    const queryClient = useQueryClient()

    const onSubmit = (data: { name: string }) => {
        mutate(SETTINGS_EXPENSES, {
            name: data.name,
            type,
            flow_type: flowType,
        }, {
            onSuccess: (res?: { id?: number }) => {
                toast.success(t("toast.category_added"))
                queryClient.invalidateQueries({ queryKey: [queryKey] })
                if (res?.id) onCreated?.(res.id)
                reset()
                closeModal()
            },
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormInput
                required
                methods={form}
                label={t("form.name")}
                name="name"
                placeholder={t("form.category_label")}
            />
            <Button className="w-full" type="submit" disabled={isPending}>
                {t("actions.save")}
            </Button>
        </form>
    )
}
