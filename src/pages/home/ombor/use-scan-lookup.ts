import { gs1ErrorText } from "@/components/scanner/gs1-message"
import { parseGs1 } from "@/components/scanner/gs1"
import { WAREHOUSE_SCAN } from "@/constants/api-endpoints"
import { usePost } from "@/hooks/usePost"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import type { WhProduct, WhScanResponse } from "./types"
import { useOmborSearch } from "./use-ombor-search"

export type ScanResolved =
    | { error: string }
    | { response: WhScanResponse & { product: WhProduct } }

export const useScanResolve = () => {
    const { t } = useTranslation()
    const { mutateAsync } = usePost<{ code: string }, WhScanResponse>()

    return async (code: string): Promise<ScanResolved> => {
        const parsed = parseGs1(code)
        if (!parsed.gtin) {
            return {
                error:
                    parsed.errors.length ?
                        gs1ErrorText(t, parsed.errors[0])
                    :   t("wh.scan.unreadable"),
            }
        }

        let response: WhScanResponse
        try {
            response = await mutateAsync(WAREHOUSE_SCAN, { code })
        } catch {
            return { error: t("messages.error") }
        }

        if (!response.product) {
            return { error: t("wh.scan.not_found", { gtin: response.gtin }) }
        }
        return { response: { ...response, product: response.product } }
    }
}

export const useScanLookup = () => {
    const { t } = useTranslation()
    const { select } = useOmborSearch()
    const resolve = useScanResolve()

    const lookup = async (code: string): Promise<string | null> => {
        const resolved = await resolve(code)
        if ("error" in resolved) return resolved.error

        const { response } = resolved
        select(response.product.id, response.lot?.id)
        if (response.lot_number && !response.lot) {
            toast.error(
                t("wh.scan.lot_not_found", {
                    name: response.product.name,
                    lot: response.lot_number,
                }),
            )
        }
        return null
    }

    return lookup
}
