import { cn } from "@/lib/utils"
import {
    FieldValues,
    Path,
    RegisterOptions,
    UseFormReturn,
} from "react-hook-form"
import { ClassNameValue } from "tailwind-merge"
import { Textarea } from "../ui/textarea"
import FieldError from "./form-error"
import FieldLabel from "./form-label"

interface IProps<IForm extends FieldValues> {
    methods: UseFormReturn<IForm>
    name: Path<IForm>
    label?: string
    required?: boolean
    registerOptions?: RegisterOptions<IForm>
    wrapperClassName?: ClassNameValue
    hideError?: boolean
    uppercase?: boolean
}

export function FormTextarea<IForm extends FieldValues>({
    methods,
    name,
    label,
    required = false,
    registerOptions,
    wrapperClassName,
    className,
    hideError = false,
    uppercase = false,
    ...props
}: IProps<IForm> & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    const {
        register,
        formState: { errors },
    } = methods

    const reg = register(name, {
        required: {
            value: required,
            message: methods.formState.errors[name]?.message as any,
        },
        ...(uppercase && {
            setValueAs: (value: string) => value?.toUpperCase(),
        }),
        ...registerOptions,
    })

    const { disabled, ...otherProps } = props

    return (
        <fieldset className={cn("flex flex-col w-full", wrapperClassName)}>
            {label && (
                <FieldLabel
                    htmlFor={name}
                    required={required}
                    isError={!!errors?.[name]}
                >
                    {label}
                </FieldLabel>
            )}
            <Textarea
                {...reg}
                {...otherProps}
                disabled={disabled || methods.formState.disabled}
                placeholder={props.placeholder || label}
                id={name}
                className={cn(
                    !!errors?.[name] && !label ?
                        "border-destructive focus:border-border !ring-destructive"
                    :   "",
                    className,
                )}
            />
            {!hideError && errors[name] && (
                <FieldError>{errors[name]?.message as string}</FieldError>
            )}
        </fieldset>
    )
}

export default FormTextarea
