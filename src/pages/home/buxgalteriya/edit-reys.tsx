import { FormNumberInput } from "@/components/form/number-input"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { MANAGERS_RUNS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { ReysOrder } from "./cols"

const EditReysModal = () => {
    const queryClient = useQueryClient()
    const { closeModal } = useModal("edit-reys")
    const { getData, clearKey } = useGlobalStore()
    const current = getData<ReysOrder>(MANAGERS_RUNS)

    const form = useForm({
        defaultValues: {
            client_name: current?.client_name ?? "",
            client_code: current?.client_code ?? "",
            loading_name: current?.loading_name ?? "",
            unloading_name: current?.unloading_name ?? "",
            vehicle_type: current?.vehicle_type ?? "",
            truck_number: current?.truck_number ?? "",
            cargo_type_name: current?.cargo_type_name ?? "",
            date: current?.date ?? "",
            summa_s_nds: current?.summa_s_nds ?? 0,
            pct: current?.pct ?? 0,
            naqd_amount: current?.naqd_amount ?? 0,
        },
    })

    const { handleSubmit, control } = form

    const onSuccess = () => {
        toast.success("Muvaffaqiyatli tahrirlandi!")
        clearKey(MANAGERS_RUNS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [MANAGERS_RUNS] })
    }

    const { mutate, isPending } = usePatch({ onSuccess })

    const onSubmit = (values: any) => {
        // TODO: backend API tayyor bo'lganda patch qilish
        toast.info("Backend API hali tayyor emas")
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <FormInput
                name="client_code"
                label="Firma kodi"
                methods={form}
                disabled
            />
            <FormInput
                name="client_name"
                label="Firma nomi"
                methods={form}
                disabled
            />
            <FormInput
                name="date"
                label="Sana"
                methods={form}
                disabled
            />
            <FormInput
                name="loading_name"
                label="Yuklash joyi"
                methods={form}
                disabled
            />
            <FormInput
                name="unloading_name"
                label="Tushirish joyi"
                methods={form}
                disabled
            />
            <FormInput
                name="cargo_type_name"
                label="Yuk turi"
                methods={form}
                disabled
            />
            <FormInput
                name="vehicle_type"
                label="Avto turi"
                methods={form}
                disabled
            />
            <FormInput
                name="truck_number"
                label="Davlat raqami"
                methods={form}
                disabled
            />
            <FormNumberInput
                name="summa_s_nds"
                label="Summa S NDS"
                control={control}
                thousandSeparator=" "
                placeholder="0"
            />
            <FormNumberInput
                name="pct"
                label="Foiz (%)"
                control={control}
                placeholder="0"
            />
            <FormNumberInput
                name="naqd_amount"
                label="Naqd"
                control={control}
                thousandSeparator=" "
                placeholder="0"
            />

            <div className="col-span-2 flex justify-end pt-2">
                <Button type="submit" loading={isPending} className="min-w-36">
                    Saqlash
                </Button>
            </div>
        </form>
    )
}

export default EditReysModal
