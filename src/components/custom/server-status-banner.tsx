import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, RefreshCw, X } from "lucide-react"
import * as React from "react"

/**
 * Server bilan aloqa holatini butun ilova bo'ylab ko'rsatuvchi qatlam.
 *
 * NEGA KERAK (raund-2, `isError` bandi — eng ta'sirlisi):
 * so'rov yiqilganda ko'p sahifa `data ?? 0` yozadi va foydalanuvchiga
 * **HAQIQAT** sifatida nol ko'rsatadi. Eng zararlisi pul sahifalari:
 * backend o'chganda `/kassa` "Asosiy Balans 0 so'm", "Kirim 0 / Chiqim 0"
 * chizardi — haqiqiy balans esa −867 138 765.04 va 1719 ta yozuv edi.
 * Menejer bu nollarni ishonchli ma'lumot deb o'qishi mumkin.
 *
 * Har bir sahifani alohida tuzatish o'rniga holat shu yerda, bitta joyda
 * aniqlanadi: komponent react-query keshidagi FAOL so'rovlarni kuzatadi.
 *
 *   • hamma faol so'rov yiqilgan (va hech biri muvaffaqiyatli emas)
 *     → butun sahifani yopadigan qatlam: yolg'on raqamlar ko'rinmaydi
 *   • faqat ba'zilari yiqilgan
 *     → yuqorida ogohlantirish tasmasi: raqamlar to'liq emas
 *
 * 401/403 hisobga olinmaydi — bu "server o'chgan" emas, "ruxsat yo'q";
 * chiqish/sessiya tugash oqimida bekorga chiqmasligi uchun.
 */

const statusOf = (error: unknown): number | undefined => {
    const s = (error as { response?: { status?: number } })?.response?.status
    return typeof s === "number" ? s : undefined
}

/** Server o'chgan / javob bermayapti (tarmoq uzilishi yoki 5xx). */
const isServerDownError = (error: unknown) => {
    const status = statusOf(error)
    if (status === undefined) return true // javob umuman kelmadi
    return status >= 500
}

/**
 * Bu xato ILOVA DARAJASIDA ogohlantirishga arziydimi?
 *
 * Yo'q bo'lganlar:
 *   401/403 — "server o'chgan" emas, "ruxsat yo'q"; chiqish yoki sessiya
 *             tugash oqimida bekorga chiqmasin.
 *   404     — aniq bitta manzil topilmadi (masalan diapazondan tashqari
 *             sahifa). Buni jadvalning o'zi joyida tushuntiradi, tepadan
 *             yana takrorlash faqat shovqin bo'lardi.
 */
const isReportable = (error: unknown) => {
    const status = statusOf(error)
    return status !== 401 && status !== 403 && status !== 404
}

type Snapshot = { failing: number; succeeded: number; down: number }

const EMPTY: Snapshot = { failing: 0, succeeded: 0, down: 0 }

export default function ServerStatusBanner() {
    const queryClient = useQueryClient()
    const [snapshot, setSnapshot] = React.useState<Snapshot>(EMPTY)
    const [overlayDismissed, setOverlayDismissed] = React.useState(false)
    const [bannerDismissed, setBannerDismissed] = React.useState(false)
    const [retrying, setRetrying] = React.useState(false)

    React.useEffect(() => {
        const cache = queryClient.getQueryCache()

        const read = () => {
            const active = cache
                .getAll()
                .filter((q) => q.getObserversCount() > 0)

            const failing = active.filter(
                (q) =>
                    q.state.status === "error" && isReportable(q.state.error),
            )
            const succeeded = active.filter((q) => q.state.status === "success")
            const down = failing.filter((q) => isServerDownError(q.state.error))

            const next: Snapshot = {
                failing: failing.length,
                succeeded: succeeded.length,
                down: down.length,
            }

            setSnapshot((prev) =>
                prev.failing === next.failing &&
                prev.succeeded === next.succeeded &&
                prev.down === next.down
                    ? prev
                    : next,
            )
        }

        read()
        return cache.subscribe(read)
    }, [queryClient])

    // Aloqa tiklanganda ogohlantirish o'zi yo'qoladi va "yopdim" holati
    // qayta tiklanadi — keyingi uzilishda banner yana ko'rinsin.
    React.useEffect(() => {
        if (snapshot.failing === 0) {
            setOverlayDismissed(false)
            setBannerDismissed(false)
            setRetrying(false)
        }
    }, [snapshot.failing])

    const retry = async () => {
        setRetrying(true)
        try {
            await queryClient.refetchQueries({ type: "active" })
        } finally {
            setRetrying(false)
        }
    }

    if (snapshot.failing === 0) return null

    /**
     * "Server o'chgan" deb qachon hisoblanadi.
     *
     * Shart ataylab ikki qismli:
     *   • kamida IKKI so'rov tarmoq/5xx sababli yiqilgan — bitta yiqilgan
     *     ochiluvchi ro'yxat uchun butun ekranni yopish noto'g'ri bo'lardi;
     *   • yiqilganlar soni muvaffaqiyatlilardan kam emas — ya'ni sahifa
     *     ma'lumotining KO'P QISMI yo'q.
     *
     * Ikkinchi shart aynan auditdagi holat uchun: `/kassa` da ilova
     * qobig'ining `profile` so'rovi keshdan muvaffaqiyatli keladi, lekin
     * sahifaning 4 ta pul so'rovi yiqiladi — kartalar esa "0 so'm" chizadi.
     * "hech biri muvaffaqiyatli emas" deb tekshirilganda bu holat
     * o'tkazib yuborilardi.
     */
    const serverDown =
        snapshot.down >= 2 &&
        snapshot.down >= snapshot.succeeded &&
        !overlayDismissed

    if (serverDown) {
        return (
            <div
                role="alert"
                data-testid="server-down-overlay"
                className="fixed inset-0 z-[200] flex items-center justify-center bg-background/95 backdrop-blur-sm p-6"
            >
                <div className="max-w-lg text-center flex flex-col items-center gap-3">
                    <AlertTriangle size={52} className="text-destructive" />
                    <h2 className="text-xl font-semibold">
                        Server bilan aloqa yo'q
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Ma'lumotlar yuklanmadi. Ekranda ko'rinib turgan
                        raqamlar — balans, kirim va chiqim — HAQIQIY EMAS,
                        ularga ishonmang. Aloqa tiklangach sahifa o'zi
                        yangilanadi.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                        <Button
                            onClick={retry}
                            loading={retrying}
                            icon={<RefreshCw size={16} />}
                        >
                            Qayta urinish
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setOverlayDismissed(true)}
                        >
                            Baribir ko'rsat
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    if (bannerDismissed) return null

    return (
        <div
            role="status"
            data-testid="server-status-banner"
            /*
             * Pastda, markazda — tepada tursa sahifaning yuqori
             * navigatsiyasini yopib qo'yadi (bu ogohlantirishning o'zi
             * yangi nuqsonga aylanardi). Toastlar o'ng pastda chiqadi,
             * shuning uchun markaz bo'sh qoladi.
             */
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[190] flex max-w-[min(92vw,640px)] items-center gap-3 rounded-md bg-destructive px-4 py-2 text-destructive-foreground text-sm shadow-lg"
        >
            <AlertTriangle size={16} className="shrink-0" />
            <span>
                Ba'zi ma'lumotlar serverdan yuklanmadi — ekrandagi raqamlar
                to'liq emas.
            </span>
            <button
                type="button"
                onClick={retry}
                className="underline underline-offset-2 shrink-0"
            >
                Qayta urinish
            </button>
            <button
                type="button"
                aria-label="Yopish"
                onClick={() => setBannerDismissed(true)}
                className="shrink-0 opacity-80 hover:opacity-100"
            >
                <X size={16} />
            </button>
        </div>
    )
}
