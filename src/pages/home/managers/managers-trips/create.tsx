import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import FileUpload from "@/components/form/file-upload"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { MANAGERS_TRIPS, SETTINGS_DRIVERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import { X } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

export default function CreateManagerTrips() {
    const { id } = useParams({ strict: false })
    const { closeModal } = useModal(MANAGERS_TRIPS)
    const queryClient = useQueryClient()
    const { getData } = useGlobalStore()
    const item = getData(MANAGERS_TRIPS)

    const form = useForm<any>({
        defaultValues: {
            ...item,
            vehicle: id,
            start: item?.start || new Date().toISOString().split("T")[0],
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

    const { mutate: createTrip, isPending: isCreating } = usePost(
        { onSuccess },
    )
    const { mutate: editTrip, isPending: isEditing } = usePatch(
        { onSuccess },
    )

    function onSubmit(values: any) {
        const formData = new FormData()
        formData.append("start", values.start)
        formData.append("driver", String(values.driver))
        formData.append("vehicle", String(values.vehicle))

        if (values.start_mileage != null) {
            formData.append("start_mileage", String(values.start_mileage))
        }
        if (values.start_fuel != null) {
            formData.append("start_fuel", String(values.start_fuel))
        }
        if (values.advance != null) {
            formData.append("advance", String(values.advance))
        }
        if (values.end_mileage != null) {
            formData.append("end_mileage", String(values.end_mileage))
        }
        if (values.end_fuel != null) {
            formData.append("end_fuel", String(values.end_fuel))
        }
        if (values.end != null) {
            formData.append("end", values.end)
        }

        if (values.start_mileage_image instanceof File) {
            formData.append("start_mileage_image", values.start_mileage_image)
        }
        if (values.end_mileage_image instanceof File) {
            formData.append("end_mileage_image", values.end_mileage_image)
        }

        if (values?.id) {
            editTrip(`${MANAGERS_TRIPS}/${values.id}`, formData)
        } else {
            createTrip(MANAGERS_TRIPS, formData)
        }
    }

    const isPending = isCreating || isEditing

    return (
        <div className="max-h-[80vh] overflow-y-auto pr-2 pl-2 no-scrollbar-x">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <FormCombobox
                    control={control}
                    required
                    name="driver"
                    options={drivers?.results}
                    labelKey="first_name"
                    valueKey="id"
                    label="Haydovchi"
                />

                <FormNumberInput
                    name="start_mileage"
                    required
                    label="Ketish probegi"
                    control={control}
                />

                {startImage ?
                    <div className="relative w-24 h-24">
                        <img
                            src={
                                startImage instanceof File ?
                                    URL.createObjectURL(startImage)
                                :   startImage
                            }
                            className="w-24 h-24 object-cover rounded-md"
                        />
                        <button
                            type="button"
                            onClick={() => removeImage("start_mileage_image")}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        >
                            <X width={12} />
                        </button>
                    </div>
                : startMileage ?
                    <FileUpload
                        control={control}
                        name="start_mileage_image"
                        multiple={false}
                        isPaste={false}
                        hideClearable={true}
                    />
                :   null}

                <FormNumberInput
                    name="start_fuel"
                    label="Boshlanishdagi yoqilg'i (litr)"
                    control={control}
                    decimalScale={2}
                />
                {!item?.id && (
                    <FormNumberInput
                        name="advance"
                        label="Avans"
                        control={control}
                        thousandSeparator=" "
                        decimalScale={0}
                        placeholder="Ex: 5 000 000"
                    />
                )}
                {item?.id && (
                    <>
                        <FormNumberInput
                            name="end_mileage"
                            required
                            label="Kelish probegi"
                            control={control}
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
                                    onClick={() =>
                                        removeImage("end_mileage_image")
                                    }
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

                    </>
                )}

                <div className="flex justify-end">
                    <Button loading={isPending}>Saqlash</Button>
                </div>
            </form>
        </div>
    )
}
