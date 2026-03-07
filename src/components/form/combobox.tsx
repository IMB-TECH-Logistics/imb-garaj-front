import { Controller, Control, FieldValues, Path } from "react-hook-form"
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
    hideError = true,
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
    const error = getNestedValue(control._formState.errors, name)

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
                    required ? { required: `${label || name}ni kiriting` } : {}
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
                            disabled: control._formState.disabled,
                            ...addButtonProps,
                        }}
                    />
                )}
            />
            {!hideError && error && (
                <FieldError>
                    {control._formState.errors[name]?.message as string}
                </FieldError>
            )}
        </fieldset>
    )
}
