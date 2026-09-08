import { displayFieldLabel } from "@/lib/field-labels"
import { cn } from "@/lib/utils"
import { Download } from "lucide-react"
import {
    Controller,
    FieldValues,
    Path,
    PathValue,
    useController,
    UseFormReturn,
} from "react-hook-form"
import { ClassNameValue } from "tailwind-merge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import SeeInView from "../ui/see-in-view"
import FieldError from "./form-error"

export default function FormImagePicker<IForm extends FieldValues>({
    name,
    label,
    disabled,
    methods,
    hideError = false,
    required = false,
    className,
    avatar,
}: ImagePickerProps<IForm>) {
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
    type ValueType = PathValue<IForm, Path<IForm>>
    const val = methods.watch(name)

    return (
        <div className="w-full flex flex-col items-center relative">
            {!val && (
                <label
                    htmlFor={name}
                    className="absolute w-full flex items-center flex-col justify-center  cursor-pointer gap-2 bottom-8 top-0 m-auto"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault()
                        const file = e.dataTransfer.files?.[0]
                        if (file) {
                            methods.setValue(name, file as ValueType)
                        }
                    }}
                >
                    <Input
                        className="w-24 border-0 border-b-2 bg-transparent rounded-b-none"
                        placeholder="CTRL + V"
                        onPaste={(e) => {
                            const items = e.clipboardData.items
                            for (const item of items) {
                                if (item.type.startsWith("image")) {
                                    const file = item.getAsFile()
                                    if (file) {
                                        methods.setValue(
                                            name,
                                            file as ValueType,
                                        )
                                    }
                                }
                            }
                        }}
                        value=""
                    />

                    <Download className="text-muted-foreground" />

                    <input
                        id={name}
                        type="file"
                        className="w-0 h-0 overflow-hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                                methods.setValue(name, file as ValueType)
                            }
                        }}
                    />
                </label>
            )}
            <Controller
                name={name}
                control={methods.control}
                render={() => (
                    <div className="relative">
                        {avatar ?
                            <Avatar className={`scale-150 mb-4 ${className}`}>
                                {field.value && (
                                    <SeeInView
                                        url={
                                            typeof field.value === "string" ?
                                                field.value
                                            :   field.value &&
                                                URL.createObjectURL(field.value)
                                        }
                                    >
                                        <AvatarImage
                                            src={
                                                (
                                                    typeof field.value ===
                                                    "string"
                                                ) ?
                                                    field.value
                                                :   field.value &&
                                                    URL.createObjectURL(
                                                        field.value,
                                                    )
                                            }
                                            alt="Selected Image"
                                            className="object-cover"
                                        />
                                    </SeeInView>
                                )}
                                <AvatarFallback>Img</AvatarFallback>
                            </Avatar>
                        :   <>
                                {field.value ?
                                    <div className="relative">
                                        <SeeInView
                                            url={
                                                (
                                                    typeof field.value ===
                                                    "string"
                                                ) ?
                                                    field.value
                                                :   field.value &&
                                                    URL.createObjectURL(
                                                        field.value,
                                                    )
                                            }
                                        >
                                            <img
                                                src={
                                                    (
                                                        typeof field.value ===
                                                        "string"
                                                    ) ?
                                                        field.value
                                                    :   field.value &&
                                                        URL.createObjectURL(
                                                            field.value,
                                                        )
                                                }
                                                alt="Selected Image"
                                                className={`${className}` || ""}
                                            />
                                        </SeeInView>
                                        <Input
                                            fullWidth
                                            className="w-full"
                                            placeholder="CTRL + V"
                                            onPaste={(e) => {
                                                const items =
                                                    e.clipboardData.items
                                                for (const item of items) {
                                                    if (
                                                        item.type.startsWith(
                                                            "image",
                                                        )
                                                    ) {
                                                        const file =
                                                            item.getAsFile()
                                                        if (file) {
                                                            methods.setValue(
                                                                name,
                                                                file as ValueType,
                                                            )
                                                        }
                                                    }
                                                }
                                            }}
                                            value=""
                                        />
                                    </div>
                                :   <div
                                        className={`${className} bg-secondary`}
                                    />
                                }
                            </>
                        }
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
            {label && (
                <Label
                    htmlFor={name}
                    className={cn(
                        !!error && "text-destructive",
                        "cursor-pointer pt-2  z-50 absolute bottom-5",
                    )}
                >
                    {label}
                </Label>
            )}
            {!hideError && !!error && (
                <FieldError className="absolute bottom-0">
                    {error.message}
                </FieldError>
            )}
        </div>
    )
}

interface ImagePickerProps<IForm extends FieldValues> {
    name: Path<IForm>
    label?: string
    disabled?: boolean
    required?: boolean
    methods: UseFormReturn<IForm>
    hideError?: boolean
    className?: ClassNameValue
    avatar?: boolean
}
