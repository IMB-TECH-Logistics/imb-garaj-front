import { useQueryClient } from "@tanstack/react-query"
import * as React from "react"

import {
    DEFAULT_PAGE_SIZE,
    SERVER_DEFAULT_PAGE_SIZE,
} from "@/constants/default"

/**
 * Jadval uchun ikkita "holat" hisobi — `datatable.tsx` dan ajratilgan
 * (fayl 600 qator chegarasidan oshib ketmasligi uchun).
 *
 *   1) `useRowNumberOffset` — qator raqami (№) qaysi songdan boshlanadi
 *   2) `useFallbackQueryError` — sahifa `error` bermaganda ham xatoni topish
 */

/**
 * Qator raqami (№) uchun server HAQIQATAN qaytargan sahifa hajmi.
 *
 * Ilgari `page_size` URL da bo'lmasa DEFAULT_PAGE_SIZE (10) ishlatilardi,
 * backend esa (DRF PAGE_SIZE) 25 tadan sahifalaydi — shu sababli
 * 2-sahifadan boshlab raqamlar noto'g'ri chiqardi.
 *
 * Hajm shu tartibda aniqlanadi:
 *   1) URL dagi aniq `page_size` (server uni albatta hurmat qiladi)
 *   2) kuzatilgan to'liq sahifa — oxirgi BO'LMAGAN har qanday sahifadagi
 *      qatorlar soni serverning haqiqiy sahifa hajmiga teng
 *   3) sahifa bergan `PageSize`
 *   4) backend'ning o'z sukut qiymati (25)
 */
export const useEffectivePageSize = ({
    isManualPagination,
    currentPage,
    totalPages,
    rowCount,
    explicitPageSize,
    providedPageSize,
}: {
    isManualPagination: boolean
    currentPage: number
    totalPages?: number
    rowCount?: number
    explicitPageSize: number
    providedPageSize?: number
}) => {
    const observed = React.useRef(0)

    if (
        !explicitPageSize &&
        !!totalPages &&
        currentPage < totalPages &&
        (rowCount ?? 0) > 0
    ) {
        observed.current = rowCount ?? 0
    }

    if (!isManualPagination) return explicitPageSize || DEFAULT_PAGE_SIZE

    return (
        explicitPageSize ||
        observed.current ||
        providedPageSize ||
        SERVER_DEFAULT_PAGE_SIZE
    )
}

/**
 * Qator raqamining boshlanish nuqtasi.
 *
 * REG-01: `viewAll` rejimida server SAHIFALAMAYDI — butun ro'yxat bitta
 * so'rovda keladi va hammasi ekranda chiziladi, shuning uchun URL dagi
 * `?page` bu jadvalga umuman taalluqli emas. Ilgari u baribir hisobga
 * olinardi: `/haydovchilar?page=2` da o'sha 28 ta haydovchi qaytadan
 * chizilib **26–53** deb raqamlanardi — 26, 27, 28 raqamlari ikki xil
 * odamga tegib, ro'yxat 53 kishilik bo'lib ko'rinardi.
 */
export const rowNumberOffsetOf = ({
    viewAll,
    currentPage,
    pageSize,
}: {
    viewAll?: boolean
    currentPage: number
    pageSize: number
}) => (viewAll ? 0 : (Math.max(1, currentPage) - 1) * pageSize)

/**
 * Xato holatini SAHIFA aytmaganda ham topish.
 *
 * Muammo (raund-2, `isError` bandi): butun ilovada `isError` ni atigi bir
 * nechta sahifa o'qiydi. Qolganlari `data ?? []` yozadi, shuning uchun
 * so'rov yiqilganda foydalanuvchi XATO emas, **bo'sh ro'yxat** ko'radi —
 * "Ro'yxat 0". Bu yolg'on: "ma'lumot yo'q" bilan "so'rov umuman ishlamadi"
 * bir xil narsa emas.
 *
 * `enabled` qat'iy shart bilan berilishi kerak: jadval ma'lumoti
 * **undefined** bo'lsa (so'rov hech narsa qaytarmagan). Bo'sh massiv (`[]`)
 * — haqiqatan bo'sh ro'yxat, unda eski "Ma'lumot topilmadi" holati qoladi.
 * Faol so'rovlar orasida yiqilgani topilmasa `null` qaytadi va hech nima
 * o'zgarmaydi.
 */
export const useFallbackQueryError = (enabled: boolean): unknown => {
    const queryClient = useQueryClient()
    const [fallbackError, setFallbackError] = React.useState<unknown>(null)

    React.useEffect(() => {
        if (!enabled) {
            setFallbackError(null)
            return
        }
        const cache = queryClient.getQueryCache()
        const read = () => {
            const failed = cache
                .getAll()
                .find(
                    (q) =>
                        q.getObserversCount() > 0 && q.state.status === "error",
                )
            setFallbackError(failed?.state.error ?? null)
        }
        read()
        return cache.subscribe(read)
    }, [enabled, queryClient])

    return fallbackError
}
