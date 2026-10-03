import compressImg from "@/lib/compress-img"
import { cn } from "@/lib/utils"
import { Upload, X } from "lucide-react"
import { useState } from "react"
import Dropzone, { type DropzoneProps } from "react-dropzone"
import {
    Control,
    FieldValues,
    Path,
    useController,
    useFieldArray,
    useWatch,
} from "react-hook-form"
import Image from "../custom/image"
import { Button } from "../ui/button"
import Spinner from "../ui/spinner"
import PasteInput from "./paste-input"
import FieldError from "./form-error"
import FieldLabel from "./form-label"

type TProps<Form extends FieldValues> = {
    control: Control<Form> // Control object from react-hook-form
    name: Path<Form> // Name of the form field
    label?: string // Optional label for the field
    required?: boolean // Optional boolean to mark the field as required
    wrapperClassName?: string // Optional class name for the wrapper element
    multiple?: boolean
    isCompressed?: boolean
    maxLength?: number
    maxSize?: number //MB
    isPaste?: boolean
    filesData?: { id: number; url: string }[]
    deletedIdsKey?: string
    dropzoneProps?: DropzoneProps
    isOnlyImages?: boolean
}

export default function UploadFile<TForm extends FieldValues>({
    control,
    name,
    label,
    required = false,
    wrapperClassName,
    multiple = false,
    isCompressed = true,
    maxSize = 10, //MB
    maxLength = 5,
    isPaste = true,
    filesData = [],
    deletedIdsKey = "deleted_ids",
    dropzoneProps = {
        accept: {
            "image/*": [],
        },
    },
    isOnlyImages = true,
}: TProps<TForm>) {
    const maxS = maxSize * 1024 * 1024
    const [isCompressing, setIsCompressing] = useState(false)
    const [err, setErr] = useState("")

    const { append, replace } = useFieldArray({
        control,
        // @ts-expect-error sdf
        name: deletedIdsKey,
        keyName: "key",
    })
    const watchedDeletedIds = useWatch({
        control,
        name: deletedIdsKey,
        // @ts-expect-error sdf
        defaultValue: [],
    })
    const existingFiles = filesData.filter(
        (f) => !watchedDeletedIds.includes(f.id),
    )

    const {
        field: { value, onChange, ...field },
        fieldState,
    } = useController({
        control,
        name,
        // @ts-expect-error defsdf
        defaultValue: multiple ? [] : undefined,
        rules: {
            validate: (val) => {
                let err = ""
                let valid = true

                // Check if the field is required
                if (required) {
                    if (multiple && (!val || val.length === 0)) {
                        err = "Fayl yuklash majburiy"
                        valid = false
                    }

                    if (
                        !multiple &&
                        (!val || val === null || val === undefined)
                    ) {
                        err = "Fayl yuklash majburiy"
                        valid = false
                    }
                }

                // Validation for multiple files
                if (multiple && val) {
                    const totalSize = val.reduce(
                        (prev: number, current: File) =>
                            prev + (current?.size || 0),
                        0,
                    )

                    if (val.length > maxLength) {
                        err = `Maksimum ${maxLength} ta fayl yuklash mumkin`
                        valid = false
                    }

                    if (totalSize > maxS) {
                        err =
                            isCompressed ?
                                `Kompressdan keyin rasmlar hajmi ${maxSize} MB dan oshib ketdi`
                            :   `Rasmlar hajmi ${maxSize} MB dan oshib ketdi`
                        valid = false
                    }
                }

                // Validation for a single file
                if (!multiple && val) {
                    if (val.size > maxS) {
                        err =
                            isCompressed ?
                                `Kompressdan keyin rasm hajmi ${maxSize} MB dan oshib ketdi`
                            :   `Rasm hajmi ${maxSize} MB dan oshib ketdi`
                        valid = false
                    }
                }

                return valid || err
            },
        },
    })

    const fileArray: File[] =
        !multiple ?
            value ? [value]
            :   []
        :   value

    async function handleOnChange(files: File[]) {
        if (files.length > 0) {
            if (isOnlyImages && isCompressed) {
                setIsCompressing(true)
                // Use Promise.all to wait for all the compression promises to resolve
                const compressedFiles = await Promise.all(
                    files.map(async (item) => {
                        const compressedImg = await compressImg(item)
                        return compressedImg
                    }),
                )
                setIsCompressing(false)
                onChange(
                    multiple ?
                        [...compressedFiles, ...fileArray]
                    :   compressedFiles[0],
                )
            } else {
                onChange(multiple ? [...files, ...fileArray] : files[0])
            }
        }
    }

    function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
        setErr("")
        if (e.clipboardData.files.length) {
            const fileObject = e.clipboardData.files[0]
            if (isOnlyImages) {
                if (fileObject.type.startsWith("image/")) {
                    handleOnChange([fileObject])
                } else {
                    setErr("Faqat rasm yuklashingiz mumkin")
                }
            } else {
                handleOnChange([fileObject])
            }
        }
    }

    return (
        <main
            className={cn(
                "flex flex-col gap-1.5 min-w-48 w-full",
                wrapperClassName,
            )}
        >
            <fieldset className="mb-2">
                {label && (
                    <FieldLabel
                        htmlFor={name}
                        required={!!required}
                        isError={!!control._formState.errors?.[name]}
                    >
                        {label}
                    </FieldLabel>
                )}

                {isPaste && isOnlyImages && (
                    <PasteInput
                        onFile={(file) => handleOnChange([file])}
                        disabled={field.disabled}
                    />
                )}

                {isPaste && !isOnlyImages && (
                    <input
                        {...field}
                        defaultValue={""}
                        onPaste={onPaste}
                        tabIndex={0}
                        className={cn(
                            "flex mt-1 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                        placeholder="(CTRL+V)"
                    />
                )}

                {err && <FieldError>{err}</FieldError>}
            </fieldset>

            <fieldset className="flex flex-col gap-1.5">
                <Dropzone
                    onDrop={(files) => {
                        handleOnChange(files)
                    }}
                    multiple={multiple}
                    // maxSize={maxS}
                    // maxFiles={maxLength}
                    disabled={field.disabled}
                    {...dropzoneProps}
                >
                    {({ getRootProps, getInputProps }) => (
                        <div
                            className="cursor-pointer rounded border-dashed border-2 border-primary h-40 flex flex-col items-center justify-center gap-2"
                            {...getRootProps()}
                        >
                            <input {...getInputProps()} />
                            <p className="px-4 flex flex-wrap items-center justify-center text-center gap-2 text-xs">
                                <Upload className="text-primary" />
                                Drag 'n' drop some files here, or click to
                                select files
                            </p>
                            {/* <article className="text-xs">
                                <p>
                                    Max size: <b>{maxSize} MB</b>
                                </p>
                                <p>
                                    Max files: <b>{maxLength}</b>
                                </p>
                            </article> */}
                        </div>
                    )}
                </Dropzone>
                {fieldState.error && (
                    <FieldError>{fieldState.error?.message}</FieldError>
                )}
            </fieldset>

            {(fileArray.length > 0 || existingFiles.length > 0) && (
                <main className="mt-4">
                    {isOnlyImages ?
                        <article>
                            {isCompressing && (
                                <div className="grid place-items-center mb-5">
                                    <Spinner />
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                {fileArray?.map((file, index) => {
                                    if (!(file instanceof File)) {
                                        // console.error("Invalid file object:", file)
                                        return null
                                    }
                                    const url = URL.createObjectURL(file)

                                    return (
                                        <main
                                            key={file.lastModified}
                                            className="relative"
                                        >
                                            <a
                                                target="_blank"
                                                href={url}
                                                rel="noreferrer noopener"
                                            >
                                                <Image
                                                    src={url}
                                                    alt={file.name}
                                                    className="aspect-[4/3] object-cover h-full w-full rounded-md shadow"
                                                />
                                            </a>

                                            <Button
                                                type="button"
                                                size={"icon"}
                                                variant={"destructive"}
                                                className="absolute -top-2 -right-2 rounded-full w-5 h-5"
                                                icon={<X width={18} />}
                                                onClick={() =>
                                                    onChange(
                                                        fileArray.filter(
                                                            (_, i) =>
                                                                i !== index,
                                                        ),
                                                    )
                                                }
                                                disabled={field.disabled}
                                            />
                                        </main>
                                    )
                                })}

                                {existingFiles.map((file) => {
                                    return (
                                        <main
                                            key={file.id}
                                            className="relative"
                                        >
                                            <a
                                                target="_blank"
                                                href={file.url}
                                                rel="noreferrer noopener"
                                            >
                                                <Image
                                                    src={file.url}
                                                    alt={file.url}
                                                    className="aspect-[4/3] object-cover h-full w-full rounded-md shadow"
                                                />
                                            </a>
                                            <Button
                                                type="button"
                                                size={"icon"}
                                                variant={"destructive"}
                                                className="absolute -top-2 -right-2 rounded-full w-5 h-5"
                                                icon={<X width={18} />}
                                                onClick={() => {
                                                    // @ts-expect-error i don't need objects for this situation
                                                    append(file.id)
                                                }}
                                                disabled={field.disabled}
                                            />
                                        </main>
                                    )
                                })}
                            </div>
                        </article>
                    :   <article>
                            {fileArray?.map((file, index) => {
                                if (!(file instanceof File)) {
                                    // console.error("Invalid file object:", file)
                                    return null
                                }

                                const url = URL.createObjectURL(file)
                                return (
                                    <main
                                        key={file.lastModified}
                                        className="flex items-center justify-between gap-4"
                                    >
                                        <a
                                            className="text-blue-500 inline-block truncate"
                                            target="_blank"
                                            href={url}
                                            rel="noreferrer noopener"
                                        >
                                            {file.name}
                                        </a>

                                        <div>
                                            <Button
                                                type="button"
                                                size={"icon"}
                                                variant={"ghost"}
                                                className="!text-destructive"
                                                icon={<X width={18} />}
                                                onClick={() =>
                                                    onChange(
                                                        fileArray.filter(
                                                            (_, i) =>
                                                                i !== index,
                                                        ),
                                                    )
                                                }
                                                disabled={field.disabled}
                                            />
                                        </div>
                                    </main>
                                )
                            })}
                            {existingFiles.map((file) => {
                                return (
                                    <main
                                        key={file.id}
                                        className="flex items-center justify-between gap-4"
                                    >
                                        <a
                                            className="text-blue-500 inline-block truncate"
                                            target="_blank"
                                            href={file.url}
                                            rel="noreferrer noopener"
                                        >
                                            {file.url}
                                        </a>

                                        <div>
                                            <Button
                                                type="button"
                                                size={"icon"}
                                                variant={"ghost"}
                                                className="!text-destructive"
                                                icon={<X width={18} />}
                                                onClick={() => {
                                                    // @ts-expect-error i don't need objects for this situation
                                                    append(file.id)
                                                }}
                                                disabled={field.disabled}
                                            />
                                        </div>
                                    </main>
                                )
                            })}
                        </article>
                    }
                    {(fileArray.length > 0 || filesData.length > 0) && (
                        <div className="grid place-items-end mt-4">
                            <Button
                                variant={"destructive"}
                                type="button"
                                onClick={() => {
                                    onChange([])
                                    // @ts-expect-error sdf
                                    replace(filesData.map((f) => f.id))
                                }}
                            >
                                Tozalash
                            </Button>
                        </div>
                    )}
                </main>
            )}
        </main>
    )
}
