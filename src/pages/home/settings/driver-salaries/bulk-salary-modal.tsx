import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { COMMON_DIRECTIONS, DRIVER_SALARIES } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

type FormValues = { amount: string | null }

interface Props {
    selectedIds: number[]
    onApplied: () => void
}

const todayIso = () => new Date().toISOString().slice(0, 10)

const BulkSalaryModal = ({ selectedIds, onApplied }: Props) => {
    const queryClient = useQueryClient()
    const { closeModal } = useModal("bulk-salary")
    const form = useForm<FormValues>({ defaultValues: { amount: null } })
    const { handleSubmit, control, reset } = form

    const { mutateAsync, isPending } = usePatch()

    const onSubmit = async ({ amount }: FormValues) => {
        if (!amount || selectedIds.length === 0) return
        try {
            await mutateAsync(`${DRIVER_SALARIES}/bulk-update`, {
                directions: selectedIds,
                amount,
                valid_from: todayIso(),
            })
            toast.success(
                `${selectedIds.length} ta yo'nalishga oylik tayinlandi`,
            )
            await queryClient.invalidateQueries({
                queryKey: [COMMON_DIRECTIONS],
            })
            reset()
            closeModal()
            onApplied()
        } catch {
            /* handleFormError already toasts the failure */
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
                Tanlangan {selectedIds.length} ta yo'nalishga bir xil oylik
                tayinlanadi.
            </p>
            <FormNumberInput
                required
                thousandSeparator=" "
                name="amount"
                label="Beriladigan oylik"
                placeholder="12 206 000"
                control={control}
            />
            <div className="flex items-center justify-end mt-2">
                <Button className="min-w-36" type="submit" loading={isPending}>
                    Saqlash
                </Button>
            </div>
        </form>
    )
}

export default BulkSalaryModal
