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
import Select from "../ui/select"
import { getNestedValue } from "./input"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function FormSelect<
    TForm extends FieldValues,
    T extends Record<string, any>,
>({
    name,
    label,
    options,
    disabled,
    required,
    control,
    setValue,
    valueKey,
    labelKey,
    hideError = false,
    renderOption,
    placeholder,
    className,
}: thisProps<TForm, T>) {
    // `control._formState` — obuna bo'linmagan ICHKI holat: undan o'qilganda
    // xato paydo bo'lganda komponent qayta render bo'lmaydi va matn ekranga
    // chiqmaydi. `useFormState` aynan shu maydonga obuna bo'ladi (FormCombobox
    // dagi bilan bir xil yondashuv).
    const { errors } = useFormState({ control, name })
    const error = getNestedValue(errors, name)
    return (
        <div className="w-full">
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
                render={({ field }) => (
                    <div className={label ? "pt-[2px]" : ""}>
                        <Select
                            options={options}
                            label={label || "Tanlang"}
                            placeholder={placeholder}
                            value={field.value}
                            className={cn(
                                !!error && "border-destructive focus:right-0",
                                className,
                            )}
                            setValue={(val) =>
                                val === "other" ?
                                    setValue?.(val)
                                :   field.onChange(val)
                            }
                            disabled={disabled}
                            labelKey={labelKey}
                            valueKey={valueKey}
                            renderOption={renderOption}
                        />
                    </div>
                )}
            />
            {!hideError && error?.message && (
                <FieldError>{error.message as string}</FieldError>
            )}
        </div>
    )
}

type thisProps<TForm extends FieldValues, T extends Record<string, any>> = {
    name: Path<TForm>
    label?: string
    options: T[]
    disabled?: boolean
    required?: boolean
    setValue?: (val: string) => void
    control: Control<TForm>
    hideError?: boolean
    labelKey?: keyof T
    valueKey?: keyof T
    renderOption?: (item: T) => ReactNode
    placeholder?: string
    className?: string
}
