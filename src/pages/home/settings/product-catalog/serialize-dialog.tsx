import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { WAREHOUSE_PRODUCTS } from "@/constants/api-endpoints"
import { usePost } from "@/hooks/usePost"
import type { WhProduct } from "@/pages/home/ombor/types"
import { handleFormError } from "@/lib/show-form-errors"
import { useQueryClient } from "@tanstack/react-query"
import { Copy, Printer } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

type Props = {
    product: WhProduct | null
    onClose: () => void
}

type SerializeResult = {
    product_id: number
    created: number
    numbers: string[]
}

const TIRE_NAME = /balon|shina|шина/i

const escapeHtml = (value: string) =>
    value.replace(/[&<>]/g, (c) =>
        c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;",
    )

const SerializeDialog = ({ product, onClose }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [prefix, setPrefix] = useState("")
    const [kmLimit, setKmLimit] = useState("")
    const [result, setResult] = useState<SerializeResult | null>(null)
    const open = product !== null

    useEffect(() => {
        if (!product) return
        setResult(null)
        setPrefix(product.serial_prefix ?? "")
        setKmLimit(
            product.tire_km_limit ? String(product.tire_km_limit)
            : TIRE_NAME.test(product.name) ? "100000"
            : "",
        )
    }, [product])

    const refetch = () =>
        queryClient.invalidateQueries({
            predicate: (q) => String(q.queryKey[0]).startsWith("warehouse/"),
        })

    const { mutate, isPending } = usePost({
        onSuccess: (data: SerializeResult) => {
            setResult(data)
            refetch()
        },
        onError: (e: unknown) => handleFormError(e),
    })

    const submit = () => {
        if (!product) return
        mutate(`${WAREHOUSE_PRODUCTS}/${product.id}/serialize`, {
            ...(kmLimit ? { tire_km_limit: Number(kmLimit) } : {}),
            ...(prefix.trim() ? { serial_prefix: prefix.trim() } : {}),
        })
    }

    const copy = async () => {
        if (!result) return
        try {
            await navigator.clipboard.writeText(result.numbers.join("\n"))
            toast.success(t("wh.serialize_copied"))
        } catch {
            toast.error(t("messages.error"))
        }
    }

    const print = () => {
        if (!result || !product) return
        const win = window.open("", "_blank")
        if (!win) return
        const items = result.numbers
            .map((n) => `<li>${escapeHtml(n)}</li>`)
            .join("")
        win.document.write(
            `<html><head><title>${escapeHtml(product.name)}</title><style>body{font-family:sans-serif}li{font-family:monospace;font-size:20px;padding:6px 0;border-bottom:1px dashed #999;list-style:none}</style></head><body><h3>${escapeHtml(product.name)}</h3><ul style="padding:0">${items}</ul></body></html>`,
        )
        win.document.close()
        win.focus()
        win.print()
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {t("wh.serialize")}
                        {product ? ` · ${product.name}` : ""}
                    </DialogTitle>
                    {!result && product && (
                        <DialogDescription>
                            {t("wh.serialize_hint", { count: product.qty_left })}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {result ?
                    <div className="flex flex-col gap-3">
                        <p className="text-sm">
                            {t("wh.serialize_done", { count: result.created })}
                        </p>
                        <ul className="max-h-60 overflow-y-auto rounded-md border divide-y font-mono text-sm">
                            {result.numbers.map((n) => (
                                <li key={n} className="px-3 py-1.5">
                                    {n}
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                icon={<Copy size={16} />}
                                onClick={copy}
                            >
                                {t("wh.serialize_copy")}
                            </Button>
                            <Button
                                variant="outline"
                                icon={<Printer size={16} />}
                                onClick={print}
                            >
                                {t("wh.serialize_print")}
                            </Button>
                        </div>
                    </div>
                :   <div className="flex flex-col gap-3">
                        <label className="flex flex-col gap-1.5 text-sm">
                            {t("wh.serial_prefix")}
                            <Input
                                value={prefix}
                                placeholder={t("wh.serial_prefix_example")}
                                onChange={(e) => setPrefix(e.target.value)}
                            />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm">
                            {t("wh.serialize_km_limit")}
                            <Input
                                type="number"
                                min={0}
                                value={kmLimit}
                                onChange={(e) => setKmLimit(e.target.value)}
                            />
                        </label>
                    </div>
                }

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        {t("actions.close")}
                    </Button>
                    {!result && (
                        <Button loading={isPending} onClick={submit}>
                            {t("wh.serialize")}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default SerializeDialog
