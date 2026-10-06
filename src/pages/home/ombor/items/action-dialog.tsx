import Modal from "@/components/custom/modal"
import { FormDatePicker } from "@/components/form/date-picker"
import { FormNumberInput } from "@/components/form/number-input"
import { FormTextarea } from "@/components/form/textarea"
import { Button } from "@/components/ui/button"
import { WAREHOUSE_ITEMS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { useQueryClient } from "@tanstack/react-query"
import { TriangleAlert } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { collectErrors, toNumber, todayISO } from "../utils"
import type {
    ItemAction,
    ItemActionPayload,
    KmSuggest,
    WhItem,
    WhItemDetail,
} from "./types"

export const ITEM_ACTION_MODAL_KEY = "wh-item-action"

type FormValues = {
    date: string
    km_driven: string
    odometer: string
    comment: string
}

type Props = {
    item: WhItem
    action: ItemAction
}

const ActionForm = ({ item, action }: Props) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal(ITEM_ACTION_MODAL_KEY)
    const [serverError, setServerError] = useState("")
    const leavesVehicle = item.state === "installed"

    const form = useForm<FormValues>({
        defaultValues: {
            date: todayISO(),
            km_driven: "",
            odometer: "",
            comment: "",
        },
    })
    const { control, handleSubmit, setValue, getValues } = form
    const date = useWatch({ control, name: "date" })
    const suggestedKm = useRef("")
    const suggestedOdometer = useRef("")

    const { data: suggest, isFetching } = useGet<KmSuggest>(
        `${WAREHOUSE_ITEMS}/${item.id}/km-suggest`,
        {
            params: { date },
            enabled: leavesVehicle && !!date,
            options: { staleTime: 0 },
        },
    )

    useEffect(() => {
        if (!suggest) return
        const km = suggest.km_driven === null ? "" : String(suggest.km_driven)
        const odometer =
            suggest.last_odometer === null ? "" : String(suggest.last_odometer)
        if (getValues("km_driven") === suggestedKm.current) {
            setValue("km_driven", km)
            suggestedKm.current = km
        }
        if (getValues("odometer") === suggestedOdometer.current) {
            setValue("odometer", odometer)
            suggestedOdometer.current = odometer
        }
    }, [suggest])

    const { mutate, isPending } = usePost<ItemActionPayload, WhItemDetail>({
        onSuccess: () => {
            toast.success(t(`wh.items.done.${action}`))
            closeModal()
            queryClient.invalidateQueries({
                predicate: (query) =>
                    String(query.queryKey[0]).startsWith(WAREHOUSE_ITEMS),
            })
        },
        onError: (error) => {
            const messages = collectErrors(error?.response?.data)
            setServerError(messages.join(" · ") || t("messages.error"))
        },
    })

    const onSubmit = (values: FormValues) => {
        setServerError("")
        const payload: ItemActionPayload = {
            action,
            date: values.date,
        }
        if (leavesVehicle) {
            if (values.km_driven !== "") {
                payload.km_driven = toNumber(values.km_driven)
                const untouched = values.km_driven === suggestedKm.current
                payload.km_source =
                    untouched && suggest?.source === "gps" ? "gps" : "manual"
            }
            if (values.odometer !== "") {
                payload.odometer = toNumber(values.odometer)
            }
        }
        if (values.comment.trim()) payload.comment = values.comment.trim()
        mutate(`${WAREHOUSE_ITEMS}/${item.id}/action`, payload)
    }

    const hint =
        !leavesVehicle || isFetching || !suggest ? null
        : suggest.source === "gps" ? t("wh.items.km_hint_gps")
        : suggest.source === "odometer" ? t("wh.items.km_hint_odometer")
        : t("wh.items.km_hint_none")

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3 p-0.5"
        >
            <div className="rounded-lg bg-muted/60 p-3 text-sm">
                <div className="font-mono font-medium">
                    {item.factory_number}
                </div>
                <div className="text-xs text-muted-foreground">
                    {item.product_name}
                    {item.vehicle_plate ? ` · ${item.vehicle_plate}` : ""}
                </div>
            </div>

            {action === "write_off" && (
                <div className="flex items-start gap-2 rounded-lg border border-red-600/30 bg-red-600/10 p-3 text-sm text-red-600">
                    <TriangleAlert size={18} className="shrink-0 mt-0.5" />
                    <span>{t("wh.items.write_off_confirm")}</span>
                </div>
            )}

            <FormDatePicker
                required
                fullWidth
                name="date"
                label={t("form.date")}
                control={control}
            />

            {leavesVehicle && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <FormNumberInput
                            name="km_driven"
                            label={t("wh.items.km_driven")}
                            control={control}
                            allowNegative={false}
                            decimalScale={0}
                        />
                        {hint && (
                            <span className="text-xs text-muted-foreground">
                                {hint}
                            </span>
                        )}
                    </div>
                    <FormNumberInput
                        name="odometer"
                        label={t("wh.items.odometer")}
                        control={control}
                        allowNegative={false}
                        decimalScale={0}
                    />
                </div>
            )}

            <FormTextarea
                name="comment"
                label={t("form.comment")}
                methods={form}
            />

            {serverError && (
                <div className="rounded-md bg-red-600/10 p-2.5 text-sm text-red-600">
                    {serverError}
                </div>
            )}

            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    disabled={isPending}
                >
                    {t("actions.cancel")}
                </Button>
                <Button
                    type="submit"
                    variant={action === "write_off" ? "destructive" : "default"}
                    loading={isPending}
                >
                    {t(`wh.items.action.${action}`)}
                </Button>
            </div>
        </form>
    )
}

const ItemActionDialog = ({
    item,
    action,
}: {
    item: WhItem
    action: ItemAction | null
}) => {
    const { t } = useTranslation()
    return (
        <Modal
            modalKey={ITEM_ACTION_MODAL_KEY}
            size="max-w-lg"
            title={action ? t(`wh.items.action.${action}`) : undefined}
        >
            {action && <ActionForm item={item} action={action} />}
        </Modal>
    )
}

export default ItemActionDialog
