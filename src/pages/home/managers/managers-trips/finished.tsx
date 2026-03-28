import { FormDatePicker } from "@/components/form/date-picker"
import FileUpload from "@/components/form/file-upload"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { MANAGERS_TRIPS, SETTINGS_DRIVERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import { X } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

export default function FinishManagerTrips() {
    const { id } = useParams({ strict: false })
    const { closeModal } = useModal(`${MANAGERS_TRIPS}-finished`)
    const queryClient = useQueryClient()
    const { getData } = useGlobalStore()
    const item = getData("finished")

    const form = useForm<ManagerTrips>({
        defaultValues: {
            ...item,
            vehicle: id,
            end: new Date().toISOString().split("T")[0],
        },
    })

    const { handleSubmit, reset, control, watch, setValue } = form

    const { data: drivers } = useGet(SETTINGS_DRIVERS, {
        params: { page_size: 10000 },
    })

    const startImage = watch("start_mileage_image") as File | string | null
    const endImage = watch("end_mileage_image") as File | string | null

    const startMileage = watch("start_mileage")
    const endMileage = watch("end_mileage")

    function removeImage(name: "start_mileage_image" | "end_mileage_image") {
        setValue(name, null)
    }

    function onSuccess() {
        queryClient.invalidateQueries({ queryKey: [MANAGERS_TRIPS] })
        toast.success(
            item?.id ?
                "Muvaffaqiyatli tahrirlandi!"
            :   "Muvaffaqiyatli qo'shildi!",
        )
        closeModal()
        reset()
    }

    const headers = { "Content-Type": "multipart/form-data" }

    const { mutate: editTrip, isPending: isEditing } = usePatch(
        { onSuccess },
        { headers },
    )

    function onSubmit(values: ManagerTrips) {
        const formData = new FormData()
        formData.append("end_mileage", String(values.end_mileage))
        formData.append("end", values.end)
        formData.append("end_fuel", String(values.end_fuel))
        if (values.end_mileage_image instanceof File) {
            formData.append("end_mileage_image", values.end_mileage_image)
        }

        editTrip(`${MANAGERS_TRIPS}/${values.id}`, formData)
    }

    return (
        <div className="max-h-[80vh] overflow-y-auto pr-2 pl-2 no-scrollbar-x">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <FormNumberInput
                    name="end_mileage"
                    required
                    label="Kelish probegi"
                    control={control}
                    registerOptions={{
                        min: {
                            value: item?.start_mileage || 0,
                            message: `Kelish probegi ${item?.start_mileage || 0} dan kam bo'lmasligi kerak`,
                        },
                    }}
                />

                {endImage ?
                    <div className="relative w-24 h-24">
                        <img
                            src={
                                endImage instanceof File ?
                                    URL.createObjectURL(endImage)
                                :   endImage
                            }
                            className="w-24 h-24 object-cover rounded-md"
                        />
                        <button
                            type="button"
                            onClick={() => removeImage("end_mileage_image")}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        >
                            <X width={12} />
                        </button>
                    </div>
                : endMileage ?
                    <FileUpload
                        control={control}
                        name="end_mileage_image"
                        multiple={false}
                        isPaste={false}
                        hideClearable={true}
                    />
                :   null}

                <FormNumberInput
                    name="end_fuel"
                    label="Yoqilg'i"
                    required
                    control={control}
                />

                <div className="flex justify-end">
                    <Button loading={isEditing}>Saqlash</Button>
                </div>
            </form>
        </div>
    )
}
