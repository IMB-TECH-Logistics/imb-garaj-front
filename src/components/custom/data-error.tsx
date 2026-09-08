import { cn } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"

/**
 * Ma'lumot yuklanmagan holat.
 *
 * Nega kerak: ilgari so'rov xato bergan sahifalar (masalan 404) foydalanuvchiga
 * bo'sh jadval yoki "Ma'lumot topilmadi" ko'rsatardi — bu YOLG'ON, chunki
 * "ma'lumot yo'q" bilan "so'rov umuman ishlamadi" bir xil narsa emas.
 * Bu komponent farqni ochiq aytadi.
 */

const getStatus = (error: unknown): number | undefined => {
    const status = (error as { response?: { status?: number } })?.response
        ?.status
    return typeof status === "number" ? status : undefined
}

export const describeError = (error: unknown): string => {
    const status = getStatus(error)

    if (status === 404) {
        return "So'ralgan manzil serverda topilmadi (404). Bu ma'lumot yo'qligini emas, sahifa serverga ulanmaganini bildiradi."
    }
    if (status === 403) {
        return "Bu ma'lumotni ko'rish uchun ruxsatingiz yo'q (403)."
    }
    if (status === 401) {
        return "Sessiya tugagan (401). Qaytadan kiring."
    }
    if (status && status >= 500) {
        return `Serverda xatolik yuz berdi (${status}). Keyinroq qayta urinib ko'ring.`
    }
    if (status) {
        return `So'rov bajarilmadi (${status}).`
    }
    return "Serverga ulanib bo'lmadi. Internet aloqasi yoki server holatini tekshiring."
}

export default function DataError({
    error,
    title = "Ma'lumot yuklanmadi",
    height = "h-[40vh]",
    className,
}: {
    error?: unknown
    title?: string
    height?: string
    className?: string
}) {
    return (
        <div
            role="alert"
            data-testid="data-error"
            className={cn(
                "w-full flex items-center justify-center flex-col gap-2 text-center px-4",
                height,
                className,
            )}
        >
            <AlertTriangle size={44} className="text-destructive" />
            <p className="font-medium">{title}</p>
            <p className="text-sm text-foreground/60 max-w-md">
                {describeError(error)}
            </p>
        </div>
    )
}
