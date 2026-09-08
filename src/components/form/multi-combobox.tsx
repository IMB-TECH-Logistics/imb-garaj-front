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
    hideError = false,
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
    // `control._formState` obuna bo'linmagan ichki holat — undan o'qilsa
    // xato paydo bo'lganda qayta render bo'lmaydi va matn chiqmaydi.
    const { errors, disabled } = useFormState({ control, name })
    const error = getNestedValue(errors, name)



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
                                disabled,
                                ...addButtonProps,
                            }}
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
