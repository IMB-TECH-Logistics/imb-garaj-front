import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import {
    VEHICLE_DOCUMENT_ALERTS,
    VEHICLE_DOCUMENTS,
    VEHICLE_DOCUMENTS_TRUCKS,
    VEHICLES,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ALERT_DAYS, DOC_TYPE_OPTIONS, VehicleDocumentType } from "./types"

type FormValues = Partial<VehicleDocumentType>

const toApiDate = (value?: string | Date | null) =>
    value ? format(new Date(value), "yyyy-MM-dd") : null

const AddDocumentModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { openModal: openDeleteModal } = useModal("delete")
    const { getData, clearKey } = useGlobalStore()
    const current = getData<FormValues>(VEHICLE_DOCUMENTS)
    const isPrefilled = !!current?.vehicle && !!current?.doc_type

    const { data: vehicles } = useGet<
        ListResponse<{ id: number; truck_number: string }>
    >(VEHICLES, { params: { page_size: 10000 }, enabled: !isPrefilled })

    const form = useForm<FormValues>({
        defaultValues: current || { doc_type: "truck_passport" },
    })
    const { handleSubmit, reset, control } = form

    const onSuccess = () => {
        toast.success(
            current?.id ?
                t("messages.success_edit")
            :   t("messages.success_add"),
        )
        reset()
        clearKey(VEHICLE_DOCUMENTS)
        closeModal()
        queryClient.refetchQueries({
            predicate: (q) =>
                [VEHICLE_DOCUMENTS_TRUCKS, VEHICLE_DOCUMENT_ALERTS].includes(
                    q.queryKey[0] as string,
                ),
        })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
    })
    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
    })
    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = (values: FormValues) => {
        const payload = {
            vehicle: values.vehicle,
            doc_type: values.doc_type,
            number: values.number ?? "",
            issued_date: toApiDate(values.issued_date),
            expires_date: toApiDate(values.expires_date),
        }
        if (current?.id) {
            updateMutate(`${VEHICLE_DOCUMENTS}/${current.id}`, payload)
        } else {
            postMutate(VEHICLE_DOCUMENTS, payload)
        }
    }

    const handleDelete = () => {
        closeModal()
        openDeleteModal()
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1"
        >
            {!isPrefilled && (
                <>
                    <FormCombobox
                        required
                        name="vehicle"
                        label={t("form.vehicle_number")}
                        options={vehicles?.results ?? []}
                        control={control}
                        labelKey="truck_number"
                        valueKey="id"
                    />
                    <FormCombobox
                        required
                        name="doc_type"
                        label="Hujjat nomi"
                        options={DOC_TYPE_OPTIONS}
                        control={control}
                        labelKey="label"
                        valueKey="value"
                    />
                </>
            )}
            <FormInput
                name="number"
                label="Hujjat raqami"
                methods={form}
                wrapperClassName="md:col-span-2"
            />
            <FormDatePicker
                name="issued_date"
                label="Berilgan sana"
                control={control}
                fullWidth
            />
            <div>
                <FormDatePicker
                    name="expires_date"
                    label="Amal qilish muddati"
                    control={control}
                    fullWidth
                />
                <p className="text-xs text-muted-foreground mt-1">
                    Bo'sh qoldirilsa, berilgan sanadan 5 yil hisoblanadi
                </p>
            </div>
            {!!current?.id && current.days_left !== null && current.days_left !== undefined && current.days_left <= ALERT_DAYS && (
                <p className="md:col-span-2 text-sm font-medium text-red-600">
                    {current.days_left < 0 ?
                        `Muddati ${-current.days_left} kun oldin tugagan`
                    :   `Muddati tugashiga ${current.days_left} kun qoldi`}
                </p>
            )}
            <div className="flex items-center justify-between gap-2 md:col-span-2">
                {current?.id ?
                    <Button
                        type="button"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        icon={<Trash2 size={16} />}
                        onClick={handleDelete}
                    >
                        {t("actions.delete")}
                    </Button>
                :   <span />}
                <Button
                    className="min-w-36 w-full md:w-max"
                    type="submit"
                    loading={isPending}
                >
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default AddDocumentModal
