import { displayFieldLabel } from "@/lib/field-labels"
import {
    Controller,
    Control,
    FieldValues,
    Path,
    useFormState,
} from "react-hook-form"
import FieldLabel from "./form-label"
import FieldError from "./form-error"
import { Combobox as ShadcnCombobox } from "@/components/ui/combobox"
import { getNestedValue } from "./input"
import { ClassNameValue } from "tailwind-merge"
import { ButtonProps } from "../ui/button"
import { cn } from "@/lib/utils"

type ComboboxProps<TForm extends FieldValues, T extends Record<string, any>> = {
    name: Path<TForm>
    label?: string
    placeholder?: string
    options: T[] | undefined
    required?: boolean
    control: Control<TForm>
    hideError?: boolean
    onAdd?: () => void
    labelKey?: keyof T
    valueKey?: keyof T
    skeletonCount?: number
    isLoading?: boolean
    onSearchChange?: (val: string) => void
    className?: ClassNameValue
    addButtonProps?: ButtonProps
    isSearch?: boolean
    sorting?: boolean
    isClearIcon?: boolean
    wrapperClassName?: string
}

export function FormCombobox<
    TForm extends FieldValues,
    T extends Record<string, any>,
>({
    name,
    label,
    placeholder,
    required,
    options,
    control,
    // Majburiy maydon bo'sh qolganda foydalanuvchi FAQAT qizil ramka ko'rardi,
    // sababini tushuntiruvchi matn esa yo'q edi — shuning uchun bu komponentda
    // xato matni sukut bo'yicha KO'RSATILADI (xato bo'lmaganda hech nima chizilmaydi).
    hideError = false,
    valueKey,
    labelKey,
    onAdd,
    isLoading,
    skeletonCount,
    onSearchChange,
    addButtonProps,
    className,
    isClearIcon,
    isSearch = true,
    wrapperClassName,
}: ComboboxProps<TForm, T>) {
    /**
     * `control._formState` — react-hook-form ning ICHKI, obuna bo'linmagan
     * holati. Undan o'qilganda komponent xato paydo bo'lganda QAYTA RENDER
     * BO'LMAYDI, shuning uchun xato matni hech qachon ekranga chiqmasdi
     * (`hideError={false}` qo'yilganda ham). `useFormState` esa aynan shu
     * maydonning xatosiga obuna bo'ladi va qayta renderni ta'minlaydi.
     */
    const { errors, disabled } = useFormState({ control, name })
    const error = getNestedValue(errors, name)

    return (
        <fieldset className={cn("flex flex-col w-full", wrapperClassName)}>
            {label && (
                <FieldLabel
                    htmlFor={name}
                    required={!!required}
                    isError={!!error}
                >
                    {label}
                </FieldLabel>
            )}
            <Controller
                name={name}
                control={control}
                rules={
                    required ? { required: `${displayFieldLabel(name, label)}ni kiriting` } : {}
                }
                render={({ field, fieldState }) => (
                    <ShadcnCombobox
                        options={options}
                        value={field.value || ""}
                        setValue={field.onChange}
                        label={placeholder || label || "Tanlang"}
                        isError={!!fieldState.error}
                        onAdd={onAdd}
                        valueKey={valueKey}
                        labelKey={labelKey}
                        isLoading={isLoading}
                        skeletonCount={skeletonCount}
                        onSearchChange={onSearchChange}
                        isSearch={isSearch}
                        isClearIcon={isClearIcon}
                        className={className}
                        addButtonProps={{
                            disabled,
                            ...addButtonProps,
                        }}
                    />
                )}
            />
            {!hideError && error?.message && (
                // `getNestedValue` bilan olingan xato — `items.0.type` kabi
                // ichma-ich nomlar uchun ham to'g'ri ishlaydi (ilgari tekis
                // `errors[name]` ishlatilgani uchun bunday maydonlarda
                // xabar `undefined` bo'lib qolardi).
                <FieldError>{error.message as string}</FieldError>
            )}
        </fieldset>
    )
}
