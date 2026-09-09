import { displayFieldLabel } from "@/lib/field-labels"
import {
    Control,
    FieldValues,
    Path,
    RegisterOptions,
    useController,
} from "react-hook-form"
import { cn } from "@/lib/utils"
import { NumericFormat, NumericFormatProps } from "react-number-format"
import FieldLabel from "./form-label"
import FieldError from "./form-error"


interface IProps<IForm extends FieldValues> {
    control: Control<IForm>
    name: Path<IForm>
    label?: string
    required?: boolean
    registerOptions?: RegisterOptions<IForm>
    formatOptions?: Intl.NumberFormatOptions
    wrapperClassName?: string
    decimalSeparator?: string
    hideError?: boolean
}

export function FormNumberInput<IForm extends FieldValues>({
    control,
    name,
    label,
    required = false,
    registerOptions,
    wrapperClassName,
    className,
    formatOptions,
    thousandSeparator = " ",
    decimalSeparator,
    /**
     * VERGUL ONLIK AJRATGICH SIFATIDA (P-36, 5-raund).
     *
     * `react-number-format` sukut bo'yicha faqat `decimalSeparator` ning
     * o'zini (ya'ni nuqtani) qabul qiladi. Vergul esa ajratgich emas,
     * shunchaki YAROQSIZ belgi bo'lgani uchun jimgina TASHLAB YUBORILADI:
     * "77,77" → "7777". Ya'ni kassaga 77.77 so'm kiritmoqchi bo'lgan
     * xodim 100 BAROBAR katta summa yozadi va hech qanday ogohlantirish
     * chiqmaydi — bazada 7 777.00 saqlanadi (jonli sinovda tasdiqlangan).
     *
     * O'zbek/rus klaviatura odatida onlik ajratgich — vergul, ya'ni bu
     * kamdan-kam uchraydigan holat emas, kundalik kiritish yo'li.
     *
     * Shuning uchun qoida shu yerda — BARCHA pul va son maydonlari uchun
     * bir joyda — o'rnatiladi. Ilgari u faqat `kassa/adjust-modal.tsx` da
     * qo'lda berilgan edi, qolgan o'nlab maydon esa himoyasiz qolgan.
     */
    allowedDecimalSeparators,
    hideError = false,
    ...props
}: IProps<IForm> & NumericFormatProps) {

    const {
        field: { onChange, ref, ...field },
        fieldState,
    } = useController({
        name,
        control,
        rules: {
            required: required ? `${displayFieldLabel(name, label)}ni kiriting` : false,
            ...registerOptions,
        },
    })

    /**
     * Butun sonli maydonlarda vergul ATAYLAB ajratgich EMAS.
     *
     * `decimalScale === 0` — maydon kasr qabul qilmaydi (UZS summasi, probeg,
     * yil, dona). Bunday maydonda vergulni onlik ajratgich deb qabul qilish
     * teskari zarar berardi: Excel odati bilan "1,000,000" yozgan foydalanuvchi
     * 1 000 000 o'rniga 1 ni oladi. Kasrsiz maydonda vergul avvalgidek
     * e'tiborsiz qoldiriladi — u yerda 100 barobar xatosi ham tug'ilmaydi,
     * chunki kasr qismi baribir yo'q.
     */
    const decimalSeparators =
        allowedDecimalSeparators ??
        (props.decimalScale === 0 ? undefined : [",", "."])

    return (
        <fieldset className={cn("flex flex-col w-full", wrapperClassName)}>
            {label && (
                <FieldLabel
                    htmlFor={name}
                    required={required}
                    isError={!!fieldState.error}
                >
                    {label}
                </FieldLabel>
            )}
            <label className="relative flex items-center">
                <NumericFormat
                    id={name}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-4 py-1 text-sm  transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                        className,
                        !!fieldState.error &&
                            "border-red-600 focus:border-border !ring-red-600",
                    )}
                    thousandSeparator={thousandSeparator}
                    decimalSeparator={decimalSeparator}
                    allowedDecimalSeparators={decimalSeparators}
                    getInputRef={ref}
                    {...props}
                    {...field}
                    onValueChange={(val) => {
                        onChange(val.value)
                    }}
                    placeholder={props.placeholder || label}
                    disabled={field.disabled || props.disabled}
                />
            </label>
            {fieldState.error && !hideError && (
                <FieldError>{fieldState.error?.message}</FieldError>
            )}
        </fieldset>
    )
}
