import { FormDatePicker } from "@/components/form/date-picker"
import { FormCombobox } from "@/components/form/combobox"
import FileUpload from "@/components/form/file-upload"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { MANAGERS_TRIPS, MANAGERS_TRIPS_START_DATA, SETTINGS_DRIVERS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { IS_READY } from "@/store/ready-mode"
import { useQueryClient } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import { X } from "lucide-react"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

export default function CreateManagerTrips() {
    const { id } = useParams({ strict: false })
    const { closeModal } = useModal(MANAGERS_TRIPS)
    const queryClient = useQueryClient()
    const { getData } = useGlobalStore()
    const item = getData(MANAGERS_TRIPS)
    const isEdit = !!item?.id

    const form = useForm<any>({
        defaultValues: {
            ...item,
            vehicle: id,
            start: item?.start || new Date().toISOString().split("T")[0],
        },
    })

    const { handleSubmit, reset, control, watch, setValue } = form

    const { data: startData } = useGet(MANAGERS_TRIPS_START_DATA, {
        params: { vehicle_id: id },
        enabled: !isEdit && !!id,
        options: { staleTime: 0, gcTime: 0, refetchOnMount: "always" },
    })

    useEffect(() => {
        if (startData && !isEdit) {
            if (startData.end_mileage != null) {
                setValue("start_mileage", startData.end_mileage)
            }
            if (startData.end_fuel != null) {
                setValue("start_fuel", startData.end_fuel)
            }
            if (startData.end_mileage_image) {
                setValue("start_mileage_image", startData.end_mileage_image)
            }
        }
    }, [startData, isEdit, setValue])

    const { data: driversData } = useGet(SETTINGS_DRIVERS, {
        params: { page_size: 10000 },
    })
    const drivers = useMemo(() =>
        driversData?.results?.map((d: any) => ({
            ...d,
            full_name: `${d.first_name} ${d.last_name || ""}`.trim(),
        })) ?? [],
        [driversData],
    )

    const startImage = watch("start_mileage_image") as File | string | null
    const endImage = watch("end_mileage_image") as File | string | null

    const startMileage = watch("start_mileage")
    const endMileage = watch("end_mileage")
    const startFuel = watch("start_fuel")
    const startDate = watch("start")
    const endDate = watch("end")

    /**
     * YANGI-01 (2-raund): boshlash probegi oldingi reysning TUGASH probegidan
     * kichik bo'lmasin. Ilgari faqat `min: 0` bor edi — shuning uchun oxirgi
     * reys 187 305 da tugagan mashinaga 5 000 kiritib saqlash mumkin edi
     * (yorliqda oldingi qiymat ko'rinib turgani holda). Teskari yo'nalish
     * (tugash < boshlanish) allaqachon bloklangan edi, bu esa uning juftligi.
     * Tahrirlashda `startData` so'ralmaydi, shuning uchun faqat yangi reysga.
     */
    const previousEndMileage =
        !isEdit && startData?.end_mileage != null ?
            Number(startData.end_mileage)
        :   null

    const startMileageError =
        previousEndMileage != null &&
        startMileage !== "" &&
        startMileage != null &&
        Number(startMileage) < previousEndMileage ?
            `Boshlash probegi oldingi reysning tugash probegidan (${previousEndMileage}) kam bo'lishi mumkin emas`
        :   ""

    // MT-25 / qabul mezoni 5: mantiqsiz sana oralig'i (tugash < boshlanish).
    const dateRangeError =
        startDate && endDate && String(endDate) < String(startDate) ?
            "Tugatish sanasi boshlanish sanasidan oldin bo'lishi mumkin emas"
        :   ""

    const mileageDiffers = !isEdit && startData?.end_mileage != null && Number(startMileage) !== Number(startData.end_mileage)
    const fuelDiffers = !isEdit && startData?.end_fuel != null && Number(startFuel) !== Number(startData.end_fuel)

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
        // Qabul mezoni: tugash sanasi boshlanish sanasidan oldin bo'lolmaydi.
        // FormDatePicker `registerOptions` qabul qilmaydi, shuning uchun bu yerda
        // tekshiriladi va sabab aniq matn bilan aytiladi.
        if (dateRangeError) {
            toast.error(dateRangeError)
            return
        }
        if (startMileageError) {
            toast.error(startMileageError)
            return
        }

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
                    options={drivers}
                    labelKey="full_name"
                    valueKey="id"
                    label="Haydovchi"
                    // MT-31: standart `hideError = true` bo'lgani uchun majburiy
                    // maydon bo'sh qolganda faqat qizil ramka chiqardi, matn emas.
                    hideError={false}
                />

                {(!IS_READY || isEdit) && (
                    <FormDatePicker
                        control={control}
                        required
                        name="start"
                        label="Boshlash sanasi"
                        hideError={false}
                    />
                )}

                <FormNumberInput
                    name="start_mileage"
                    required
                    label={`Boshlash probegi${mileageDiffers ? ` (${startData.end_mileage})` : ""}`}
                    control={control}
                    // MT-25: probeg (odometr) manfiy bo'lolmaydi.
                    allowNegative={false}
                    registerOptions={{
                        min:
                            previousEndMileage != null ?
                                {
                                    value: previousEndMileage,
                                    message: `Boshlash probegi oldingi reysning tugash probegidan (${previousEndMileage}) kam bo'lishi mumkin emas`,
                                }
                            :   {
                                    value: 0,
                                    message: "Probeg manfiy bo'lishi mumkin emas",
                                },
                    }}
                />
                {startMileageError && (
                    <p className="text-[12px] text-red-600 -mt-2">
                        {startMileageError}
                    </p>
                )}

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
                    label={`Boshlanishdagi yoqilg'i (litr)${fuelDiffers ? ` (${startData.end_fuel})` : ""}`}
                    control={control}
                    decimalScale={2}
                    allowNegative={false}
                    registerOptions={{
                        min: {
                            value: 0,
                            message: "Yoqilg'i manfiy bo'lishi mumkin emas",
                        },
                    }}
                />
                {!item?.id && (
                    <FormNumberInput
                        name="advance"
                        label="Avans"
                        control={control}
                        thousandSeparator=" "
                        decimalScale={0}
                        placeholder="Ex: 5 000 000"
                        allowNegative={false}
                        registerOptions={{
                            min: {
                                value: 0,
                                message: "Avans manfiy bo'lishi mumkin emas",
                            },
                        }}
                    />
                )}
                {item?.id && (
                    <>
                        <FormDatePicker
                            control={control}
                            name="end"
                            label="Tugatish sanasi"
                        />
                        {dateRangeError && (
                            <p className="text-[12px] text-red-600 -mt-2">
                                {dateRangeError}
                            </p>
                        )}
                        <FormNumberInput
                            name="end_mileage"
                            required
                            label="Tugash probegi"
                            control={control}
                            // Qabul mezoni 5: tugash probegi boshlanishdan kichik bo'lolmaydi.
                            allowNegative={false}
                            registerOptions={{
                                min: {
                                    value: Number(startMileage) || 0,
                                    message: `Tugash probegi boshlanish probegidan (${
                                        Number(startMileage) || 0
                                    }) kam bo'lishi mumkin emas`,
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
