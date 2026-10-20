import { FormDatePicker } from "@/components/form/date-picker"
import { Button } from "@/components/ui/button"
import {
    VEHICLE_DOCUMENT_ALERTS,
    VEHICLE_DOCUMENTS_DOC_VEHICLE,
    VEHICLE_DOCUMENTS_TRUCKS,
    VEHICLES,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import compressImg from "@/lib/compress-img"
import { handleFormError } from "@/lib/show-form-errors"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import VehicleImagePicker from "../vehicles/vehicle-image-picker"
import { MAX_PHOTO_MB, VehicleDocumentsRow } from "./types"
import { TrailerSection, TruckSection } from "./vehicle-documents-sections"
import { FormValues, getDefaults, PhotoField, TRAILER_FIELDS, TRUCK_FIELDS } from "./vehicle-documents-form"
const toApiDate = (value?: string | Date | null) =>
    value ? format(new Date(value), "yyyy-MM-dd") : ""

const AddVehicleDocumentsModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("vehicle-docs")
    const { getData, clearKey } = useGlobalStore()
    const row = getData<VehicleDocumentsRow>(VEHICLE_DOCUMENTS_TRUCKS)
    const isFixed = !!row?.id

    const [loadedRow, setLoadedRow] = useState<VehicleDocumentsRow | undefined>(
        row,
    )
    const defaults = getDefaults(loadedRow)
    const form = useForm<FormValues>({ defaultValues: getDefaults(row) })
    const { handleSubmit, control, watch, formState } = form

    const { data: vehicles } = useGet<
        ListResponse<{
            id: number
            truck_number: string
            trailer_number: string | null
        }>
    >(VEHICLES, { params: { page_size: 10000 }, enabled: !isFixed })

    const vehicleId = watch("vehicle")
    const trailerNumber =
        isFixed ?
            row?.trailer_number
        :   vehicles?.results.find((v) => v.id === vehicleId)?.trailer_number
    const hasTrailer = !!trailerNumber
    const trailerOptions = (vehicles?.results ?? []).filter(
        (v) => !!v.trailer_number,
    )

    const selectedTruckNumber =
        isFixed ? undefined : (
            vehicles?.results.find((v) => v.id === vehicleId)?.truck_number
        )
    const { data: existing, isFetching: isLoadingExisting } = useGet<
        ListResponse<VehicleDocumentsRow>
    >(VEHICLE_DOCUMENTS_TRUCKS, {
        params: { search: selectedTruckNumber, page_size: 50 },
        enabled: !isFixed && !!selectedTruckNumber,
    })

    useEffect(() => {
        if (isFixed || !vehicleId || !existing) return
        const found = existing.results.find((r) => r.id === vehicleId)
        setLoadedRow(found)
        form.reset({ ...getDefaults(found), vehicle: vehicleId })
    }, [existing, vehicleId, isFixed, form])

    const { mutate, isPending } = usePost({
        onSuccess: () => {
            toast.success(
                isFixed ?
                    t("messages.success_edit")
                :   t("messages.success_add"),
            )
            clearKey(VEHICLE_DOCUMENTS_TRUCKS)
            closeModal()
            queryClient.refetchQueries({
                predicate: (q) =>
                    [VEHICLE_DOCUMENTS_TRUCKS, VEHICLE_DOCUMENT_ALERTS].includes(
                        q.queryKey[0] as string,
                    ),
            })
        },
        onError: (error) => handleFormError(error, form),
    })

    const onSubmit = async (values: FormValues) => {
        if (isPending) return
        if (!values.vehicle) return
        const formData = new FormData()
        formData.append(
            "truck_passport_expires_date",
            toApiDate(values.truck_passport_expires_date),
        )
        const trailerTouched =
            !!values.trailer_passport_expires_date ||
            TRAILER_FIELDS.some((field) => values[field] instanceof File)
        if (!hasTrailer && trailerTouched) {
            toast.error(t("documents_page.no_trailer"))
            return
        }
        if (hasTrailer) {
            formData.append(
                "trailer_passport_expires_date",
                toApiDate(values.trailer_passport_expires_date),
            )
        }
        formData.append("shared_photos", "false")

        const fields =
            hasTrailer ? [...TRUCK_FIELDS, ...TRAILER_FIELDS] : TRUCK_FIELDS

        for (const field of fields) {
            const value = values[field]
            if (value instanceof File) {
                if (value.size > MAX_PHOTO_MB * 1024 * 1024) {
                    toast.error(
                        t("documents_page.file_too_large", {
                            mb: MAX_PHOTO_MB,
                        }),
                    )
                    return
                }
                const compressed = await compressImg(value, {
                    maxSizeMB: 1.5,
                    maxWidthOrHeight: 2000,
                })
                if (!compressed) return
                formData.append(field, compressed)
            } else if (value === "" || (value === null && defaults[field])) {
                formData.append(field, "")
            }
        }

        mutate(`${VEHICLE_DOCUMENTS_DOC_VEHICLE}/${values.vehicle}`, formData)
    }

    const picker = (name: PhotoField, label: string) => (
        <VehicleImagePicker
            key={name}
            name={name}
            label={label}
            methods={form}
            clearable
            maxSizeMB={MAX_PHOTO_MB}
        />
    )

    const expiresField = (
        prefix: "truck_passport" | "trailer_passport",
        label: string,
    ) => (
        <FormDatePicker
            name={`${prefix}_expires_date`}
            label={label}
            control={control}
            placeholder={t("documents_page.pick_date")}
            fullWidth
        />
    )

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1"
        >
            <TruckSection
                isFixed={isFixed}
                row={row}
                vehicles={vehicles}
                control={control}
                expiresField={expiresField}
                picker={picker}
            />
            <TrailerSection
                isFixed={isFixed}
                row={row}
                trailerOptions={trailerOptions}
                control={control}
                vehicleId={vehicleId}
                hasTrailer={hasTrailer}
                expiresField={expiresField}
                picker={picker}
            />

            <div className="flex justify-end md:col-span-2">
                <Button
                    className="min-w-36 w-full md:w-max"
                    type="submit"
                    loading={isPending || isLoadingExisting || formState.isSubmitting}
                >
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default AddVehicleDocumentsModal
