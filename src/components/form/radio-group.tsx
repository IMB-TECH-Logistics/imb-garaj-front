import { displayFieldLabel } from "@/lib/field-labels"
import { cn } from "@/lib/utils"
import { ReactNode, useMemo } from "react"
import {
    Controller,
    FieldValues,
    Path,
    useController,
    UseFormReturn,
} from "react-hook-form"
import { ClassNameValue } from "tailwind-merge"
import { Label } from "../ui/label"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import FieldError from "./form-error"

interface SelectOption {
    name: string | number
    id: string | number
    content?: ReactNode
}

interface IProps<IForm extends FieldValues> {
    methods: UseFormReturn<IForm>
    name: Path<IForm>
    options: SelectOption[]
    label?: string
    className?: ClassNameValue
    hideError?: boolean
    returnValue?: "name" | "id"
    disabled?: boolean
    required?: boolean
    itemClassName?: string
}
export default function FormRadioGroup<IForm extends FieldValues>({
    name,
    disabled,
    methods,
    hideError = true,
    required = false,
    options,
    className,
    label,
    returnValue = "id",
    itemClassName,
}: IProps<IForm>) {
    const {
        field,
        fieldState: { error },
    } = useController({
        name,
        control: methods.control,
        rules: {
            required: {
                value: required,
                message: `${displayFieldLabel(name, label)}ni tanlang`,
            },
        },
    })

    const lastReturnValue = useMemo(
        () => returnValue || (options?.[0]?.id ? "id" : "name"),
        [returnValue, options],
    )

    return (
        <fieldset className="space-y-1">
            {label && (
                <Label
                    htmlFor={name}
                    className={cn(
                        !!error && "text-red-600",
                        "cursor-pointer",
                    )}
                >
                    {label}
                </Label>
            )}
            <Controller
                name={name}
                control={methods.control}
                render={() => (
                    <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={disabled || field.disabled}
                        className={`${className}`}
                    >
                        {options?.map((option) => (
                            <div className="space-y-3" key={option.id}>
                                <div className="flex f items-center space-x-2  ">
                                    <RadioGroupItem
                                        id={option?.[
                                            lastReturnValue
                                        ]?.toString()}
                                        value={option?.[
                                            lastReturnValue
                                        ]?.toString()}
                                    />
                                    <Label
                                        htmlFor={option?.[
                                            lastReturnValue
                                        ]?.toString()}
                                        className={cn(
                                            !!error && "text-red-600",
                                            "cursor-pointer",
                                            itemClassName,
                                        )}
                                    >
                                        {option.name}
                                    </Label>
                                </div>
                                {option?.content ? option?.content : null}
                            </div>
                        ))}
                    </RadioGroup>
                )}
            />
            {!hideError && !!error && <FieldError>{error.message}</FieldError>}
        </fieldset>
    )
}
