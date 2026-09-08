import { displayFieldLabel } from "@/lib/field-labels"
import { Controller, Control, FieldValues, Path } from "react-hook-form"
import FieldLabel from "./form-label"
import FieldError from "./form-error"
import { MultiCombobox as ShadcnCombobox } from "@/components/ui/multi-combobox"
import { getNestedValue } from "./input"
import { ButtonProps } from "../ui/button"

type ComboboxProps<TForm extends FieldValues, T extends FieldValues> = {
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
    addButtonProps?: ButtonProps
    allSelected?: boolean
    isSearch?: boolean
    hideSort?: boolean
}

export function FormMultiCombobox<
    TForm extends FieldValues,
    T extends FieldValues,
>({
    name,
    label,
    options,
    placeholder,
    required,
    control,
    hideError = true,
    valueKey="id",
    labelKey="name",
    onAdd,
    isLoading,
    skeletonCount,
    onSearchChange,
    addButtonProps,
    allSelected = false,
    isSearch = true,
    hideSort = false
}: ComboboxProps<TForm, T>) {
    const error = getNestedValue(control._formState.errors, name);



    return (
        <div>
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
                    <div className="pt-0.5">
                        <ShadcnCombobox
                            options={options}
                            values={field.value}
                            setValues={field.onChange}
                            label={placeholder || label || "Tanlang"}
                            isError={!!error}
                            onAdd={onAdd}
                            valueKey={valueKey}
                            labelKey={labelKey}
                            isLoading={isLoading}
                            skeletonCount={skeletonCount}
                            onSearchChange={onSearchChange}
                            allSelected={allSelected}
                            isSearch={isSearch}
                            hideSort={hideSort}
                            addButtonProps={{
                                disabled: control._formState.disabled,
                                ...addButtonProps,
                            }}
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
