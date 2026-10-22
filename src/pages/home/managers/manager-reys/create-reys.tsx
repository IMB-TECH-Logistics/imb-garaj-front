import { FormCombobox } from "@/components/form/combobox"
import { FormDateTimePicker } from "@/components/form/form-datetime-picker"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { MANAGERS_ORDERS, MANAGERS_ORDERS_INTEGRATION_COUNT } from "@/constants/api-endpoints"
import { isNaqdPaymentTypeName } from "./payment-fields"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import { useEffect, useMemo, useRef } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"
import PriceDiff from "./price-diff"
import { useTranslation } from "react-i18next"
import { todayIso } from "@/lib/today-iso"
import { distinctOptions, useStatusOptions, useActivityOptions } from "./create-reys-options"
import { ReysIncomesSection } from "./reys-incomes-section"
import { ReysImagesSection } from "./reys-images-section"
import { ReysImagePreviewDialog } from "./reys-image-preview-dialog"
import { ReysCityFields, ReysCommonFields, ReysRouteFields } from "./create-reys-fields"
import { useReysImages, useReysLookups } from "./use-create-reys"


const AddTripOrders = () => {
    const { t } = useTranslation()
    const STATUS_OPTIONS = useStatusOptions()
    const ACTIVITY_OPTIONS_TRANSLATED = useActivityOptions()
    const { id } = useParams({ strict: false })
    const queryClient = useQueryClient()
    const { getData, clearKey } = useGlobalStore()
    const { closeModal } = useModal(MANAGERS_ORDERS)
    const currentTripOrder = getData<TripOrdersRow>(MANAGERS_ORDERS)

    const existingPayment = currentTripOrder?.payments?.[0]
    const form = useForm<any>({
        defaultValues: {
            loading: currentTripOrder?.loading,
            unloading: currentTripOrder?.unloading,
            trip: id,
            cargo_type: currentTripOrder?.cargo_type,
            date: currentTripOrder?.date ?? todayIso(),
            started_at: toLocalInput(currentTripOrder?.started_time ?? currentTripOrder?.pending_time),
            finished_at: toLocalInput(currentTripOrder?.completed_time),
            activity:
                currentTripOrder?.activity != null
                    ? String(currentTripOrder.activity)
                    : "1",
            status:
                currentTripOrder?.status != null && currentTripOrder.status !== -1
                    ? String(currentTripOrder.status)
                    : "0",
            is_naqd:
                !!currentTripOrder?.incomes?.length &&
                !currentTripOrder.direction &&
                !currentTripOrder.client,
            incomes:
                currentTripOrder?.incomes?.length
                    ? currentTripOrder.incomes.map((p) => ({
                        payment_type: p.payment_type,
                        amount: p.amount,
                    }))
                    : [
                        {
                            payment_type: null,
                            amount: "",
                        },
                    ],
            client: currentTripOrder?.client ?? null,
            direction: currentTripOrder?.direction ?? null,
            salary_amount: currentTripOrder?.salary_amount ?? 150000,
            driver: currentTripOrder?.driver ?? null,
            trailer_number: currentTripOrder?.trailer_number ?? null,
            images: [] as File[],
        },
    })

    const directionPrefilledRef = useRef(false)


    const { handleSubmit, control, reset, watch, setValue } = form
    const {
        fields: incomeFields,
        append: appendIncome,
        remove: removeIncome,
    } = useFieldArray({
        control,
        name: "incomes",
    })

    const loadingValue = watch("loading")
    const unloadingValue = watch("unloading")
    const cargoTypeValue = watch("cargo_type")
    const directionValue = watch("direction")
    const activityValue = watch("activity") as string

    const isReysActivity = !activityValue || activityValue === "1"
    const isGarajOrTamirActivity =
        activityValue === "2" || activityValue === "3"
    const isCityOnlyActivity = activityValue === "4" || activityValue === "5"

    const prevLoadingRef = useRef(loadingValue)
    const prevUnloadingRef = useRef(unloadingValue)

    const { directionsResponse, paymentTypesData, clientsData, cargoTypesResponse, tripData, managerVehicles, driverOptions, trailerOptions } = useReysLookups(id)

    useEffect(() => {
        if (currentTripOrder?.id || !tripData) return
        if (!form.getValues("driver") && tripData.driver) setValue("driver", tripData.driver)
        if (!form.getValues("trailer_number") && tripData.vehicle) {
            const trailer = managerVehicles?.results?.find((v) => v.id === tripData.vehicle)?.trailer_number
            if (trailer) setValue("trailer_number", trailer)
        }
    }, [tripData, managerVehicles, currentTripOrder?.id])

    const isNaqd = !!watch("is_naqd")
    const incomes = watch("incomes") as { payment_type: number | null; amount: string }[]
    const selectedPaymentTypeIds = useMemo(
        () => new Set((incomes ?? []).map((inc) => inc.payment_type).filter(Boolean)),
        [incomes],
    )
    const allPaymentTypes = paymentTypesData?.results ?? []
    const cardId = paymentTypesData?.results?.find((item) =>
        ["card", "karta"].includes(item.name.toLowerCase()),
    )?.id

    useEffect(() => {
        if (!currentTripOrder?.id) return
        const existingPtId =
            existingPayment?.payment_type ??
            (currentTripOrder?.payment_type as number | undefined)
        if (!existingPtId) return
        const pt = paymentTypesData?.results?.find(
            (p) => p.id === Number(existingPtId),
        )
        if (pt && isNaqdPaymentTypeName(pt.name)) {
            setValue("is_naqd", true)
        }
    }, [
        paymentTypesData,
        currentTripOrder?.id,
        existingPayment?.payment_type,
        currentTripOrder?.payment_type,
        setValue,
    ])

    const clientValue = watch("client")
    const directions = useMemo(() => {
        const all = directionsResponse?.results ?? []
        if (isNaqd || !clientValue) return all
        return all.filter((d) => d.owner === Number(clientValue))
    }, [directionsResponse, isNaqd, clientValue])

    const loadsData = useMemo(
        () =>
            distinctOptions(directions, (d) => ({
                id: d.load,
                name: d.load_name,
            })),
        [directions],
    )

    const unloadsData = useMemo(() => {
        if (isNaqd) {
            return distinctOptions(directions, (d) => ({
                id: d.unload,
                name: d.unload_name,
            }))
        }
        if (!loadingValue) return []
        const rows = directions.filter((d) => d.load === Number(loadingValue))
        return distinctOptions(rows, (d) => ({
            id: d.unload,
            name: d.unload_name,
        }))
    }, [directions, loadingValue, isNaqd])

    const cargoTypesData = useMemo(() => {
        const all = cargoTypesResponse?.results ?? []
        return [{ id: 0, name: t("status.empty") }, ...all]
    }, [cargoTypesResponse])

    const matchedDirection = useMemo(() => {
        if (!loadingValue || !unloadingValue) return undefined
        const cargoId = Number(cargoTypeValue)
        if (directionValue) {
            const selected = directions.find(
                (d) =>
                    d.id === Number(directionValue) &&
                    d.load === Number(loadingValue) &&
                    d.unload === Number(unloadingValue) &&
                    (!cargoId || d.cargo_type === cargoId),
            )
            if (selected) return selected
        }
        if (cargoId) {
            const exact = directions.find(
                (d) =>
                    d.load === Number(loadingValue) &&
                    d.unload === Number(unloadingValue) &&
                    d.cargo_type === cargoId,
            )
            if (exact) return exact
        }
        return directions.find(
            (d) =>
                d.load === Number(loadingValue) &&
                d.unload === Number(unloadingValue),
        )
    }, [
        directions,
        loadingValue,
        unloadingValue,
        cargoTypeValue,
        directionValue,
    ])

    const directionOptions = useMemo(() => {
        if (!loadingValue || !unloadingValue) return []
        const cargoId = Number(cargoTypeValue)
        return directions
            .filter(
                (d) =>
                    d.load === Number(loadingValue) &&
                    d.unload === Number(unloadingValue) &&
                    (!cargoId || d.cargo_type === cargoId),
            )
            .map((d) => ({
                id: d.id,
                name: [
                    d.cargo_type_name,
                    `${d.load_place_display || d.load_name} -> ${d.unload_place_display || d.unload_name}`,
                    d.no_price ? t("form.no_price") : null,
                ]
                    .filter(Boolean)
                    .join(" | "),
            }))
    }, [directions, loadingValue, unloadingValue, cargoTypeValue, t])

    useEffect(() => {
        if (directionPrefilledRef.current) return
        if (!directions.length) return
        const dirId = currentTripOrder?.direction
        if (!dirId) return
        const dir = directions.find((d) => d.id === Number(dirId))
        if (!dir) return
        setValue("loading", dir.load)
        setValue("unloading", dir.unload)
        setValue("cargo_type", dir.cargo_type)
        prevLoadingRef.current = dir.load
        prevUnloadingRef.current = dir.unload
        directionPrefilledRef.current = true
    }, [directions, currentTripOrder?.direction, setValue])

    useEffect(() => {
        if (prevLoadingRef.current !== loadingValue) {
            setValue("unloading", null)
            setValue("cargo_type", null)
            prevLoadingRef.current = loadingValue
        }
    }, [loadingValue, setValue])

    useEffect(() => {
        if (prevUnloadingRef.current !== unloadingValue) {
            setValue("cargo_type", null)
            prevUnloadingRef.current = unloadingValue
        }
    }, [unloadingValue, setValue])

    const isDraft = currentTripOrder?.status === -1
    // S-06-03: integratsiyadan (logistikadan) kelgan buyurtma ma'lumotlari tahrirlanmaydi.
    const externalId = String(currentTripOrder?.external_id ?? "").trim()
    const isLogisticsOrder =
        !!currentTripOrder?.id && !!externalId && !externalId.startsWith("garaj:")
    const logisticsLocked = (
        field: "loading" | "unloading" | "date" | "client" | "cargo_type",
    ) => {
        const value = currentTripOrder?.[field]
        return isLogisticsOrder && value != null && value !== ""
    }

    const finalize = (approved: boolean) => {
        toast.success(
            approved
                ? t("reys_confirm.approved")
                : currentTripOrder?.id
                  ? t("messages.success_edit")
                  : t("messages.success_add"),
        )
        reset()
        clearKey(MANAGERS_ORDERS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [MANAGERS_ORDERS] })
        queryClient.invalidateQueries({
            queryKey: [MANAGERS_ORDERS_INTEGRATION_COUNT],
        })
    }

    const onSuccess = () => finalize(false)

    const submittingRef = useRef(false)
    const { mutate: create, isPending: creating } = usePost({ onSuccess })
    const { mutate: update, isPending: updating } = usePatch({})
    const { mutate: approve, isPending: approving } = usePost({})
    const isPending = creating || updating || approving

    const runApprove = (orderId: number) => {
        approve(
            `${MANAGERS_ORDERS}/${orderId}/approve`,
            {},
            {
                onSuccess: () => finalize(true),
                onError: () => toast.error(t("reys_confirm.error")),
            },
        )
    }

    const approveOnly = () => {
        if (!currentTripOrder?.id) return
        runApprove(currentTripOrder.id)
    }

    const onSubmit = (data: any) => {
        const activity = Number(data.activity) || 1
        const isReysSel = activity === 1
        const isCityOnlySel = activity === 4 || activity === 5
        const isNaqdSel = !!data.is_naqd

        if (isReysSel && !isNaqdSel && !matchedDirection) {
            toast.error(t("page.direction_config_not_found"))
            return
        }

        const formData = new FormData()
        formData.append("date", data.date)
        formData.append("trip", String(id))
        formData.append("activity", String(activity))
        formData.append("driver", data.driver ? String(data.driver) : "")
        formData.append("trailer_number", data.trailer_number ?? "")
        if (activity === 2 || activity === 3) {
            formData.append("started_at", data.started_at ?? "")
            formData.append("finished_at", data.finished_at ?? "")
        }

        if (isReysSel) {
            const incomes = isNaqdSel
                ? (data.incomes ?? []).map((inc: any) => ({
                    payment_type: inc.payment_type,
                    currency: 1,
                    amount: String(inc.amount ?? "0"),
                }))
                : [
                    {
                        payment_type: matchedDirection!.payment_type,
                        currency: 1,
                        amount:
                            matchedDirection!.amount != null
                                ? String(matchedDirection!.amount)
                                : "0",
                    },
                ]

            const isEmpty = !data.cargo_type || data.cargo_type === 0

            formData.append("loading", data.loading)
            formData.append("unloading", data.unloading)
            // S-06-03: integratsiya buyurtmasining turi (yukli/yuksiz) qulf — yuborilmaydi.
            if (!isLogisticsOrder) formData.append("type", isEmpty ? "2" : "1")
            formData.append("cargo_type", isEmpty ? "" : data.cargo_type)
            if (!isNaqdSel && data.client) {
                formData.append("client", String(data.client))
            }
            if (!isNaqdSel && matchedDirection) {
                formData.append("direction", String(matchedDirection.id))
            }
            // Yo'nalish narxi yo'q bo'lsa kirim yuborilmaydi (0 so'mlik kirim taqiqlangan).
            const hasIncomeAmount = isNaqdSel || Number(matchedDirection?.amount) > 0
            if (hasIncomeAmount && (isNaqdSel || !currentTripOrder?.manual_income)) {
                formData.append("incomes", JSON.stringify(incomes))
            }
        } else if (isCityOnlySel) {
            formData.append("loading", data.loading)
            if (activity === 4) formData.append("salary_amount", String(data.salary_amount ?? 0))
        }

        images.forEach((file) => formData.append("images", file))
        removedImageIds.forEach((imgId) =>
            formData.append("removed_images", String(imgId)),
        )

        if (submittingRef.current) return
        submittingRef.current = true
        const release = () => {
            submittingRef.current = false
        }

        if (currentTripOrder?.id) {
            if (!isDraft) {
                formData.append("status", String(Number(data.status)))
            }
            update(`${MANAGERS_ORDERS}/${currentTripOrder.id}`, formData, {
                onSettled: release,
                onSuccess: () => {
                    if (isDraft) {
                        runApprove(currentTripOrder.id)
                    } else {
                        finalize(false)
                    }
                },
            })
        } else {
            create(MANAGERS_ORDERS, formData, { onSettled: release })
        }
    }

    const { existingImages, removedImageIds, previewIndex, setPreviewIndex, rasmInputRef, images, addImages, removeNewImage, removeExistingImage, previewItems } = useReysImages(control, currentTripOrder)

    return (
        <>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4 max-h-[72vh] overflow-y-auto pr-1 no-scrollbar-x"
            >
                <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{t("trips.create_reys.trip_info")}</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <FormCombobox
                            required
                            hideError={false}
                            label={t("table.status")}
                            name="activity"
                            control={control}
                            options={ACTIVITY_OPTIONS_TRANSLATED}
                            valueKey="id"
                            labelKey="name"
                            placeholder={t("table.status")}
                            addButtonProps={{ disabled: isLogisticsOrder }}
                        />
                        {isLogisticsOrder && (
                            <p className="text-xs text-muted-foreground">
                                Integratsiyadan kelgan buyurtma: buyurtma
                                ma'lumotlari tahrirlanmaydi.
                            </p>
                        )}

                        {isReysActivity && (
                            <ReysRouteFields
                                control={control}
                                isNaqd={isNaqd}
                                setValue={setValue}
                                watch={watch}
                                clientsData={clientsData ?? []}
                                loadsData={loadsData}
                                unloadsData={unloadsData}
                                logisticsLocked={logisticsLocked}
                                loadingValue={loadingValue}
                            />
                        )}

                        {isCityOnlyActivity && (
                            <ReysCityFields control={control} loadsData={loadsData} activityValue={activityValue} />
                        )}

                        <ReysCommonFields
                            control={control}
                            isReysActivity={isReysActivity}
                            cargoTypesData={cargoTypesData}
                            driverOptions={driverOptions}
                            trailerOptions={trailerOptions}
                            logisticsLocked={logisticsLocked}
                            loadingValue={loadingValue}
                            unloadingValue={unloadingValue}
                        />


                        {isReysActivity && !isNaqd && directionOptions.length > 0 && (
                            <FormCombobox
                                label={t("form.direction")}
                                name="direction"
                                control={control}
                                options={directionOptions}
                                valueKey="id"
                                labelKey="name"
                                placeholder={t("form.direction")}
                            />
                        )}

                        {currentTripOrder?.id && <PriceDiff order={currentTripOrder} />}

                        {/* <NaqdAmountField methods={form} matchedDirection={matchedDirection} /> */}

                        {isGarajOrTamirActivity && (
                            <>
                                <FormDateTimePicker
                                    required
                                    control={control}
                                    name="started_at"
                                    label={t("table.start_time")}
                                    addButtonProps={{ className: "w-full justify-start text-left font-normal" }}
                                />
                                <FormDateTimePicker
                                    control={control}
                                    name="finished_at"
                                    label={t("table.end_time")}
                                    addButtonProps={{ className: "w-full justify-start text-left font-normal" }}
                                />
                            </>
                        )}

                        {currentTripOrder?.id && !isDraft && !isGarajOrTamirActivity && (
                            <FormCombobox
                                label={t("table.status")}
                                name="status"
                                control={control}
                                options={STATUS_OPTIONS}
                                valueKey="id"
                                labelKey="name"
                                placeholder={t("table.status")}
                                addButtonProps={{ disabled: isLogisticsOrder }}
                            />
                        )}
                    </div>
                </section>

                {isReysActivity && isNaqd && (
                    <ReysIncomesSection
                        control={control}
                        incomeFields={incomeFields}
                        allPaymentTypes={allPaymentTypes}
                        selectedPaymentTypeIds={selectedPaymentTypeIds}
                        incomes={incomes}
                        removeIncome={removeIncome}
                        appendIncome={appendIncome}
                    />
                )}

                <ReysImagesSection
                    previewItems={previewItems}
                    existingImages={existingImages}
                    images={images}
                    setPreviewIndex={setPreviewIndex}
                    removeExistingImage={removeExistingImage}
                    removeNewImage={removeNewImage}
                    addImages={addImages}
                    rasmInputRef={rasmInputRef}
                />

                <div className="flex justify-end gap-2 pt-1">
                    {isDraft && (
                        <Button
                            type="button"
                            variant="outline"
                            loading={approving}
                            disabled={isPending}
                            onClick={approveOnly}
                        >
                            {t("actions.confirm")}
                        </Button>
                    )}
                    <Button type="submit" loading={isPending} disabled={isPending}>
                        {isDraft ? t("trips.create_reys.save_and_approve") : t("actions.save")}
                    </Button>
                </div>
            </form>

            <ReysImagePreviewDialog previewIndex={previewIndex} setPreviewIndex={setPreviewIndex} previewItems={previewItems} />
        </>
    )
}

export default AddTripOrders

const toLocalInput = (value?: string | null) => (value ? format(new Date(value), "yyyy-MM-dd HH:mm") : "")
