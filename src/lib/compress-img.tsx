import imageCompression, { Options } from "browser-image-compression"
import { toast } from "sonner"

const COMPRESS_TIMEOUT_MS = 15000

const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
    new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("timeout")), ms)
        promise.then(
            (value) => {
                clearTimeout(timer)
                resolve(value)
            },
            (error) => {
                clearTimeout(timer)
                reject(error)
            },
        )
    })

const toFile = (blob: Blob, source: File) => {
    const type = blob.type || "image/jpeg"
    const ext = (type.split("/")[1] || "jpg").replace("jpeg", "jpg")
    const base = (source.name || "image").replace(/\.[^.]+$/, "")
    return new File([blob], `${base}.${ext}`, { type, lastModified: Date.now() })
}

export default async function compressImg(file: File, opts?: Options) {
    const options: Options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        ...opts,
    }

    try {
        return toFile(await withTimeout(imageCompression(file, options), COMPRESS_TIMEOUT_MS), file)
    } catch {
        try {
            return toFile(
                await withTimeout(
                    imageCompression(file, { ...options, useWebWorker: false }),
                    COMPRESS_TIMEOUT_MS,
                ),
                file,
            )
        } catch {
            if (file.size <= 10 * 1024 * 1024) return file
            toast.error(
                "Rasm hajmini kichraytirishda muammo yuzaga keldi. Qayta urinib ko'ring yoki kichkina hajmli rasm yuklang!",
            )
        }
    }
}
