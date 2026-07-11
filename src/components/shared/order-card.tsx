import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
    DISPATCHERS__CONTROL_WITHDRAW,
    DISPATCHERS__WITHDRAW,
} from "@/constants/api-endpoints"
import { useHasAction, useUser } from "@/constants/useUser"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import convertDate from "@/lib/convertDate"
import convertTime from "@/lib/convertTime"
import { CopyButton } from "@/lib/copy-button"
import { cn } from "@/lib/utils"
import { getColor, getTimeDifference } from "@/pages/buyurtmalar/helper"
import {
    ORDER_THROUGH_LABELS,
    methodLabels,
} from "@/pages/buyurtmalar/constants"
import Timer from "@/pages/buyurtmalar/timer"
import { useGlobalStore } from "@/store/global-store"
import {
    Check,
    Info,
    MapPinHouse,
    MoveRight,
    Plus,
    RefreshCw,
    Undo2,
} from "lucide-react"
import { toast } from "sonner"

interface IProps {
    item: OrderDispatchData
    isInfoHidden?: boolean
    isButtons?: boolean
}

const OrderCard = ({
    item: c,
    isInfoHidden = false,
    isButtons = true,
}: IProps) => {
    const { openModal: openModalSendInfo } = useModal("send-info-modal")
    const { openModal: openModalSend } = useModal("send-modal")
    const { openModal: openViewModal } = useModal("view-modal")
    const { setData } = useGlobalStore()
    const orderBronDispatcher = useHasAction("dispatcher-control-order-bron")
    const { data: user_info } = useUser()

    const handleSendInfo = (data: string[]) => {
        if (data?.length) {
            setData<string[]>("send-info", data)
            openModalSendInfo()
        } else {
            toast.warning("Mezonlar topilmadi")
        }
    }

    const { mutate: postUndo, isPending } = usePost({
        onSuccess: () => {
            toast.success("Amaliyot muvaffaqiyatli bajarildi")
        },
    })

    const dif = getTimeDifference(c.created_at)

    async function onSendLocation() {
        const lon = c.loading_name
        const lat = c.unloading_name
        const groupLink = "https://t.me/lorry_yuk_markazi"

        if (!lon || !lat) {
            toast.error("Lokatsiyasi topilmadi")
            return
        }

        const message = `Zavod manzili: https://maps.google.com/?q=${lat},${lon} Bizning guruh: ${groupLink}`

        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(message)}`
        window.open(telegramUrl, "_blank")
    }

    return (
        <Card
            className={cn(
                "relative flex flex-col justify-between h-full overflow-hidden text-sm",
                c.is_integration &&
                    "border-orange-400/50 bg-orange-50/40 dark:bg-orange-950/20",
            )}
        >
            {c.is_integration && (
                <span className="absolute top-0 left-0 z-10 bg-orange-500/15 text-orange-600 rounded-br-lg py-0.5 px-2 text-xs font-medium">
                    Integratsiya
                </span>
            )}

            <CardContent className="p-3 flex flex-col gap-3">
                {c.rejected_time ? (
                    <span
                        className={cn(
                            "text-xs text-start w-full",
                            getColor("text", dif),
                        )}
                    >
                        {convertTime(c.created_at)}
                    </span>
                ) : null}

                {c.dispatcher?.id && c.dispatcher?.id == Number(user_info?.id) && (
                    <span className="ml-1 text-xs font-medium absolute top-0 right-0 bg-red-500/15 text-primary-foreground rounded-bl-lg py-0.5 px-2">
                        <Timer data={c} />
                    </span>
                )}

                <div className="flex items-center justify-between">
                    <div>{CopyButton(c.code)}</div>
                    <span
                        className={cn(
                            "ml-1 text-sm text-center w-full",
                            getColor("text", dif),
                        )}
                    >
                        {c?.rejected_time
                            ? convertTime(c.rejected_time)
                            : convertTime(c?.created_at)}
                    </span>
                    <span className="ml-1 text-sm text-nowrap">
                        {convertDate(c.date)}
                    </span>
                </div>

                <div className="flex justify-between items-center -mt-2">
                    <p className="font-medium text-lg">{c.loading_name}</p>
                    <div className="flex items-center gap-2">
                        <span>{c.client_code}</span>
                        <MoveRight width={20} className="text-primary" />
                    </div>
                    <p className="font-medium text-lg">{c.unloading_name}</p>
                </div>

                <p className="text-muted-foreground justify-between flex gap-2 items-center">
                    <span className="text-foreground">Menejer: </span>
                    <span className="font-medium">{c.creator_name}</span>
                </p>
                <p className="text-muted-foreground justify-between flex gap-2 items-center">
                    <span className="text-foreground">To'lov turi: </span>
                    <span className="font-medium">
                        {(c?.payment_types || [])
                            .map((method) => methodLabels[method] || method)
                            .join(", ")}
                    </span>
                </p>
                <p className="text-muted-foreground justify-between flex gap-2 items-center">
                    <span className="text-foreground">Yaratilish usuli: </span>
                    <span className="font-medium">
                        {ORDER_THROUGH_LABELS[Number(c?.created_through)] ||
                            "-"}
                    </span>
                </p>
                {c.truck_id && (
                    <p className="text-muted-foreground justify-between flex gap-2 items-center">
                        <span className="text-foreground">Haydovchi: </span>
                        <span className="font-medium whitespace-nowrap">
                            {c.full_name}
                            {c.truck_id ? ` · ${c.truck_id}` : ""}
                        </span>
                    </p>
                )}
                <p className="text-sm text-muted-foreground">{c.comment}</p>
            </CardContent>

            {isButtons && (
                <CardFooter className="p-2 sm:p-4 !pt-1 flex gap-2 items-center overflow-auto no-scrollbar-x">
                    {c.dispatcher ? (
                        c.dispatcher?.id === Number(user_info?.id) ? (
                            <div className="flex gap-2 w-full">
                                <Button
                                    className="w-full"
                                    size="sm"
                                    icon={<Check width={16} />}
                                    disabled={isPending || c.sub_status === 20}
                                    onClick={() => {
                                        setData("dispatch-order", c)
                                        openModalSend()
                                    }}
                                />
                                <Button
                                    className="w-full"
                                    size="sm"
                                    variant="destructive"
                                    icon={<Undo2 width={16} />}
                                    disabled={isPending || c.sub_status === 20}
                                    onClick={() =>
                                        postUndo(DISPATCHERS__WITHDRAW, {
                                            order: c.id,
                                            dispatcher: c.dispatcher!.id,
                                        })
                                    }
                                />
                                {isInfoHidden && (
                                    <Button
                                        size="sm"
                                        icon={<Info width={18} />}
                                        variant="ghost"
                                        disabled={c.sub_status === 20}
                                        onClick={() =>
                                            handleSendInfo(c.criteria_list)
                                        }
                                    />
                                )}
                                <Button
                                    size="sm"
                                    icon={<MapPinHouse width={18} />}
                                    variant="ghost"
                                    className="!text-primary w-full"
                                    disabled={c.sub_status === 20}
                                    onClick={onSendLocation}
                                />
                            </div>
                        ) : orderBronDispatcher &&
                          c.dispatcher?.id !== Number(user_info?.id) ? (
                            <Button
                                size="sm"
                                variant="destructive"
                                className="w-full"
                                disabled={c.sub_status === 20}
                                onClick={() =>
                                    postUndo(DISPATCHERS__CONTROL_WITHDRAW, {
                                        order: c.id,
                                        dispatcher: c.dispatcher!.id,
                                    })
                                }
                            >
                                {c.dispatcher?.full_name}{" "}
                                <Undo2 width={18} />
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                className="w-full"
                                disabled={c.sub_status === 20}
                            >
                                {c.dispatcher?.full_name}
                            </Button>
                        )
                    ) : c.truck_id ? (
                        <div className="flex items-center gap-2 w-full">
                            <Button
                                className="flex-1"
                                size="sm"
                                variant="secondary"
                                icon={<RefreshCw size={16} />}
                                disabled={c.sub_status === 20}
                                onClick={() => {
                                    setData("view-key", c?.id)
                                    openViewModal()
                                }}
                            >
                                Almashtirish
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 w-full">
                            <Button
                                className="flex-1"
                                size="sm"
                                icon={<Plus size={16} />}
                                disabled={c.sub_status === 20}
                                onClick={() => {
                                    setData("view-key", c?.id)
                                    openViewModal()
                                }}
                            >
                                Biriktirish
                            </Button>
                        </div>
                    )}
                </CardFooter>
            )}
        </Card>
    )
}

export default OrderCard
