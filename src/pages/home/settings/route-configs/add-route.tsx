import { Button } from "@/components/ui/button"
import { COMMON_DIRECTIONS } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { formatDate } from "./cols"
import { CargoClientSection, LoadSection, PriceSection, UnloadSection } from "./route-form-sections"
import { Direction } from "./route-form-utils"
import { useRouteOptions } from "./use-route-options"
const AddRouteConfigModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("create")
    const { getData, clearKey } = useGlobalStore()
    const current = getData<Direction>(COMMON_DIRECTIONS)

    const form = useForm<Direction>({
        defaultValues: {
            owner: current?.owner ?? null,
            load: current?.load ?? null,
            unload: current?.unload ?? null,
            load_place: current?.load_place ?? "",
            unload_place: current?.unload_place ?? "",
            cargo_type: current?.cargo_type ?? null,
            payment_type: current?.payment_type ?? null,
            distributor_id: current?.distributor_id ?? null,
            price:
                current?.current_price?.price != null
                    ? String(current.current_price.price)
                    : null,
            valid_from: current?.current_price?.valid_from ?? null,
        },
    })

    const { handleSubmit, control, reset } = form

    const { clientData, regionsData, cargoType, paymentType, deletedLabel, distributorOptions } = useRouteOptions(current, t)

    const onSuccess = (
        saved?: Direction,
        variables?: { payload: Direction },
    ) => {
        const sentDate = variables?.payload?.valid_from
        const active = saved?.current_price
        if (sentDate && active && active.valid_from !== sentDate) {
            toast.warning(
                t("messages.direction_price_not_current", {
                    date: formatDate(sentDate),
                    price: String(Math.round(Number(active.price))).replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        " ",
                    ),
                    active_date: formatDate(active.valid_from),
                }),
                { duration: 10000 },
            )
        } else {
            toast.success(
                current?.id ? t("messages.success_edit") : t("messages.success_add"),
            )
        }
        reset()
        clearKey(COMMON_DIRECTIONS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [COMMON_DIRECTIONS] })
    }

    const { mutate: postMutate, isPending: isPendingCreate } = usePost({ onSuccess })
    const { mutate: updateMutate, isPending: isPendingUpdate } = usePatch({ onSuccess })

    const isPending = isPendingCreate || isPendingUpdate

    const onSubmit = (values: Direction) => {
        if (current?.id) {
            // Yo'nalish narxi faqat so'mda: eski USD (currency=2) yo'nalish ham so'mga o'tkaziladi
            updateMutate(`${COMMON_DIRECTIONS}/${current.id}/update`, {
                ...values,
                currency: 1,
            })
        } else {
            postMutate(`${COMMON_DIRECTIONS}/create`, values)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LoadSection form={form} control={control} current={current} regionsData={regionsData} deletedLabel={deletedLabel} />

            <UnloadSection form={form} control={control} current={current} regionsData={regionsData} deletedLabel={deletedLabel} />

            <CargoClientSection
                control={control}
                current={current}
                clientData={clientData}
                cargoType={cargoType}
                distributorOptions={distributorOptions}
                deletedLabel={deletedLabel}
            />

            <PriceSection control={control} paymentType={paymentType} />

            <div className="md:col-span-2 flex items-center justify-end mt-3">
                <Button className="min-w-36" type="submit" loading={isPending}>
                    {t("actions.save")}
                </Button>
            </div>
        </form>
    )
}

export default AddRouteConfigModal
