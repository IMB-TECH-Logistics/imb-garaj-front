import { FormCombobox } from "@/components/form/combobox"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MANAGERS_ORDERS, MANAGERS_TRIPS } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export const MOVE_TRIP_MODAL_KEY = `${MANAGERS_ORDERS}-move-trip`

const CASH_CLOSED = 20

type FormValues = { trip: number | string | "" }

type TripOption = { id: number; name: string }

const fmt = (value?: string | null) => {
    if (!value) return ""
    const date = new Date(value)
    return isNaN(date.getTime()) ? "" : format(date, "dd.MM.yyyy")
}

export default function MoveTripModal({ order, vehicle }: { order: ManagerOrders | null; vehicle?: number }) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal(MOVE_TRIP_MODAL_KEY)
    const { mutate, isPending } = usePost({})
    const { control, handleSubmit, reset, watch } = useForm<FormValues>({ defaultValues: { trip: "" } })

    const { data: trips, isLoading } = useGet<ListResponse<ManagerTrips>>(MANAGERS_TRIPS, {
        params: { vehicle, page_size: 50, ordering: "-id" },
        enabled: !!vehicle && !!order,
    })

    const options = useMemo<TripOption[]>(
        () =>
            (trips?.results ?? [])
                .filter((trip) => trip.id != null && trip.id !== order?.trip && trip.cash_close_status !== CASH_CLOSED)
                .map((trip) => ({
                    id: trip.id as number,
                    name: `#${trip.id} · ${fmt(trip.start)} – ${trip.end ? fmt(trip.end) : t("reys_move.open")}${
                        trip.driver_name ? ` · ${trip.driver_name}` : ""
                    }`,
                })),
        [trips?.results, order?.trip, t],
    )

    const close = () => {
        reset({ trip: "" })
        closeModal()
    }

    const onSubmit = (values: FormValues) => {
        if (!order || !values.trip) return
        mutate(
            `${MANAGERS_ORDERS}/${order.id}/move-trip`,
            { trip: Number(values.trip) },
            {
                onSuccess: () => {
                    toast.success(t("reys_move.moved"))
                    queryClient.invalidateQueries({ queryKey: [MANAGERS_ORDERS] })
                    queryClient.invalidateQueries({ queryKey: [MANAGERS_TRIPS] })
                    close()
                },
                onError: (error: any) => {
                    toast.error(error?.response?.data?.detail || error?.response?.data?.trip?.[0] || t("reys_move.error"))
                },
            },
        )
    }

    return (
        <Modal size="max-w-md" modalKey={MOVE_TRIP_MODAL_KEY} titleInChildren onClose={() => reset({ trip: "" })}>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <DialogHeader>
                    <DialogTitle className="font-normal">{t("reys_move.title")}</DialogTitle>
                    <DialogDescription>
                        {fmt(order?.date)} · {order?.loading_name} → {order?.unloading_name}
                    </DialogDescription>
                </DialogHeader>
                <FormCombobox<FormValues, TripOption>
                    required
                    name="trip"
                    control={control}
                    label={t("reys_confirm.trip_label")}
                    placeholder={t("reys_move.placeholder")}
                    options={options}
                    valueKey="id"
                    labelKey="name"
                    isLoading={isLoading}
                    isSearch={false}
                />
                <p className="text-xs text-muted-foreground">{t("reys_move.hint")}</p>
                <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={close} disabled={isPending}>
                        {t("actions.cancel")}
                    </Button>
                    <Button type="submit" loading={isPending} disabled={!watch("trip")}>
                        {t("reys_move.submit")}
                    </Button>
                </DialogFooter>
            </form>
        </Modal>
    )
}
