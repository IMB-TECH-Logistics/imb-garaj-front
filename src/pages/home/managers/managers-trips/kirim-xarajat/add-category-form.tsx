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

export function AddCategoryForm({ flowType, modalKey = "add-category" }: { flowType: 1 | -1; modalKey?: string }) {
    const { t } = useTranslation()
    const { closeModal } = useModal(modalKey)
    const form = useForm<{ name: string }>()
    const { handleSubmit, control, reset } = form
    const { mutate, isPending } = usePost()
    const queryClient = useQueryClient()

    const onSubmit = (data: { name: string }) => {
        mutate(SETTINGS_EXPENSES, {
            name: data.name,
            type: 3, // TRIP
            flow_type: flowType,
        }, {
            onSuccess: () => {
                toast.success(t("toast.category_added"))
                queryClient.invalidateQueries({ queryKey: [MANAGERS_EXPENSE_CATEGORIES] })
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
