import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { isPast, toNumber } from "../ombor/utils"
import type { VehicleExpenseRow } from "./cols"
import type { LineValues } from "./types"
import { useProductLots } from "./use-product-lots"

export type LotInfo = {
    id: number
    lot_number: string
    expires_at: string | null
    qty_left: number
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
                })
            }
        })
        return [...infos, ...extra]
    }

    const availableOf = (lot: LotInfo) =>
        lot.qty_left + (originals.get(lot.id) ?? 0)

    const sums = new Map<number, number>()
    lines.forEach((l) => {
        if (l.lot) {
            sums.set(l.lot, (sums.get(l.lot) ?? 0) + toNumber(l.quantity))
        }
    })

    const checks: LineCheck[] = lines.map((l) => {
        const lots = l.product ? lotsOf(l.product) : undefined
        const lot = l.lot ? lots?.find((x) => x.id === l.lot) : undefined
        const noProduct = !l.product
        const badLot =
            !noProduct &&
            (!l.lot || (!!lots && (!lot || isPast(lot.expires_at))))
        const badQuantity = !(toNumber(l.quantity) > 0)
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

    const error =
        !lines.length ? t("wh.receipt.err_empty")
        : checks.some((c) => c.product) ? t("wh.tech.err_product")
        : checks.some((c) => c.lot) ? t("wh.tech.err_lot")
        : checks.some((c) => c.quantity) ? t("wh.tech.err_quantity")
        : ""
    const invalid = !!error || checks.some((c) => c.stock)

    return { lotsOf, availableOf, checks, error, invalid }
}

export type LineCheckResult = ReturnType<typeof useLineCheck>
