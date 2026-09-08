import { displayFieldLabel } from "@/lib/field-labels"
import {
    Controller,
    FieldValues,
    Path,
    useController,
    UseFormReturn,
} from "react-hook-form";
import { ClassNameValue } from "tailwind-merge";
import { Label } from "../ui/label";
import FieldError from "./form-error";

export default function FormVideoPicker<IForm extends FieldValues>({
    name,
    label,
    disabled,
    methods,
    hideError = false,
    required = false,
    className,
}: VideoPickerProps<IForm>) {
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
    });

    return (
        <div className="w-full flex flex-col items-center">
            <Controller
                name={name}
                control={methods.control}
                render={() => (
                    <div className="relative w-full">
                        {field.value ? (
                            <video
                                controls
                                src={
                                    typeof field.value === "string"
                                        ? field.value
                                        : field.value &&
                                          URL.createObjectURL(field.value)
                                }
                                className={`${className}` || ""}
                            >
                                Your browser does not support the video tag.
                            </video>
                        ) : (
                            <Label
                                htmlFor={name}
                                className={`${className} bg-secondary h-40 w-full flex items-center justify-center cursor-pointer`}
                            >
                                {label}
                            </Label>
                        )}
                        <input
                            type="file"
                            id={name}
                            accept="video/*"
                            disabled={disabled}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    field.onChange(file);
                                }
                            }}
                            hidden
                        />
                    </div>
                )}
            />
            {!hideError && !!error && <FieldError>{error.message}</FieldError>}
        </div>
    );
}

interface VideoPickerProps<IForm extends FieldValues> {
    name: Path<IForm>;
    label?: string;
    disabled?: boolean;
    required?: boolean;
    methods: UseFormReturn<IForm>;
    hideError?: boolean;
    className?: ClassNameValue;
}
