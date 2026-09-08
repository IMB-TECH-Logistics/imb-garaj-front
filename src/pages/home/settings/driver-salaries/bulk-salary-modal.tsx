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
        if (Number(amount) < 0) {
            toast.error("Oylik manfiy bo'lishi mumkin emas")
            return
        }
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
            {/*
              * The server accepts a negative salary without complaint (UI audit
              * OP-21 / S1-17 — see backend-kerak/F3.md), so the minus sign is
              * blocked at the keyboard and the pasted value is validated.
              */}
            <FormNumberInput
                required
                allowNegative={false}
                thousandSeparator=" "
                name="amount"
                label="Beriladigan oylik"
                placeholder="12 206 000"
                control={control}
                registerOptions={{
                    required: "Summani kiriting",
                    validate: (value: unknown) => {
                        const num = Number(value)
                        if (value === null || value === "" || Number.isNaN(num))
                            return "Summani kiriting"
                        if (num < 0)
                            return "Oylik manfiy bo'lishi mumkin emas"
                        return true
                    },
                }}
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
