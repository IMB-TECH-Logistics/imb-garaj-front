import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import {
    VEHICLE_DOCUMENT_ALERTS,
    VEHICLE_DOCUMENTS,
    VEHICLE_DOCUMENTS_DRIVERS,
    VEHICLE_DOCUMENTS_TRUCKS,
    VEHICLES,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import compressImg from "@/lib/compress-img"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useSearch } from "@tanstack/react-router"
import { format } from "date-fns"
import { Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import VehicleImagePicker from "../vehicles/vehicle-image-picker"
import {
    ALERT_DAYS,
    DOC_TYPE_OPTIONS,
    DocTab,
    MAX_PHOTO_MB,
    TAB_DOC_TYPES,
    VehicleDocumentType,
} from "./types"

type FormValues = Partial<
    Omit<VehicleDocumentType, "photo_front" | "photo_back">
> & {
    photo_front?: File | string | null
    photo_back?: File | string | null
}

const PHOTO_FIELDS = ["photo_front", "photo_back"] as const

const toApiDate = (value?: string | Date | null) =>
    value ? format(new Date(value), "yyyy-MM-dd") : ""

const AddDocumentModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const search = useSearch({ strict: false }) as Record<string, unknown>
    const tab: DocTab = search.tab === "vehicles" ? "vehicles" : "drivers"
    const { closeModal } = useModal("create")
    const { openModal: openDeleteModal } = useModal("delete")
    const { getData, clearKey } = useGlobalStore()
    const current = getData<VehicleDocumentType>(VEHICLE_DOCUMENTS)
    const isPrefilled =
        !!(current?.vehicle || current?.driver) && !!current?.doc_type

    const form = useForm<FormValues>({
        defaultValues:
            current?.doc_type ? current : { doc_type: TAB_DOC_TYPES[tab][0] },
    })
    const { handleSubmit, reset, control, watch } = form
    const docType = watch("doc_type")
    const isDriverDoc = docType === "driver_license"

    const { data: vehicles } = useGet<
        ListResponse<{ id: number; truck_number: string }>
    >(VEHICLES, {
        params: { page_size: 10000 },
        enabled: !isPrefilled && !isDriverDoc,
    })
    const { data: drivers } = useGet<
        ListResponse<{ id: number; full_name: string }>
    >(VEHICLE_DOCUMENTS_DRIVERS, {
        params: { page_size: 10000 },
        enabled: !isPrefilled && isDriverDoc,
    })

    const docTypeOptions = DOC_TYPE_OPTIONS.filter((o) =>
        TAB_DOC_TYPES[tab].includes(o.value),
    ).map((o) => ({ ...o, label: t(`documents_page.${o.value}`) }))

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
                [
                    VEHICLE_DOCUMENTS_DRIVERS,
                    VEHICLE_DOCUMENTS_TRUCKS,
                    VEHICLE_DOCUMENT_ALERTS,
                ].includes(q.queryKey[0] as string),
        })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
    })
    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
    })
    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = async (values: FormValues) => {
        const formData = new FormData()
        formData.append("doc_type", String(values.doc_type))
        if (isDriverDoc) {
            if (values.driver) formData.append("driver", String(values.driver))
        } else if (values.vehicle) {
            formData.append("vehicle", String(values.vehicle))
        }
        formData.append("number", values.number ?? "")
        formData.append("issued_date", toApiDate(values.issued_date))
        formData.append("expires_date", toApiDate(values.expires_date))

        for (const field of PHOTO_FIELDS) {
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
            } else if (value === "" || (value === null && current?.[field])) {
                formData.append(field, "")
            }
        }

        if (current?.id) {
            updateMutate(`${VEHICLE_DOCUMENTS}/${current.id}`, formData)
        } else {
            postMutate(VEHICLE_DOCUMENTS, formData)
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
                <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                        Hujjat
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormCombobox
                            required
                            name="doc_type"
                            label={t("documents_page.doc_type")}
                            options={docTypeOptions}
                            control={control}
                            labelKey="label"
                            valueKey="value"
                        />
                        {isDriverDoc ?
                            <FormCombobox
                                key="driver"
                                required
                                name="driver"
                                label={t("documents_page.driver")}
                                options={drivers?.results ?? []}
                                control={control}
                                labelKey="full_name"
                                valueKey="id"
                            />
                        :   <FormCombobox
                                key="vehicle"
                                required
                                name="vehicle"
                                label={t("documents_page.vehicle")}
                                options={vehicles?.results ?? []}
                                control={control}
                                labelKey="truck_number"
                                valueKey="id"
                            />
                        }
                    </div>
                </section>
            )}
            <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                    Ma'lumotlar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        name="number"
                        wrapperClassName="md:col-span-2"
                        label={t("documents_page.number")}
                        methods={form}
                    />
                    <FormDatePicker
                        name="issued_date"
                        label={t("documents_page.issued_date")}
                        control={control}
                        fullWidth
                    />
                    <div>
                        <FormDatePicker
                            name="expires_date"
                            label={t("documents_page.expires_date")}
                            control={control}
                            fullWidth
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {t("documents_page.expires_hint")}
                        </p>
                    </div>
                </div>
            </section>
            <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                    Rasmlar
                </h3>
                <div>
                    <div className="grid grid-cols-2 gap-3">
                        <VehicleImagePicker
                            name="photo_front"
                            label={t("documents_page.photo_front")}
                            methods={form}
                            clearable
                            maxSizeMB={MAX_PHOTO_MB}
                        />
                        <VehicleImagePicker
                            name="photo_back"
                            label={t("documents_page.photo_back")}
                            methods={form}
                            clearable
                            maxSizeMB={MAX_PHOTO_MB}
                        />
                    </div>
                </div>
            </section>
            {!!current?.id &&
                current.days_left !== null &&
                current.days_left !== undefined &&
                current.days_left <= ALERT_DAYS && (
                    <p className="md:col-span-2 text-sm font-medium text-red-600">
                        {current.days_left < 0 ?
                            t("documents_page.expired_ago", {
                                days: -current.days_left,
                            })
                        :   t("documents_page.expires_in", {
                                days: current.days_left,
                            })
                        }
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
