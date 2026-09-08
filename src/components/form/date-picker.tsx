import { displayFieldLabel } from "@/lib/field-labels"
import { DatePicker } from "@/components/ui/datepicker"
import { cn } from "@/lib/utils"
import { Control, Controller, FieldValues, Path } from "react-hook-form"
import { ClassNameValue } from "tailwind-merge"
import { ButtonProps } from "../ui/button"
import { CalendarProps } from "../ui/calendar"
import FieldError from "./form-error"
import FieldLabel from "./form-label"
import { getNestedValue } from "./input"

export function FormDatePicker<TForm extends FieldValues>({
    name,
    label,
    disabled,
    control,
    required = false,
    calendarProps,
    hideError = true,
    placeholder,
    fullWidth,
    className,
    addButtonProps,
}: thisProps<TForm>) {
    const error = getNestedValue(control._formState.errors, name)
    return (
        <fieldset className="flex flex-col w-full">
            {label && (
                <FieldLabel
                    isError={!!error}
                    htmlFor={name}
                    required={required}
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
                    <>
                        <DatePicker
                            calendarProps={{
                                ...calendarProps,
                                defaultMonth:
                                    field.value ?
                                        new Date(field.value)
                                    :   undefined,
                            }}
                            date={
                                field.value ? new Date(field.value) : undefined
                            }
                            setDate={field.onChange}
                            placeholder={placeholder || label}
                            disabled={field.disabled || disabled}
                            fullWidth={fullWidth}
                            className={cn(className, "dark:text-white")}
                            isError={!!fieldState.error}
                            addButtonProps={addButtonProps}
                        />
                        {!hideError && fieldState.error && (
                            <FieldError>
                                {fieldState.error.message as string}
                            </FieldError>
                        )}
                    </>
                )}
            />
        </fieldset>
    )
}

interface thisProps<TForm extends FieldValues> {
    name: Path<TForm>
    label?: string
    disabled?: boolean
    control: Control<TForm>
    required?: boolean
    calendarProps?: CalendarProps | undefined
    hideError?: boolean
    placeholder?: string
    fullWidth?: boolean
    className?: ClassNameValue
    addButtonProps?: ButtonProps
}
