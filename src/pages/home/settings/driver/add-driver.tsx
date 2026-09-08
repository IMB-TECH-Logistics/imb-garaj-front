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
import { showSettingsApiError } from "../settings-api-errors"

/** Midnight today — the earliest date a driving licence may still be valid. */
const startOfToday = () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
}

/**
 * The shared FormInput swallows its validation text (it renders
 * `error.message?.message`, and `hideError={false}` throws on a clean field),
 * so a missing required field showed only a red border. Render it here.
 */
const FieldMessage = ({ message }: { message?: unknown }) =>
    message ? (
        <span className="mt-1 block text-xs text-destructive">
            {String(message)}
        </span>
    ) : null

const AddDriverModal = () => {
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

    const {
        handleSubmit,
        reset,
        formState: { errors },
    } = form

    const onSuccess = () => {
        toast.success(
            `Haydovchi muvaffaqiyatli ${currentDriver?.id ? "tahrirlandi!" : "qo'shildi"}`,
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
            toast.error("Iltimos, barcha maydonlarni to'g'ri to'ldiring")
            return
        }

        const phoneValue = values.driver.phone || ""
        const digitsOnly = phoneValue.replace(/\D/g, "")

        if (digitsOnly.length !== 9) {
            form.setError("driver.phone", {
                type: "manual",
                message: "Telefon raqam 12 ta raqamdan iborat bo'lishi kerak",
            })
            toast.error("Telefon raqam to'liq emas")
            return
        }

        if (currentDriver?.id) {
            const { password, ...restValues } = values

            const payload = password ? values : restValues

            updateMutate(`${SETTINGS_DRIVERS}/${currentDriver.id}`, payload, {
                onError: showSettingsApiError,
            })
        } else {
            postMutate(SETTINGS_DRIVERS, values, {
                onError: showSettingsApiError,
            })
        }
    }
    return (
        <div className="w-full max-w-4xl mx-auto p-1">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid md:grid-cols-2 gap-4"
            >
                <div>
                    <FormInput
                        required
                        name="first_name"
                        label="Ism"
                        methods={form}
                        placeholder="Misol: Ali "
                        registerOptions={{ required: "Ismni kiriting" }}
                    />
                    <FieldMessage message={errors.first_name?.message} />
                </div>
                <div>
                    <FormInput
                        required
                        name="last_name"
                        label="Familiya"
                        methods={form}
                        placeholder="Misol: Karimov"
                        registerOptions={{ required: "Familiyani kiriting" }}
                    />
                    <FieldMessage message={errors.last_name?.message} />
                </div>
                <div>
                    <FormInput
                        required
                        name="username"
                        label="Login"
                        methods={form}
                        placeholder="Misol: ali.karimov"
                        registerOptions={{ required: "Loginni kiriting" }}
                    />
                    <FieldMessage message={errors.username?.message} />
                </div>

                <div>
                    <FormInput
                        required={!currentDriver?.id}
                        type="password"
                        name="password"
                        label="Parol"
                        methods={form}
                        placeholder={
                            currentDriver?.id ?
                                "O'zgartirish uchun kiriting"
                            :   "Misol: SecurePass123!"
                        }
                        registerOptions={{
                            required:
                                currentDriver?.id ? false : "Parolni kiriting",
                        }}
                    />
                    <FieldMessage message={errors.password?.message} />
                </div>

                {/*
                  * This component renders its message from `fieldState` inside
                  * the controller, so unlike FormInput it is safe to unhide.
                  * (Its wording is fixed at "Ushbu maydon majburiy" — it
                  * ignores `registerOptions` — but the red label names the
                  * field, and onSubmit sets a specific message for a partial
                  * number.)
                  */}
                <FormFormatNumberInput
                    control={form.control}
                    format="+998 ## ### ## ##"
                    required
                    hideError={false}
                    label={"Telefon"}
                    name={"driver.phone"}
                    placeholder="+998 __ ___ __ __"
                />

                <div>
                    <FormInput
                        required
                        registerOptions={{
                            required: "Pasport raqamini kiriting",
                            maxLength: {
                                value: 9,
                                message:
                                    "Passport seriya 9 ta belgidan iborat bo'lishi kerak",
                            },
                        }}
                        uppercase={true}
                        name="driver.passport_serial"
                        label="Pasport raqami"
                        methods={form}
                        placeholder="Misol: AA1234567"
                    />
                    <FieldMessage
                        message={errors.driver?.passport_serial?.message}
                    />
                </div>

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
                    label="PINFL"
                    control={form.control}
                    placeholder="Misol: 12345678901234"
                />

                <div>
                    <FormInput
                        required
                        uppercase={true}
                        name="driver.driver_license"
                        label="Guvohnoma raqami"
                        methods={form}
                        placeholder="Misol: ABC1234567"
                        registerOptions={{
                            required: "Guvohnoma raqamini kiriting",
                        }}
                    />
                    <FieldMessage
                        message={errors.driver?.driver_license?.message}
                    />
                </div>

                {/*
                  * `experience` is a CharField on the server, so it accepts any
                  * text — `-5` included (UI audit S1-29). Until the column is
                  * migrated to a number (see backend-kerak/F3.md) these two
                  * guards are the only thing standing between a typo and a
                  * negative work history: `allowNegative` stops the minus sign
                  * from being typed at all, `validate` catches pasted values.
                  */}
                <FormNumberInput
                    required
                    allowNegative={false}
                    decimalScale={0}
                    thousandSeparator={""}
                    name="driver.experience"
                    label="Ish staji (yil)"
                    control={form.control}
                    placeholder="Misol: 5"
                    registerOptions={{
                        required: "Ish stajini kiriting",
                        validate: (value: unknown) => {
                            if (value === null || value === undefined || value === "")
                                return "Ish stajini kiriting"
                            const num = Number(value)
                            if (Number.isNaN(num))
                                return "Ish staji raqam bo'lishi kerak"
                            if (num < 0)
                                return "Ish staji manfiy bo'lishi mumkin emas"
                            if (num > 70)
                                return "Ish staji 70 yildan oshmasligi kerak"
                            return true
                        },
                    }}
                />

                <FormDatePicker
                    required
                    hideError={false}
                    name="driver.driver_license_date"
                    label="Guvohnoma muddati"
                    control={form.control}
                    placeholder="Sanani tanlang"
                    calendarProps={{
                        // A licence that already expired cannot be a valid
                        // expiry date for a driver being registered (S1-30).
                        disabled: { before: startOfToday() },
                    }}
                />
                <div className="flex items-center justify-end gap-2 md:col-span-2">
                    <Button
                        className="min-w-36 w-full md:w-max"
                        type="submit"
                        loading={isPending}
                    >
                        {"Saqlash"}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default AddDriverModal
