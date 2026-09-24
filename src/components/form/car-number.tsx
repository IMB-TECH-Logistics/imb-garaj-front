import { cn } from "@/lib/utils"
import { Control, Controller } from "react-hook-form"
import { Input } from "../ui/input"
import FieldError from "./form-error"
import FieldLabel from "./form-label"

export function FormCarNumber({
    name,
    label,
    placeholder,
    disabled,
    required,
    hideError = false,
    control,
    className,
    wrapperClassName,
}: thisProps) {

    
    return (
        <div className="w-full flex flex-col  ">
            {label && (
                <FieldLabel
                    htmlFor={name}
                    required={!!required}
                    isError={!!control._formState.errors?.[name]}
                >
                    {label}
                </FieldLabel>
            )}
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <Input
                        id={name}
                        type="text"
                        placeholder={placeholder || label}
                        disabled={field.disabled || disabled}
                        defaultValue={field.value || ""}
                        autoComplete="off"
                        wrapperClassName={wrapperClassName}
                        className={cn(
                            control._formState.errors?.[name] &&
                                "border-destructive focus:border-border !ring-destructive",
                            className,
                        )}
                        onInput={(e) => {
                            const formattedValue = formatCarNumber(
                                e.currentTarget.value,
                            )
                            e.currentTarget.value = formattedValue
                            field.onChange(formattedValue)
                        }}
                        fullWidth
                    />
                )}
            />
            {!hideError && control._formState.errors?.[name] && (
                <FieldError className="-mt-1">
                    {control._formState.errors[name]?.message as string}
                </FieldError>
            )}
        </div>
    )
}

interface thisProps {
    name: string
    label?: string
    placeholder?: string
    disabled?: boolean
    required?: boolean
    hideError?: boolean
    control: Control<any>
    className?: string
    wrapperClassName?: string
}

export const formatCarNumber = (value?: string) => {
    if (!value) return ""
    const alphanumericOnly = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
    const firstTwo = alphanumericOnly.slice(0, 2)
    const remaining = alphanumericOnly.slice(2)
    const formattedRemaining = remaining.replace(
        /([A-Za-z])(?=\d)|(\d)(?=[A-Za-z])/g,
        "$1$2 ",
    )
    const result = `${firstTwo} ${formattedRemaining}`.trim()
    return result.slice(0, 11).trim()
}
