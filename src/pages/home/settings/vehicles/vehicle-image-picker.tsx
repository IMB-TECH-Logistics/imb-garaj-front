import PasteInput from "@/components/form/paste-input"
import SeeInView from "@/components/ui/see-in-view"
import { cn } from "@/lib/utils"
import { ImagePlus, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { DragEvent, useEffect, useMemo, useRef, useState } from "react"
import {
    FieldValues,
    Path,
    PathValue,
    useController,
    UseFormReturn,
} from "react-hook-form"

type Props<IForm extends FieldValues> = {
    name: Path<IForm>
    label: string
    methods: UseFormReturn<IForm>
    clearable?: boolean
    maxSizeMB?: number
}

export default function VehicleImagePicker<IForm extends FieldValues>({
    name,
    label,
    methods,
    clearable = false,
    maxSizeMB,
}: Props<IForm>) {
    const { t } = useTranslation()
    const { field } = useController({ name, control: methods.control })
    const value = field.value as File | string | null | undefined
    const inputRef = useRef<HTMLInputElement>(null)
    const [dragging, setDragging] = useState(false)

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
        if (!file.type.startsWith("image")) {
            toast.error(t("documents_page.only_images"))
            return
        }
        if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
            toast.error(t("documents_page.file_too_large", { mb: maxSizeMB }))
            return
        }
        methods.setValue(name, file as PathValue<IForm, Path<IForm>>)
    }

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setDragging(false)
        setFile(e.dataTransfer.files?.[0])
    }

    const openPicker = () => inputRef.current?.click()

    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{label}</span>
            <PasteInput onFile={setFile} />
            {preview ?
                <div className="relative h-36 w-full">
                    <SeeInView url={preview} fullWidth>
                        <img
                            src={preview}
                            alt={label}
                            className="h-36 w-full cursor-zoom-in rounded-lg border object-cover"
                        />
                    </SeeInView>
                    <div className="absolute bottom-2 right-2 flex gap-1.5">
                        <button
                            type="button"
                            onClick={openPicker}
                            className="rounded-md border bg-background/90 px-2 py-1 text-xs font-medium hover:bg-background"
                        >
                            {t("documents_page.change_photo")}
                        </button>
                        {clearable && (
                            <button
                                type="button"
                                title={t("actions.delete")}
                                onClick={() =>
                                    methods.setValue(
                                        name,
                                        "" as PathValue<IForm, Path<IForm>>,
                                    )
                                }
                                className="rounded-md border bg-background/90 p-1 text-muted-foreground hover:text-red-600"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                </div>
            :   <div
                    role="button"
                    tabIndex={0}
                    onClick={openPicker}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            openPicker()
                        }
                    }}
                    onDragOver={(e) => {
                        e.preventDefault()
                        setDragging(true)
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className={cn(
                        "flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center transition-colors hover:border-primary hover:bg-primary/5 focus-visible:border-primary focus-visible:outline-none",
                        dragging && "border-primary bg-primary/5",
                    )}
                >
                    <ImagePlus className="size-8 text-primary" />
                    <span className="text-sm font-medium">
                        {t("documents_page.upload_click")}
                    </span>
                    <span className="px-2 text-xs text-muted-foreground">
                        {t("documents_page.upload_hint")}
                    </span>
                </div>
            }
            <input
                ref={inputRef}
                id={name}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                    setFile(e.target.files?.[0])
                    e.target.value = ""
                }}
            />
        </div>
    )
}