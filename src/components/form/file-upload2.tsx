import { Control, FieldValues, Path, useController } from "react-hook-form"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { FileUploader } from "react-drag-drop-files"
import Spinner from "../ui/spinner"
import PasteInput from "./paste-input"
import FieldLabel from "./form-label"
import FieldError from "./form-error"
import compressImg from "@/lib/compress-img"
import { Button } from "../ui/button"
import { X } from "lucide-react"

type TProps<Form extends FieldValues> = {
    control: Control<Form>
    name: Path<Form>
    label?: string
    required?: boolean
    wrapperClassName?: string
    multiple?: boolean
    isCompressed?: boolean
    maxLength?: number
    maxSize?: number
    isPaste?: boolean
    dropAccept?: string[]
    hideError?: boolean
}

type FileType<Multiple extends boolean> =
    Multiple extends true ? FileList : File | null

export default function FileUpload2<TForm extends FieldValues>({
    control,
    name,
    label,
    required = false,
    wrapperClassName,
    multiple = false,
    isCompressed = true,
    maxSize = 10,
    maxLength = 5,
    dropAccept = ["JPG", "PNG", "JPEG"],
    isPaste = true,
    hideError = true,
}: TProps<TForm>) {
    const maxS = maxSize * 1024 * 1024
    const [isCompressing, setIsCompressing] = useState(false)
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

                if (required && (!val || (multiple && val.length === 0))) {
                    err = "Ushbu maydon majburiy"
                    valid = false
                }

                if (multiple && val) {
                    const totalSize = val?.reduce(
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
                                : `Rasmlar hajmi ${maxSize} MB dan oshib ketdi`
                        valid = false
                    }
                }

                if (!multiple && val && val.size > maxS) {
                    err =
                        isCompressed ?
                            `Kompressdan keyin rasm hajmi ${maxSize} MB dan oshib ketdi`
                            : `Rasm hajmi ${maxSize} MB dan oshib ketdi`
                    valid = false
                }

                return valid || err
            },
        },
    })

    const fileArray: File[] =
        !multiple ?
            value ? [value]
                : []
            : value

    async function handleOnChange(files: File[]) {
        if (files.length > 0) {
            if (isCompressed) {
                setIsCompressing(true)
                const compressedFiles = await Promise.all(
                    files.map((item) => compressImg(item)),
                )
                setIsCompressing(false)
                onChange(
                    multiple ?
                        [...compressedFiles, ...fileArray]
                        : compressedFiles[0],
                )
            } else {
                onChange(multiple ? [...files, ...fileArray] : files[0])
            }
        }
    }

    function openFile(file: File) {
        if (typeof file === 'string') {
            const url = window.URL.createObjectURL(file)
            return url
        } else {
            return ''
        }
    }

    return (
        <fieldset
            className={cn(
                "flex flex-col min-w-48 w-full",
                wrapperClassName,
            )}
        >
            {label && (
                <FieldLabel isError={!!fieldState.error} required={required}>
                    {label}
                </FieldLabel>
            )}
            {isPaste && (
                <PasteInput
                    onFile={(file) => handleOnChange([file])}
                    disabled={field.disabled}
                />
            )}
            <FileUploader
                classes={cn(
                    "!h-16 !border-primary w-full max-w-full flex items-center gap-3 [&_path]:!fill-primary [&_div]:flex-col [&_div]:!justify-center bg-primary/5 [&_div]:items-center [&_div]:!grow-0",
                    !!fieldState.error &&
                    "!border-destructive [&_path]:!fill-destructive",
                    field.disabled &&
                    "!border-muted-foreground [&_path]:!fill-muted-foreground pointer-events-none cursor-not-allowed",
                )}
                handleChange={
                    field.disabled ? undefined : (
                        (val: FileType<typeof multiple>) => {
                            if (multiple) {
                                handleOnChange(
                                    Array.from((val as FileList) || []),
                                )
                            } else {
                                handleOnChange([val as File])
                            }
                        }
                    )
                }
                multiple={multiple}
                name={field.name}
                types={dropAccept}
            />

            {fieldState.error && !hideError && (
                <FieldError>{fieldState.error?.message}</FieldError>
            )}
            <div>
                {fileArray.map((file, index) => {
                    return (
                        <main
                            key={index}
                            className="flex items-center justify-between gap-4"
                        >
                            <a
                                className="text-blue-500 inline-block truncate"
                                target="_blank"
                                href={openFile(file)}
                                rel="noreferrer noopener"
                            >
                                {file.name}
                            </a>
                            <Button
                                type="button"
                                variant="ghost"
                                className="!text-destructive"
                                icon={<X width={18} />}
                                onClick={() => {
                                    const updatedFiles = fileArray.filter(
                                        (item) => item !== file,
                                    )
                                    onChange(updatedFiles);
                                }}
                                disabled={field.disabled}
                            />
                        </main>
                    )
                })}
            </div>

            <article className={fileArray?.length ? "spt-4" : ""}>
                {isCompressing && (
                    <div className="grid place-items-center pb-3">
                        <Spinner />
                    </div>
                )}
            </article>
        </fieldset>
    )
}
