import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { isPast, toNumber } from "../ombor/utils"
import type { VehicleExpenseRow } from "./cols"
import type { LineValues, SerialLot } from "./types"
import { useProductLots } from "./use-product-lots"

export type LotInfo = {
    id: number
    lot_number: string
    expires_at: string | null
    qty_left: number
    factory_number: string | null
    condition: SerialLot["condition"] | null
}

export type LineCheck = {
    product: boolean
    lot: boolean
    quantity: boolean
    stock: boolean
}

export const useLineCheck = (
    lines: LineValues[],
    current: VehicleExpenseRow | null,
    enabled: boolean,
) => {
    const { t } = useTranslation()
    const items = current?.items

    const productIds = useMemo(
        () =>
            enabled ?
                [
                    ...new Set(
                        lines
                            .map((l) => l.product)
                            .filter((p): p is number => !!p),
                    ),
                ]
            :   [],
        [lines, enabled],
    )
    const fetched = useProductLots(productIds)

    const originals = useMemo(() => {
        const map = new Map<number, number>()
        items?.forEach((item) =>
            map.set(
                item.lot,
                (map.get(item.lot) ?? 0) + toNumber(item.quantity),
            ),
        )
        return map
    }, [items])

    const lotsOf = (productId: number): LotInfo[] | undefined => {
        const list = fetched[productId]
        if (!list) return undefined
        const infos: LotInfo[] = list.map((l) => ({
            id: l.id,
            lot_number: l.lot_number,
            expires_at: l.expires_at,
            qty_left: toNumber(l.qty_left),
            factory_number: l.factory_number ?? null,
            condition: l.condition ?? null,
        }))
        const extra: LotInfo[] = []
        items?.forEach((item) => {
            if (
                item.product === productId &&
                !infos.some((l) => l.id === item.lot) &&
                !extra.some((l) => l.id === item.lot)
            ) {
                extra.push({
                    id: item.lot,
                    lot_number: item.lot_number,
                    expires_at: item.expires_at,
                    qty_left: 0,
                    factory_number: item.factory_number ?? null,
                    condition: null,
                })
            }
        })
        return [...infos, ...extra]
    }

    const availableOf = (lot: LotInfo) =>
        lot.qty_left + (originals.get(lot.id) ?? 0)

    const isSerialized = (productId: number) =>
        !!lotsOf(productId)?.some((l) => l.factory_number)

    const isAuto = (l: LineValues) =>
        !!l.product && !isSerialized(l.product)

    const sums = new Map<number, number>()
    const autoSums = new Map<number, number>()
    lines.forEach((l) => {
        if (isAuto(l)) {
            autoSums.set(
                l.product!,
                (autoSums.get(l.product!) ?? 0) + toNumber(l.quantity),
            )
        } else if (l.lot) {
            sums.set(l.lot, (sums.get(l.lot) ?? 0) + toNumber(l.quantity))
        }
    })

    const fifo = (productId: number) =>
        (lotsOf(productId) ?? [])
            .filter((l) => !isPast(l.expires_at))
            .sort(
                (a, b) =>
                    (a.expires_at ?? "9999").localeCompare(b.expires_at ?? "9999") ||
                    a.id - b.id,
            )

    const freeOf = (productId: number) =>
        fifo(productId).reduce(
            (sum, l) => sum + Math.max(0, availableOf(l) - (sums.get(l.id) ?? 0)),
            0,
        )

    const checks: LineCheck[] = lines.map((l) => {
        const noProduct = !l.product
        const badQuantity = !(toNumber(l.quantity) > 0)
        if (!noProduct && isAuto(l)) {
            const loaded = !!lotsOf(l.product!)
            return {
                product: false,
                lot: false,
                quantity: badQuantity,
                stock:
                    !badQuantity &&
                    loaded &&
                    (autoSums.get(l.product!) ?? 0) > freeOf(l.product!) + 1e-9,
            }
        }
        const lots = l.product ? lotsOf(l.product) : undefined
        const lot = l.lot ? lots?.find((x) => x.id === l.lot) : undefined
        const badLot =
            !noProduct &&
            (!l.lot || (!!lots && (!lot || isPast(lot.expires_at))))
        return {
            product: noProduct,
            lot: badLot,
            quantity: badQuantity,
            stock:
                !noProduct &&
                !badLot &&
                !badQuantity &&
                !!lot &&
                (sums.get(lot.id) ?? 0) > availableOf(lot) + 1e-9,
        }
    })

    const allocate = (values: LineValues[]) => {
        const used = new Map<number, number>()
        values.forEach((l) => {
            if (!isAuto(l) && l.lot) {
                used.set(l.lot, (used.get(l.lot) ?? 0) + toNumber(l.quantity))
            }
        })
        return values.flatMap((l) => {
            if (!isAuto(l)) return [l]
            let need = toNumber(l.quantity)
            const parts: LineValues[] = []
            for (const lot of fifo(l.product!)) {
                if (need <= 1e-9) break
                const free = availableOf(lot) - (used.get(lot.id) ?? 0)
                if (free <= 1e-9) continue
                const take = Math.min(free, need)
                used.set(lot.id, (used.get(lot.id) ?? 0) + take)
                parts.push({ ...l, lot: lot.id, quantity: String(Math.round(take * 100) / 100) })
                need -= take
            }
            return parts
        })
    }

    const error =
        !lines.length ? t("wh.receipt.err_empty")
        : checks.some((c) => c.product) ? t("wh.tech.err_product")
        : checks.some((c, i) => c.lot && !!lines[i].product && isSerialized(lines[i].product!)) ? t("texnik.serial.choose_piece")
        : checks.some((c) => c.lot) ? t("wh.tech.err_lot")
        : ""
    const invalid = !!error || checks.some((c) => c.quantity || c.stock)

    return { lotsOf, availableOf, isAuto, allocate, checks, error, invalid }
}

export type LineCheckResult = ReturnType<typeof useLineCheck>
