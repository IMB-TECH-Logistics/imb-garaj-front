import {
    Controller,
    Control,
    FieldValues,
    Path,
    useFormState,
} from "react-hook-form"
import { Checkbox } from "../ui/checkbox"
import FieldLabel from "./form-label"
import FieldError from "./form-error"
import { cn } from "@/lib/utils"
import { ClassNameValue } from "tailwind-merge"
import { ReactNode } from "@tanstack/react-router"

export function FormCheckbox<TForm extends FieldValues>({
    name,
    label,
    disabled,
    control,
    required,
    hideError = false,
    wrapperClass,
    className,
}: thisProps<TForm>) {
    // `control._formState` obuna bo'linmagan ichki holat — `useFormState`
    // esa xato o'zgarganda qayta renderni ta'minlaydi.
    const { errors } = useFormState({ control, name })
    const error = (errors as Record<string, any>)?.[name]

    return (
        <div>
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <div
                        className={cn(
                            "flex items-center gap-2 cursor-pointer",
                            wrapperClass,
                        )}
                    >
                        <Checkbox
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                            disabled={disabled || field.disabled}
                            className={cn("-mt-1", className)}
                            id={name}
                        />
                        <FieldLabel
                            htmlFor={name}
                            required={!!required}
                            isError={!!error}
                        >
                            {label}
                        </FieldLabel>
                    </div>
                )}
            />
            {!hideError && error?.message && (
                <FieldError>{error.message as string}</FieldError>
            )}
        </div>
    )
}

interface thisProps<TForm extends FieldValues> {
    name: Path<TForm>
    label?: string | ReactNode
    disabled?: boolean
    control: Control<TForm>
    required?: boolean
    hideError?: boolean
    wrapperClass?: ClassNameValue
    className?: ClassNameValue
}
