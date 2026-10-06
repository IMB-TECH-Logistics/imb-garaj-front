import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { WAREHOUSE_ITEMS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { formatMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    CircleDot,
    PackageCheck,
    Trash2,
    Wrench,
    type LucideIcon,
} from "lucide-react"
import { ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import { fmtDate } from "../utils"
import ItemActionDialog, { ITEM_ACTION_MODAL_KEY } from "./action-dialog"
import { ConditionBadge, StateBadge } from "./cols"
import type {
    ItemAction,
    ItemEventKind,
    WhItemDetail,
    WhItemEvent,
} from "./types"
import { useItemActions } from "./use-item-access"

type Props = {
    itemId: number | undefined
    onClose: () => void
}

const Block = ({
    label,
    children,
    className,
}: {
    label: string
    children: ReactNode
    className?: string
}) => (
    <div className={cn("rounded-lg bg-muted/60 p-3 min-w-0", className)}>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium break-words">{children}</div>
    </div>
)

const EVENT_STYLE: Record<ItemEventKind, { icon: LucideIcon; tone: string }> = {
    received: { icon: PackageCheck, tone: "bg-primary/10 text-primary" },
    installed: { icon: ArrowDownToLine, tone: "bg-green-600/10 text-green-600" },
    removed: { icon: ArrowUpFromLine, tone: "bg-secondary text-foreground" },
    repair: { icon: Wrench, tone: "bg-orange-500/10 text-orange-500" },
    repair_returned: { icon: CircleDot, tone: "bg-primary/10 text-primary" },
    written_off: { icon: Trash2, tone: "bg-red-600/10 text-red-600" },
}

const Timeline = ({ events }: { events: WhItemEvent[] }) => {
    const { t } = useTranslation()
    if (!events.length) {
        return (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                {t("wh.items.no_events")}
            </div>
        )
    }
    return (
        <ol className="flex flex-col">
            {events.map((event, index) => {
                const { icon: Icon, tone } = EVENT_STYLE[event.kind]
                const last = index === events.length - 1
                return (
                    <li key={event.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    "size-8 rounded-full grid place-items-center shrink-0",
                                    tone,
                                )}
                            >
                                <Icon size={16} />
                            </div>
                            {!last && <div className="w-px flex-1 bg-border" />}
                        </div>
                        <div className={cn("min-w-0 flex-1", !last && "pb-4")}>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-sm font-medium">
                                    {t(`wh.items.event.${event.kind}`)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {fmtDate(event.date)}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-2">
                                {event.vehicle_plate && (
                                    <span className="text-foreground font-medium">
                                        {event.vehicle_plate}
                                    </span>
                                )}
                                {event.tenant_name && (
                                    <span>{event.tenant_name}</span>
                                )}
                                {event.odometer !== null && (
                                    <span>
                                        {t("wh.items.odometer")}:{" "}
                                        {formatMoney(event.odometer)}{" "}
                                        {t("wh.items.km")}
                                    </span>
                                )}
                                {event.executor_name && (
                                    <span>{event.executor_name}</span>
                                )}
                            </div>
                            {event.km_driven !== null && (
                                <div className="text-sm mt-1">
                                    {t("wh.items.km_driven")}:{" "}
                                    <span className="font-medium">
                                        {formatMoney(event.km_driven)}{" "}
                                        {t("wh.items.km")}
                                    </span>
                                    {event.km_source && (
                                        <span className="text-xs text-muted-foreground ml-1.5">
                                            (
                                            {t(
                                                `wh.items.km_source.${event.km_source}`,
                                            )}
                                            )
                                        </span>
                                    )}
                                </div>
                            )}
                            {event.comment && (
                                <div className="text-sm text-muted-foreground mt-1 break-words">
                                    {event.comment}
                                </div>
                            )}
                        </div>
                    </li>
                )
            })}
        </ol>
    )
}

const ItemDetailSheet = ({ itemId, onClose }: Props) => {
    const { t } = useTranslation()
    const { openModal } = useModal(ITEM_ACTION_MODAL_KEY)
    const [action, setAction] = useState<ItemAction | null>(null)

    const { data: item, isLoading } = useGet<WhItemDetail>(
        `${WAREHOUSE_ITEMS}/${itemId}`,
        { enabled: !!itemId },
    )
    const actions = useItemActions(item)

    const run = (next: ItemAction) => {
        setAction(next)
        openModal()
    }

    return (
        <Sheet open={!!itemId} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-2xl overflow-y-auto"
            >
                {isLoading && (
                    <div className="flex flex-col gap-3 mt-8">
                        <Skeleton className="h-12 w-2/3" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                )}
                {item && (
                    <>
                        <SheetHeader>
                            <div className="flex items-start gap-3 pr-6">
                                <div className="size-11 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                                    <CircleDot size={22} />
                                </div>
                                <div className="min-w-0">
                                    <SheetTitle className="text-lg leading-tight font-mono break-all">
                                        {item.factory_number}
                                    </SheetTitle>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {[item.product_name, item.category_name].join(
                                            " · ",
                                        )}
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                                        <StateBadge state={item.state} />
                                        <ConditionBadge
                                            condition={item.condition}
                                        />
                                    </div>
                                </div>
                            </div>
                        </SheetHeader>

                        {!!actions.length && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {actions.map((key) => (
                                    <Button
                                        key={key}
                                        size="sm"
                                        variant={
                                            key === "write_off" ?
                                                "destructive"
                                            :   "outline"
                                        }
                                        onClick={() => run(key)}
                                    >
                                        {t(`wh.items.action.${key}`)}
                                    </Button>
                                ))}
                            </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                            <Block label={t("wh.items.vehicle")}>
                                {item.vehicle_plate || "—"}
                            </Block>
                            <Block label={t("wh.items.holder")}>
                                {item.current_tenant_name || "—"}
                            </Block>
                            <Block label={t("wh.items.installed_at")}>
                                {fmtDate(item.installed_at)}
                            </Block>
                            <Block label={t("wh.items.km_total")}>
                                {formatMoney(item.km_total ?? 0)} {t("wh.items.km")}
                            </Block>
                            <Block label={t("wh.items.installed_odometer")}>
                                {item.installed_odometer !== null ?
                                    <>
                                        {formatMoney(item.installed_odometer)}{" "}
                                        {t("wh.items.km")}
                                    </>
                                :   "—"}
                            </Block>
                            <Block label={t("wh.items.price")}>
                                {item.unit_price !== null ?
                                    <>
                                        {formatMoney(item.unit_price)}{" "}
                                        {t("page.som")}
                                    </>
                                :   "—"}
                            </Block>
                            <Block label={t("wh.items.receipt_date")}>
                                {fmtDate(item.receipt_date)}
                            </Block>
                        </div>

                        <h3 className="mt-6 mb-3 text-sm font-semibold text-muted-foreground">
                            {t("wh.items.history")}
                        </h3>
                        <Timeline events={item.events} />

                        <ItemActionDialog item={item} action={action} />
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}

export default ItemDetailSheet
