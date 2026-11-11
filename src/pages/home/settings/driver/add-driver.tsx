import { PasswordField } from "@/components/form/password-field"
import { FormCheckbox } from "@/components/form/checkbox"
import { FormDatePicker } from "@/components/form/date-picker"
import { FormFormatNumberInput } from "@/components/form/format-number-input"
import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { normalizeDocNumber } from "@/lib/format-driver-docs"
import { SETTINGS_DRIVERS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { postRequest, usePost } from "@/hooks/usePost"
import { deleteRequest } from "@/hooks/useDelete"
import VehicleImagePicker from "@/pages/home/settings/vehicles/vehicle-image-picker"
import { useState } from "react"
import { handleFormError } from "@/lib/show-form-errors"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { validateUsername } from "@/lib/reserved-username"

type DriverFormValues = DriversType & { photo_file?: File | string | null }

export const DriverForm = ({
    currentDriver,
    onDone,
    page = false,
    onCancel,
}: {
    currentDriver?: DriversType | null
    onDone: (saved: DriversType) => void
    page?: boolean
    onCancel?: () => void
}) => {
    const { t } = useTranslation()
    const sectionCls = page ? "md:col-span-2 px-4 py-6 border rounded-2xl" : "md:col-span-2 rounded-lg border bg-muted/20 p-4"
    const titleCls = page ? "font-bold text-xl mb-6" : "mb-3 text-sm font-semibold text-muted-foreground"
    const gridCls = page ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-5 items-start" : "grid md:grid-cols-2 gap-4 items-start"
    const queryClient = useQueryClient()
    const [uploading, setUploading] = useState(false)

    const form = useForm<DriverFormValues>({
        defaultValues: {
            ...currentDriver,
            driver: {
                ...currentDriver?.driver,
                can_go_abroad: !!currentDriver?.driver?.can_go_abroad,
            } as DriverInfoType,
            password: "",
            photo_file: currentDriver?.driver?.photo || null,
        },
    })

    const { handleSubmit, reset } = form

    const syncPhoto = async (driverId: number) => {
        const value = form.getValues("photo_file")
        const had = !!currentDriver?.driver?.photo
        if (value instanceof File) {
            const fd = new FormData()
            fd.append("photo", value)
            await postRequest(`${SETTINGS_DRIVERS}/${driverId}/photo`, fd)
        } else if (!value && had) {
            await deleteRequest(`${SETTINGS_DRIVERS}/${driverId}/photo`)
        }
    }

    const onSuccess = async (saved: DriversType) => {
        const driverId = saved?.id ?? currentDriver?.id
        if (driverId) {
            setUploading(true)
            try {
                await syncPhoto(driverId)
            } catch {
                toast.error(t("driver_form.photo_failed"))
            } finally {
                setUploading(false)
            }
        }
        toast.success(
            currentDriver?.id ? t("messages.success_edit") : t("messages.success_add"),
        )
        reset()
        queryClient.invalidateQueries({
            predicate: (q) => String(q.queryKey[0]).startsWith(SETTINGS_DRIVERS),
        })
        onDone(saved)
    }

    const onError = (error: unknown) => handleFormError(error, form)

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
        onError,
    })

    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
        onError,
    })

    const isPending = isPendingCreate || isPendingUpdate || uploading

    const onSubmit = async (formValues: DriverFormValues) => {
        const { photo_file: _photo, ...values } = formValues
        const isValid = await form.trigger()

        if (!isValid) {
            toast.error(t("toast.error_fields"))
            return
        }

        const phoneValue = values.driver.phone || ""
        const digitsOnly = phoneValue.replace(/\D/g, "")

        if (digitsOnly.length !== 9) {
            form.setError("driver.phone", {
                type: "manual",
                message: t("settings.driver.phone_12_digits"),
            })
            toast.error(t("toast.error_phone"))
            return
        }

        for (const key of ["relative_phone_1", "relative_phone_2"] as const) {
            const digits = (values.driver?.[key] || "").replace(/\D/g, "")
            if (digits.length > 0 && digits.length !== 9) {
                form.setError(`driver.${key}`, {
                    type: "manual",
                    message: t("settings.driver.phone_12_digits"),
                })
                toast.error(t("toast.error_phone"))
                return
            }
        }

        if (currentDriver?.id) {
            const { password, ...restValues } = values

            const payload = password ? values : restValues

            updateMutate(`${SETTINGS_DRIVERS}/${currentDriver.id}`, payload)
        } else {
            postMutate(SETTINGS_DRIVERS, values)
        }
    }
    return (
        <div className={page ? "w-full" : "w-full max-w-4xl mx-auto p-1"}>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className={page ? "grid md:grid-cols-2 gap-6 my-4" : "grid md:grid-cols-2 gap-4"}
            >
                <section className={sectionCls}>
                    <h3 className={titleCls}>{t("settings.driver.fio")}</h3>
                    <div className={page ? "flex flex-col lg:flex-row gap-6 items-start" : "grid md:grid-cols-[180px_1fr] gap-4 items-start"}>
                    <div className={page ? "w-full lg:w-52 shrink-0" : undefined}>
                    <VehicleImagePicker
                        name="photo_file"
                        label={t("driver_form.photo")}
                        methods={form}
                        clearable
                        maxSizeMB={10}
                    />
                    </div>
                    <div className={page ? `flex-1 w-full ${gridCls}` : "grid gap-4"}>
                    <FormInput
                        required
                        name="first_name"
                        maxLength={50}
                        label={t("form.first_name")}
                        methods={form}
                        placeholder={`${t("form.example")}: Ali`}
                    />

                    <FormInput
                        required
                        name="last_name"
                        maxLength={50}
                        label={t("form.last_name")}
                        methods={form}
                        placeholder={`${t("form.example")}: Karimov`}
                    />
                    </div>
                    </div>
                </section>

                <section className={sectionCls}>
                    <h3 className={titleCls}>{t("settings.driver.phones")}</h3>
                    <div className={gridCls}>
                    <div className={page ? undefined : "md:col-span-2"}>
                        <FormFormatNumberInput
                            control={form.control}
                            format="+998 ## ### ## ##"
                            required
                            label={t("form.phone")}
                            name={"driver.phone"}
                            placeholder="+998 __ ___ __ __"
                        />
                    </div>

                    <FormFormatNumberInput
                        control={form.control}
                        format="+998 ## ### ## ##"
                        label={t("form.relative_phone_1")}
                        name={"driver.relative_phone_1"}
                        placeholder="+998 __ ___ __ __"
                    />

                    <FormInput
                        name="driver.relative_contact_1"
                        label={t("form.relative_contact_1")}
                        methods={form}
                        registerOptions={{ maxLength: { value: 255, message: t("settings.driver.max_255") } }}
                        placeholder={`${t("form.example")}: Akasi - Anvar`}
                    />

                    <FormFormatNumberInput
                        control={form.control}
                        format="+998 ## ### ## ##"
                        label={t("form.relative_phone_2")}
                        name={"driver.relative_phone_2"}
                        placeholder="+998 __ ___ __ __"
                    />

                    <FormInput
                        name="driver.relative_contact_2"
                        label={t("form.relative_contact_2")}
                        methods={form}
                        registerOptions={{ maxLength: { value: 255, message: t("settings.driver.max_255") } }}
                        placeholder={`${t("form.example")}: Akasi - Anvar`}
                    />
                    </div>
                </section>

                <section className={sectionCls}>
                    <h3 className={titleCls}>{t("nav.documents")}</h3>
                    <div className={gridCls}>
                    <FormInput
                        required
                        registerOptions={{
                            setValueAs: normalizeDocNumber,
                            maxLength: {
                                value: 9,
                                message:
                                    t("settings.driver.passport_len"),
                            },
                        }}
                        uppercase={true}
                        name="driver.passport_serial"
                        label={t("form.passport")}
                        methods={form}
                        placeholder={`${t("form.example")}: AA1234567`}
                    />

                    <FormNumberInput
                        registerOptions={{
                            maxLength: {
                                value: 14,
                                message: t("settings.driver.digits_14"),
                            },
                            minLength: {
                                value: 14,
                                message: t("settings.driver.digits_14"),
                            },
                        }}
                        thousandSeparator={""}
                        required
                        name="driver.pinfl"
                        label={t("form.jshshir")}
                        control={form.control}
                        placeholder={`${t("form.example")}: 12345678901234`}
                    />

                    <FormInput
                        required
                        uppercase={true}
                        registerOptions={{ setValueAs: normalizeDocNumber }}
                        name="driver.driver_license"
                        label={t("form.license_number")}
                        methods={form}
                        placeholder={`${t("form.example")}: ABC1234567`}
                    />

                    <FormDatePicker
                        fullWidth
                        required
                        name="driver.driver_license_date"
                        label={t("form.license_expiry")}
                        control={form.control}
                        placeholder={t("form.select_date")}
                        calendarProps={
                            currentDriver?.id ?
                                {}
                            :   { disabled: { before: new Date() } }
                        }
                    />

                    <FormDatePicker
                        fullWidth
                        name="driver.hired_at"
                        label={t("form.hired_at")}
                        control={form.control}
                        placeholder={t("form.select_date")}
                        calendarProps={{ disabled: { after: new Date() } }}
                    />

                    <div className="md:col-span-2">
                        <FormCheckbox
                            name="driver.can_go_abroad"
                            label={t("form.can_go_abroad")}
                            control={form.control}
                        />
                    </div>
                    </div>
                </section>

                <section className={sectionCls}>
                    <h3 className={titleCls}>{t("settings.common.login_and_password")}</h3>
                    <div className={gridCls}>
                    <FormInput
                        required
                        name="username"
                        registerOptions={{ validate: validateUsername }}
                        label={t("auth.username")}
                        methods={form}
                        placeholder={`${t("form.example")}: ali.karimov`}
                    />

                    <PasswordField
                        required={!currentDriver?.id}
                        name="password"
                        label={t("auth.password")}
                        methods={form}
                        placeholder={
                            currentDriver?.id ?
                                t("form.enter_to_change")
                            :   `${t("form.example")}: SecurePass123!`
                        }
                    />
                    </div>
                </section>

                <div className="flex items-center justify-end gap-3 md:col-span-2">
                    {page && onCancel && (
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={isPending}
                            onClick={onCancel}
                        >
                            {t("actions.cancel")}
                        </Button>
                    )}
                    <Button
                        className={page ? "min-w-28" : "min-w-36 w-full md:w-max"}
                        type="submit"
                        loading={isPending}
                    >
                        {t("actions.save")}
                    </Button>
                </div>
            </form>
        </div>
    )
}

const AddDriverModal = () => {
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const currentDriver = getData<DriversType>(SETTINGS_DRIVERS)
    return (
        <DriverForm
            currentDriver={currentDriver}
            onDone={() => {
                clearKey(SETTINGS_DRIVERS)
                closeModal()
            }}
        />
    )
}

export default AddDriverModal
