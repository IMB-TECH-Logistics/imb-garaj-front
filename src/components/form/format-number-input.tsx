import {
    Control,
    FieldValues,
    Path,
    RegisterOptions,
    useController,
} from "react-hook-form";
import { cn } from "@/lib/utils";
import { displayFieldLabel } from "@/lib/field-labels";
import { PatternFormat, PatternFormatProps } from "react-number-format";
import FieldLabel from "./form-label";
import FieldError from "./form-error";

interface IProps<IForm extends FieldValues> {
    control: Control<IForm>;
    name: Path<IForm>;
    label?: string;
    required?: boolean;
    registerOptions?: RegisterOptions<IForm>;
    formatOptions?: Intl.NumberFormatOptions;
    wrapperClassName?: string;
    decimalSeparator?: string;
    thousandSeparator?: string;
    hideError?: boolean;
    format?: string;
}

export function FormFormatNumberInput<IForm extends FieldValues>({
    control,
    name,
    label,
    required = false,
    registerOptions,
    wrapperClassName,
    className,
    formatOptions,
    hideError = false,
    format = "",
    ...props
}: IProps<IForm> & PatternFormatProps) {
    const {
        field: { onChange, ref, ...field },
        fieldState,
    } = useController({
        name,
        control,
        /**
         * FE2-05f: majburiylik xabari qat'iy "Ushbu maydon majburiy" edi va
         * maydon nomini aytmasdi — qolgan barcha maydonlar esa
         * "<Nomi>ni kiriting" ko'rinishida gapiradi. Endi bu komponent ham
         * umumiy yorliqlar jadvalidan (`displayFieldLabel`) foydalanadi va
         * chaqiruvchi bergan `registerOptions` ham hisobga olinadi
         * (ilgari butunlay e'tiborsiz qolardi).
         */
        rules: {
            required:
                required ?
                    `${displayFieldLabel(name, label)}ni kiriting`
                :   false,
            ...(registerOptions as Record<string, unknown>),
        },
    });

    return (
        <fieldset className={cn("flex flex-col w-full", wrapperClassName)}>
            {label && (
                <FieldLabel
                    htmlFor={name}
                    required={required}
                    isError={!!fieldState.error}
                >
                    {label}
                </FieldLabel>
            )}
            <label className="relative flex items-center">
                <PatternFormat
                    format={format}
                    id={name}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                        className,
                        fieldState.error &&
                            "!border-destructive focus:border-border !ring-destructive"
                    )}
                    onValueChange={(val) => {
                        onChange(val.value);
                    }}
                    allowEmptyFormatting
                    getInputRef={ref}
                    {...field}
                    {...props}
                    placeholder={props.placeholder || label}
                    disabled={field.disabled || props.disabled}
                />
            </label>
            {fieldState.error && !hideError && (
                <FieldError>{fieldState.error?.message}</FieldError>
            )}
        </fieldset>
    );
}
