import FieldError from "@/components/form/form-error"
import { Input } from "@/components/ui/input"
import SeeInView from "@/components/ui/see-in-view"
import { cn } from "@/lib/utils"
import { Download } from "lucide-react"
import { ClipboardEvent, DragEvent, useEffect, useMemo } from "react"
import {
    FieldValues,
    Path,
    PathValue,
    useController,
    UseFormReturn,
} from "react-hook-form"

const MAX_IMAGE_MB = 10

type Props<IForm extends FieldValues> = {
    name: Path<IForm>
    label: string
    methods: UseFormReturn<IForm>
}

export default function VehicleImagePicker<IForm extends FieldValues>({
    name,
    label,
    methods,
}: Props<IForm>) {
    const { field, fieldState } = useController({ name, control: methods.control })
    const value = field.value as File | string | null | undefined

    const preview = useMemo(() => {
        if (!value) return null
        return typeof value === "string" ? value : URL.createObjectURL(value)
    }, [value])

    useEffect(() => {
        return () => {
            if (preview && typeof value !== "string") URL.revokeObjectURL(preview)
        }
    }, [preview, value])

    const setFile = (file?: File | null) => {
        if (!file) return
        if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
            methods.setError(name, {
                type: "validate",
                message: `Rasm hajmi ${MAX_IMAGE_MB} MB dan oshmasligi kerak (tanlangan: ${(file.size / 1024 / 1024).toFixed(1)} MB).`,
            })
            return
        }
        methods.clearErrors(name)
        methods.setValue(name, file as PathValue<IForm, Path<IForm>>)
    }

    const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
        for (const item of e.clipboardData.items) {
            if (item.type.startsWith("image")) setFile(item.getAsFile())
        }
    }

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setFile(e.dataTransfer.files?.[0])
    }

    return (
        <div
            className={cn(
                "flex flex-col items-center gap-3 rounded-lg border p-4",
                fieldState.error && "border-destructive",
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
        >
            {preview ?
                <SeeInView url={preview}>
                    <img
                        src={preview}
                        alt={label}
                        className="h-16 w-full rounded-md border object-cover"
                    />
                </SeeInView>
            :   <Input
                    fullWidth
                    className="h-16 w-full bg-transparent"
                    placeholder="CTRL + V"
                    onPaste={onPaste}
                    value=""
                    onChange={() => {}}
                />
            }
            <label
                htmlFor={name}
                className="cursor-pointer text-muted-foreground hover:text-foreground"
            >
                <Download className="size-5" />
            </label>
            <input
                id={name}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setFile(e.target.files?.[0])}
            />
            <label
                htmlFor={name}
                className={cn("cursor-pointer text-center text-sm font-medium")}
            >
                {label}
            </label>
            {fieldState.error?.message && (
                <FieldError>{fieldState.error.message}</FieldError>
            )}
        </div>
    )
}
