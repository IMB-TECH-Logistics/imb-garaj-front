import SeeInView from "@/components/ui/see-in-view"
import { cn } from "@/lib/utils"
import { ClipboardPaste, ImagePlus, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { DragEvent, useEffect, useId, useMemo, useRef, useState } from "react"
import {
    FieldValues,
    Path,
    PathValue,
    useController,
    UseFormReturn,
} from "react-hook-form"

type PasteTarget = {
    hovered: boolean
    empty: boolean
    el: HTMLElement | null
    setFile: (file: File) => void
}

const pasteTargets = new Map<string, PasteTarget>()

const imageFromClipboard = (data: DataTransfer | null) => {
    if (!data) return null
    for (const item of data.items) {
        if (item.type.startsWith("image")) return item.getAsFile()
    }
    return null
}

const handleWindowPaste = (e: globalThis.ClipboardEvent) => {
    const file = imageFromClipboard(e.clipboardData)
    if (!file) return
    const targets = [...pasteTargets.values()].filter(
        (x) => x.el && document.body.contains(x.el),
    )
    const ordered = targets.sort((a, b) =>
        a.el!.compareDocumentPosition(b.el!) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    )
    const target = ordered.find((x) => x.hovered) ?? ordered.find((x) => x.empty)
    if (!target) return
    e.preventDefault()
    target.setFile(file)
}

const registerPasteTarget = (id: string, target: PasteTarget) => {
    if (pasteTargets.size === 0) window.addEventListener("paste", handleWindowPaste)
    pasteTargets.set(id, target)
    return () => {
        pasteTargets.delete(id)
        if (pasteTargets.size === 0) window.removeEventListener("paste", handleWindowPaste)
    }
}

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

    const pasteId = useId()
    const wrapperRef = useRef<HTMLDivElement>(null)
    const targetRef = useRef<PasteTarget>({
        hovered: false,
        empty: true,
        el: null,
        setFile: () => {},
    })
    targetRef.current.empty = !value
    targetRef.current.setFile = setFile

    useEffect(() => {
        const target = targetRef.current
        target.el = wrapperRef.current
        return registerPasteTarget(pasteId, target)
    }, [pasteId])

    const pasteFromClipboard = async () => {
        if (!navigator.clipboard?.read) {
            toast.info(t("documents_page.paste_use_keys"))
            return
        }
        try {
            const items = await navigator.clipboard.read()
            for (const item of items) {
                const type = item.types.find((x) => x.startsWith("image"))
                if (type) {
                    const blob = await item.getType(type)
                    setFile(new File([blob], `paste.${type.split("/")[1] || "png"}`, { type }))
                    return
                }
            }
            toast.error(t("documents_page.paste_no_image"))
        } catch {
            toast.info(t("documents_page.paste_use_keys"))
        }
    }

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setDragging(false)
        setFile(e.dataTransfer.files?.[0])
    }

    const openPicker = () => inputRef.current?.click()

    return (
        <div
            ref={wrapperRef}
            className="flex flex-col gap-2"
            onMouseEnter={() => {
                targetRef.current.hovered = true
            }}
            onMouseLeave={() => {
                targetRef.current.hovered = false
            }}
        >
            <span className="text-sm font-medium">{label}</span>
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
                        <button
                            type="button"
                            title={t("documents_page.paste_btn")}
                            onClick={pasteFromClipboard}
                            className="rounded-md border bg-background/90 p-1 text-muted-foreground hover:text-primary"
                        >
                            <ClipboardPaste className="size-4" />
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
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            pasteFromClipboard()
                        }}
                        className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs font-medium hover:border-primary hover:text-primary"
                    >
                        <ClipboardPaste className="size-3.5" />
                        {t("documents_page.paste_btn")}
                    </button>
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