import { FormCheckbox } from "@/components/form/checkbox"
import { FormDatePicker } from "@/components/form/date-picker"
import { FormFormatNumberInput } from "@/components/form/format-number-input"
import FieldLabel from "@/components/form/form-label"
import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { normalizeDocNumber } from "@/lib/format-driver-docs"
import { formatExperience, monthsSince } from "@/lib/format-experience"
import { SETTINGS_DRIVERS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { handleFormError } from "@/lib/show-form-errors"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { validateUsername } from "@/lib/reserved-username"

const AddDriverModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const currentDriver = getData<DriversType>(SETTINGS_DRIVERS)

    const form = useForm<DriversType>({
        defaultValues: {
            ...currentDriver,
            password: "",
        },
    })

    const { handleSubmit, reset } = form

    const hiredAt = useWatch({ control: form.control, name: "driver.hired_at" })
    const experienceText =
        hiredAt ?
            formatExperience(t, monthsSince(hiredAt))
        :   formatExperience(
                t,
                currentDriver?.driver?.experience_months,
                currentDriver?.driver?.experience,
            )

    const onSuccess = () => {
        toast.success(
            currentDriver?.id ? t("messages.success_edit") : t("messages.success_add"),
        )
        reset()
        clearKey(SETTINGS_DRIVERS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [SETTINGS_DRIVERS] })
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

    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = async (values: DriversType) => {
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
                message: "Telefon raqam 12 ta raqamdan iborat bo'lishi kerak",
            })
            toast.error(t("toast.error_phone"))
            return
        }

        for (const key of ["relative_phone_1", "relative_phone_2"] as const) {
            const digits = (values.driver?.[key] || "").replace(/\D/g, "")
            if (digits.length > 0 && digits.length !== 9) {
                form.setError(`driver.${key}`, {
                    type: "manual",
                    message: "Telefon raqam 12 ta raqamdan iborat bo'lishi kerak",
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
        <div className="w-full max-w-4xl mx-auto p-1">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid md:grid-cols-2 gap-4"
            >
                <FormInput
                    required
                    name="first_name"
                    label={t("form.first_name")}
                    methods={form}
                    placeholder={`${t("form.example")}: Ali`}
                />
                <FormInput
                    required
                    name="last_name"
                    label={t("form.last_name")}
                    methods={form}
                    placeholder={`${t("form.example")}: Karimov`}
                />
                <FormInput
                    required
                    name="username"
                    registerOptions={{ validate: validateUsername }}
                    label={t("auth.username")}
                    methods={form}
                    placeholder={`${t("form.example")}: ali.karimov`}
                />

                <FormInput
                    required={!currentDriver?.id}
                    type="password"
                    name="password"
                    label={t("auth.password")}
                    methods={form}
                    placeholder={
                        currentDriver?.id ?
                            t("form.enter_to_change")
                        :   `${t("form.example")}: SecurePass123!`
                    }
                />

                <FormFormatNumberInput
                    control={form.control}
                    format="+998 ## ### ## ##"
                    required
                    label={t("form.phone")}
                    name={"driver.phone"}
                    placeholder="+998 __ ___ __ __"
                />

                <FormInput
                    required
                    registerOptions={{
                        setValueAs: normalizeDocNumber,
                        maxLength: {
                            value: 9,
                            message:
                                "Passport seriya 9 ta belgidan iborat bo'lishi kerak",
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
                            message: "14 xonali bo'lishi kerak",
                        },
                        minLength: {
                            value: 14,
                            message: "14 xonali bo'lishi kerak",
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
                    name="driver.hired_at"
                    label={t("form.hired_at")}
                    control={form.control}
                    placeholder={t("form.select_date")}
                    calendarProps={{ disabled: { after: new Date() } }}
                />

                <fieldset className="flex flex-col w-full">
                    <FieldLabel required={false} isError={false} htmlFor="driver-experience">
                        {t("form.work_experience")}
                    </FieldLabel>
                    <Input
                        id="driver-experience"
                        readOnly
                        disabled
                        value={experienceText}
                        fullWidth
                    />
                </fieldset>

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
                    registerOptions={{ maxLength: { value: 255, message: "255 ta belgidan oshmasin" } }}
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
                    registerOptions={{ maxLength: { value: 255, message: "255 ta belgidan oshmasin" } }}
                    placeholder={`${t("form.example")}: Akasi - Anvar`}
                />

                <FormDatePicker
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
                <div className="flex items-center justify-end gap-2 md:col-span-2">
                    <Button
                        className="min-w-36 w-full md:w-max"
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

export default AddDriverModal
