import { FormCheckbox } from "@/components/form/checkbox"
import { FormDatePicker } from "@/components/form/date-picker"
import { FormFormatNumberInput } from "@/components/form/format-number-input"
import FormInput from "@/components/form/input"
import { FormNumberInput } from "@/components/form/number-input"
import { Button } from "@/components/ui/button"
import { SETTINGS_DRIVERS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

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

    const onSuccess = () => {
        toast.success(
            currentDriver?.id ? t("messages.success_edit") : t("messages.success_add"),
        )
        reset()
        clearKey(SETTINGS_DRIVERS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [SETTINGS_DRIVERS] })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({
        onSuccess,
    })

    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({
        onSuccess,
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
                    name="driver.driver_license"
                    label={t("form.license_number")}
                    methods={form}
                    placeholder={`${t("form.example")}: ABC1234567`}
                />

                <FormNumberInput
                    required
                    allowNegative={false}
                    decimalScale={1}
                    isAllowed={({ floatValue }) =>
                        floatValue === undefined || floatValue <= 100
                    }
                    name="driver.experience"
                    label={t("form.experience")}
                    control={form.control}
                    placeholder="5"
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
