import { cn } from "@/lib/utils"
import { useEffect } from "react"
import { FieldValues, Path, UseFormReturn } from "react-hook-form"
import { ClassNameValue } from "tailwind-merge"
import { useTranslation } from "react-i18next"
import FieldError from "../form/form-error"
import FieldLabel from "../form/form-label"
import { Input, InputProps } from "../ui/input"

interface IProps<IForm extends FieldValues> {
    methods: UseFormReturn<IForm>
    name: Path<IForm>
    label?: string
    wrapperClassName?: ClassNameValue
    showError?: boolean
    required?: boolean
}

export default function InputField<IForm extends FieldValues>({
    methods,
    name,
    label,
    wrapperClassName,
    showError = false,
    required = false,
    ...props
}: IProps<IForm> & InputProps) {
    const { t } = useTranslation()
    const {
        register,
        formState: { errors },
    } = methods

    const reg = register(name, {
        required: {
            value: required,
            message: label ? t("validation.required_field", { field: label }) : t("validation.required"),
        },
    })

    useEffect(() => {
        register(name)
    }, [name, register])

    return (
        <fieldset className={cn("flex flex-col w-full", wrapperClassName)}>
            {label && (
                <FieldLabel
                    htmlFor={name}
                    className={cn(!!errors?.[name] && "text-destructive")}
                    required={required}
                    isError={!!errors?.[name]}
                >
                    {label}
                </FieldLabel>
            )}
            <Input
                type={"text"}
                placeholder={label}
                id={name}
                fullWidth
                autoComplete="off"
                {...reg}
                {...props}
            />
            {showError && errors[name] && (
                <FieldError>
                    {(errors[name]?.message as string) ||
                        errors.root?.[name]?.message}
                </FieldError>
            )}
        </fieldset>
    )
}
