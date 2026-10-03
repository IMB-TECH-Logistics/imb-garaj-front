import { FormCombobox } from "@/components/form/combobox"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    MANAGERS_ORDERS,
    MANAGERS_ORDERS_INTEGRATION_COUNT,
    MANAGERS_TRIPS,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePost } from "@/hooks/usePost"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export const APPROVE_TRIP_MODAL_KEY = `${MANAGERS_ORDERS}-approve-trip`

type FormValues = { trip: number | string | "" }

type TripOption = { id: number; name: string }

const formatDate = (value?: string | null) => {
    if (!value) return "-"
    const date = new Date(value)
    return isNaN(date.getTime()) ? "-" : format(date, "yyyy-MM-dd")
}

export default function ApproveTripModal({ order }: { order: ManagerOrders | null }) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal(APPROVE_TRIP_MODAL_KEY)
    const { mutate, isPending } = usePost({})
    const { control, handleSubmit, reset } = useForm<FormValues>({ defaultValues: { trip: "" } })

    const { data: currentTrip } = useGet<ManagerTrips>(`${MANAGERS_TRIPS}/${order?.trip}`, {
        enabled: !!order?.trip,
    })
    const vehicle = currentTrip?.vehicle

    const { data: trips, isLoading } = useGet<ListResponse<ManagerTrips>>(MANAGERS_TRIPS, {
        params: { vehicle, page_size: 50, ordering: "-id" },
        enabled: !!vehicle,
    })

    const options = useMemo<TripOption[]>(
        () =>
            (trips?.results ?? [])
                .filter((trip) => !trip.end && trip.id != null)
                .map((trip) => ({
                    id: trip.id as number,
                    name: `#${trip.id} · ${formatDate(trip.start)}${trip.driver_name ? ` · ${trip.driver_name}` : ""}`,
                })),
        [trips?.results],
    )

    const onSubmit = (values: FormValues) => {
        if (!order) return
        mutate(
            `${MANAGERS_ORDERS}/${order.id}/approve`,
            values.trip ? { trip: Number(values.trip) } : {},
            {
                onSuccess: () => {
                    toast.success(t("reys_confirm.approved"))
                    queryClient.invalidateQueries({ queryKey: [MANAGERS_ORDERS] })
                    queryClient.invalidateQueries({ queryKey: [MANAGERS_ORDERS_INTEGRATION_COUNT] })
                    queryClient.invalidateQueries({ queryKey: [MANAGERS_TRIPS] })
                    reset({ trip: "" })
                    closeModal()
                },
                onError: () => {
                    toast.error(t("reys_confirm.error"))
                },
            },
        )
    }

    return (
        <Modal
            size="max-w-md"
            modalKey={APPROVE_TRIP_MODAL_KEY}
            titleInChildren
            onClose={() => reset({ trip: "" })}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <DialogHeader>
                    <DialogTitle className="font-normal">{t("reys_confirm.dialog_title")}</DialogTitle>
                    <DialogDescription>
                        {order?.loading_name} → {order?.unloading_name}
                    </DialogDescription>
                </DialogHeader>
                <div className="rounded-md border p-3 text-sm">
                    <p className="text-muted-foreground">{t("reys_confirm.current_trip")}</p>
                    <p className="mt-1 font-medium">
                        {order?.trip ?
                            `#${order.trip} · ${formatDate(currentTrip?.start)} · ${
                                currentTrip ?
                                    currentTrip.end ? t("reys_confirm.trip_closed") : t("reys_confirm.trip_open")
                                :   "..."
                            }`
                        :   "-"}
                    </p>
                </div>
                {options.length > 0 && (
                    <FormCombobox<FormValues, TripOption>
                        name="trip"
                        control={control}
                        label={t("reys_confirm.trip_label")}
                        placeholder={t("reys_confirm.trip_placeholder")}
                        options={options}
                        valueKey="id"
                        labelKey="name"
                        isLoading={isLoading}
                        isSearch={false}
                        isClearIcon
                    />
                )}
                <p className="text-xs text-muted-foreground">{t("reys_confirm.trip_hint")}</p>
                <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={closeModal} disabled={isPending}>
                        {t("actions.cancel")}
                    </Button>
                    <Button type="submit" loading={isPending}>
                        {t("actions.confirm")}
                    </Button>
                </DialogFooter>
            </form>
        </Modal>
    )
}
