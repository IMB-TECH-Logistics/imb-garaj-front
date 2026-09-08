import { displayFieldLabel } from "@/lib/field-labels"
import { Controller, Control, FieldValues, Path } from "react-hook-form"
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
    hideError = true,
    renderOption,
    placeholder,
    className,
}: thisProps<TForm, T>) {
    const error = getNestedValue(control._formState.errors, name)
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
            {!hideError && error && (
                <FieldError>
                    {control._formState.errors[name]?.message as string}
                </FieldError>
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
