import {
    Controller,
    FieldValues,
    UseFormReturn,
    Path,
    PathValue,
} from "react-hook-form"
import { ClassNameValue } from "tailwind-merge"
import SeeInView from "../ui/see-in-view"
import { Label } from "../ui/label"
import { cn } from "@/lib/utils"
import FieldError from "./form-error"
import PasteInput from "./paste-input"
import { ReactNode } from "react"

export default function FormImagePicker<IForm extends FieldValues>({
    name,
    label,
    disabled,
    methods,
    hideError = true,
    className,
}: ImagePickerProps<IForm>) {
    const {
        control,
        formState: { errors },
    } = methods
    return (
        <div className="w-full flex flex-col items-center gap-3">
            {label && (
                <Label
                    htmlFor={name}
                    className={cn("bg-secondary w-full text-center p-3 rounded-md",
                        !!errors?.[name] && "text-destructive",
                        "cursor-pointer",
                    )}
                >
                    {label}
                </Label>
            )}
            {!disabled && (
                <PasteInput
                    onFile={(file) =>
                        methods.setValue(name, file as PathValue<IForm, Path<IForm>>)
                    }
                />
            )}
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <div className="relative">
                        <>
                            {field.value ? (
                                <SeeInView
                                className={"max-h-[40vh] w-full object-cover"}
                                    url={
                                        typeof field.value === "string"
                                            ? field.value
                                            : field.value &&
                                              URL.createObjectURL(field.value)
                                    }
                                />
                            ) : (
                                <div
                                    className={`${className} bg-secondary`}
                                ></div>
                            )}
                        </>
                        <input
                            type="file"
                            id={name}
                            accept="image/*"
                            disabled={disabled}
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                    field.onChange(file)
                                }
                            }}
                            hidden
                        />
                    </div>
                )}
            />
            {!hideError && control._formState.errors?.[name] && (
                <FieldError>
                    {control._formState.errors[name]?.message as string}
                </FieldError>
            )}
        </div>
    )
}

interface ImagePickerProps<IForm extends FieldValues> {
    name: Path<IForm>
    label?: string | ReactNode
    disabled?: boolean
    required?: boolean
    methods: UseFormReturn<IForm>
    hideError?: boolean
    className?: ClassNameValue
    avatar?: boolean
}
