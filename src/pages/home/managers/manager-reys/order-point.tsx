import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MANAGERS_ORDERS } from "@/constants/api-endpoints"
import { usePatch } from "@/hooks/usePatch"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { MapPin, TriangleAlert } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export type PointSide = "load" | "unload"

type Props = {
    orderId: number
    side: PointSide
    lat?: number | null
    lng?: number | null
    located: boolean
}

const COORDS_RE = /^\s*(-?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/

export function parseCoords(text: string): [number, number] | null {
    const match = COORDS_RE.exec(text)
    if (!match) return null
    const lat = Number(match[1])
    const lng = Number(match[2])
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
    return [lat, lng]
}

const LINK_RES = [
    /@(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/,
    /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/,
    /[?&](?:q|query|ll|destination|center)=(-?\d{1,3}\.\d+)(?:,|%2C)\s*(-?\d{1,3}\.\d+)/i,
]

export function parsePoint(text: string): [number, number] | null {
    const plain = parseCoords(text)
    if (plain) return plain
    for (const re of LINK_RES) {
        const match = re.exec(text)
        if (match) return parseCoords(`${match[1]}, ${match[2]}`)
    }
    return null
}

export const pointText = (lat?: number | null, lng?: number | null) => (lat != null && lng != null ? `${lat}, ${lng}` : "")

export function OrderPointButton({ orderId, side, lat, lng, located }: Props) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const own = lat != null && lng != null
    const [open, setOpen] = useState(false)
    const [text, setText] = useState("")
    const [error, setError] = useState(false)

    const { mutate, isPending } = usePatch({
        onSuccess: () => {
            toast.success(t("messages.success_edit"))
            queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).includes(MANAGERS_ORDERS) })
            setOpen(false)
        },
    })

    const save = (point: [number, number] | null) =>
        mutate(`${MANAGERS_ORDERS}/${orderId}`, {
            [`${side}_lat`]: point ? point[0] : null,
            [`${side}_lng`]: point ? point[1] : null,
        })

    const submit = () => {
        const point = parseCoords(text)
        setError(!point)
        if (point) save(point)
    }

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next)
                if (next) {
                    setText(own ? `${lat}, ${lng}` : "")
                    setError(false)
                }
            }}
        >
            <PopoverTrigger asChild>
                <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    title={own ? `${lat}, ${lng}` : located ? t("trips.reys_cols.point_set") : t("trips.reys_cols.no_location")}
                    className={cn(
                        "shrink-0 rounded p-0.5 transition hover:bg-accent",
                        !located && !own && "text-red-600",
                        own && "text-primary",
                        located && !own && "text-muted-foreground/40 hover:text-muted-foreground",
                    )}
                >
                    {!located && !own ? <TriangleAlert size={14} /> : <MapPin size={14} />}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="start" onClick={(e) => e.stopPropagation()}>
                <form
                    className="flex flex-col gap-2"
                    onSubmit={(e) => {
                        e.preventDefault()
                        submit()
                    }}
                >
                    <p className="text-sm font-medium">
                        {t(side === "load" ? "trips.reys_cols.point_load" : "trips.reys_cols.point_unload")}
                    </p>
                    <Input
                        autoFocus
                        value={text}
                        placeholder="40.150409, 65.149722"
                        onChange={(e) => setText(e.target.value)}
                        className={cn(error && "border-red-500")}
                    />
                    <p className={cn("text-xs", error ? "text-red-600" : "text-muted-foreground")}>
                        {t(error ? "trips.reys_cols.point_invalid" : "trips.reys_cols.point_hint")}
                    </p>
                    <div className="flex justify-end gap-2">
                        {own && (
                            <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => save(null)}>
                                {t("trips.reys_cols.point_clear")}
                            </Button>
                        )}
                        <Button type="submit" size="sm" disabled={isPending || !text.trim()}>
                            {t("trips.reys_cols.point_save")}
                        </Button>
                    </div>
                </form>
            </PopoverContent>
        </Popover>
    )
}
