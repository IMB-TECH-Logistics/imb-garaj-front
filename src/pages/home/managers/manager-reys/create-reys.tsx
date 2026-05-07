import { FormCombobox } from "@/components/form/combobox"
import { FormDatePicker } from "@/components/form/date-picker"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import {
    COMMON_DIRECTIONS,
    MANAGERS_ORDERS,
    TRIPS_ORDERS,
} from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { usePost } from "@/hooks/usePost"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import { ChevronLeft, ChevronRight, ImageIcon, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useController, useForm } from "react-hook-form"
import { toast } from "sonner"

type Option = { id: number; name: string }

type StatusOption = { id: string; name: string }

const STATUS_OPTIONS: StatusOption[] = [
    { id: "0", name: "Kutilmoqda" },
    { id: "1", name: "Boshlandi" },
    { id: "5", name: "Yuklanmoqda" },
    { id: "6", name: "Yo'lda" },
    { id: "7", name: "Tushirilmoqda" },
    { id: "2", name: "Yakunlandi" },
    { id: "3", name: "Bekor qilindi" },
    { id: "4", name: "Arxivlangan" },
]

type Direction = {
    id: number
    owner: number
    owner_name: string
    load: number
    load_name: string
    unload: number
    unload_name: string
    cargo_type: number
    cargo_type_name: string
    payment_type: number
    currency: 1 | 2
    amount: string | null
}

const distinctOptions = (
    rows: Direction[],
    picker: (d: Direction) => { id: number; name: string },
): Option[] => {
    const seen = new Set<number>()
    const out: Option[] = []
    for (const row of rows) {
        const { id, name } = picker(row)
        if (seen.has(id)) continue
        seen.add(id)
        out.push({ id, name })
    }
    return out.sort((a, b) => a.name.localeCompare(b.name))
}

const AddTripOrders = () => {
    const { id } = useParams({ strict: false })
    const queryClient = useQueryClient()
    const { getData, clearKey } = useGlobalStore()
    const { closeModal } = useModal(MANAGERS_ORDERS)
    const currentTripOrder = getData<TripOrdersRow>(MANAGERS_ORDERS)

    const form = useForm<any>({
        defaultValues: {
            loading: currentTripOrder?.loading,
            unloading: currentTripOrder?.unloading,
            trip: id,
            cargo_type: currentTripOrder?.cargo_type,
            date: currentTripOrder?.date ?? new Date().toISOString().split("T")[0],
            status:
                currentTripOrder?.status != null
                    ? String(currentTripOrder.status)
                    : "0",
            images: [] as File[],
        },
    })

    const directionPrefilledRef = useRef(false)

    const [existingImages, setExistingImages] = useState<
        { id: number; image: string }[]
    >(currentTripOrder?.images ?? [])
    const [removedImageIds, setRemovedImageIds] = useState<number[]>([])

    const { handleSubmit, control, reset, watch, setValue } = form

    const loadingValue = watch("loading")
    const unloadingValue = watch("unloading")
    const cargoTypeValue = watch("cargo_type")

    const prevLoadingRef = useRef(loadingValue)
    const prevUnloadingRef = useRef(unloadingValue)

    const { data: directionsResponse } = useGet<ListResponse<Direction>>(
        COMMON_DIRECTIONS,
        { params: { page_size: 10000 } },
    )

    const directions = useMemo(
        () => directionsResponse?.results ?? [],
        [directionsResponse],
    )

    const loadsData = useMemo(
        () =>
            distinctOptions(directions, (d) => ({
                id: d.load,
                name: d.load_name,
            })),
        [directions],
    )

    const unloadsData = useMemo(() => {
        if (!loadingValue) return []
        const rows = directions.filter((d) => d.load === Number(loadingValue))
        return distinctOptions(rows, (d) => ({
            id: d.unload,
            name: d.unload_name,
        }))
    }, [directions, loadingValue])

    const cargoTypesData = useMemo(() => {
        if (!loadingValue || !unloadingValue) return []
        const rows = directions.filter(
            (d) =>
                d.load === Number(loadingValue) &&
                d.unload === Number(unloadingValue),
        )
        return [
            { id: 0, name: "Yuksiz" },
            ...distinctOptions(rows, (d) => ({
                id: d.cargo_type,
                name: d.cargo_type_name,
            })),
        ]
    }, [directions, loadingValue, unloadingValue])

    const matchedDirection = useMemo(() => {
        if (currentTripOrder?.direction) {
            const byId = directions.find(
                (d) => d.id === Number(currentTripOrder.direction),
            )
            if (byId) return byId
        }
        if (!loadingValue || !unloadingValue) return undefined
        const cargoId = Number(cargoTypeValue)
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
        currentTripOrder?.direction,
    ])

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

    const onSuccess = () => {
        toast.success(
            currentTripOrder?.id ?
                "Buyurtma tahrirlandi!"
            :   "Buyurtma qo'shildi!",
        )
        reset()
        clearKey(TRIPS_ORDERS)
        closeModal()
        queryClient.refetchQueries({ queryKey: [MANAGERS_ORDERS] })
    }

    const { mutate: create, isPending: creating } = usePost({ onSuccess })
    const { mutate: update, isPending: updating } = usePatch({ onSuccess })
    const isPending = creating || updating

    const onSubmit = (data: any) => {
        if (!matchedDirection) {
            toast.error(
                "Tanlangan yo'nalish uchun sozlama topilmadi. Avval Yo'nalishlar sozlamasida yaratib oling.",
            )
            return
        }

        const incomes = [
            {
                payment_type: matchedDirection.payment_type,
                currency: matchedDirection.currency,
                amount:
                    matchedDirection.amount != null ?
                        String(matchedDirection.amount)
                    :   "0",
            },
        ]

        const isEmpty = !data.cargo_type || data.cargo_type === 0

        const formData = new FormData()
        formData.append("loading", data.loading)
        formData.append("unloading", data.unloading)
        formData.append("date", data.date)
        formData.append("trip", String(id))
        formData.append("type", isEmpty ? "2" : "1")
        formData.append("cargo_type", isEmpty ? "" : data.cargo_type)
        formData.append("direction", String(matchedDirection.id))
        formData.append("incomes", JSON.stringify(incomes))
        images.forEach((file) => formData.append("images", file))
        removedImageIds.forEach((imgId) =>
            formData.append("removed_images", String(imgId)),
        )

        if (currentTripOrder?.id) {
            formData.append("status", String(Number(data.status)))
            update(`${MANAGERS_ORDERS}/${currentTripOrder.id}`, formData)
        } else {
            create(MANAGERS_ORDERS, formData)
        }
    }

    const [previewIndex, setPreviewIndex] = useState<number | null>(null)
    const { field: imagesField } = useController({ name: "images", control })
    const rasmInputRef = useRef<HTMLInputElement>(null)
    const images: File[] = imagesField.value ?? []

    const addImages = (files: FileList | File[]) => {
        const newFiles = Array.from(files)
        imagesField.onChange([...images, ...newFiles])
    }

    const removeNewImage = (index: number) => {
        imagesField.onChange(images.filter((_, i) => i !== index))
    }

    const removeExistingImage = (imgId: number) => {
        setExistingImages((prev) => prev.filter((img) => img.id !== imgId))
        setRemovedImageIds((prev) => [...prev, imgId])
    }

    const previewItems = useMemo(
        () => [
            ...existingImages.map((img) => ({
                key: `e-${img.id}`,
                url: img.image,
            })),
            ...images.map((file, idx) => ({
                key: `n-${idx}`,
                url: URL.createObjectURL(file),
            })),
        ],
        [existingImages, images],
    )

    return (
        <>
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4 max-h-[72vh] overflow-y-auto pr-1 no-scrollbar-x"
        >
            {/* Qayerdan → Qayerga route visual */}
            <div className="rounded-lg border bg-card/50 p-4">
                <div className="flex gap-3">
                    {/* Connector */}
                    <div className="relative shrink-0 w-3">
                        <div className="absolute left-1/2 -translate-x-1/2 top-[18px] w-3 h-3 rounded-full bg-primary" />
                        <div
                            className="absolute left-1/2 -translate-x-1/2 w-px"
                            style={{
                                top: 30,
                                bottom: 18,
                                backgroundImage:
                                    "repeating-linear-gradient(to bottom, hsl(var(--primary)/0.4) 0px, hsl(var(--primary)/0.4) 5px, transparent 5px, transparent 10px)",
                            }}
                        />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-[18px] w-3 h-3 rounded-full border-2 border-primary bg-background" />
                    </div>

                    {/* Inputs stacked */}
                    <div className="flex flex-col gap-4 flex-1">
                        <FormCombobox
                            required
                            name="loading"
                            control={control}
                            options={loadsData}
                            valueKey="id"
                            labelKey="name"
                            placeholder="Qayerdan"
                        />
                        <FormCombobox
                            required
                            name="unloading"
                            control={control}
                            options={unloadsData}
                            valueKey="id"
                            labelKey="name"
                            placeholder="Qayerga"
                            addButtonProps={{ disabled: !loadingValue }}
                        />
                    </div>
                </div>

            </div>

            {/* Mahsulot turi + Sana */}
            <div className="flex gap-3">
                <div className="flex-1">
                    <FormCombobox
                        label="Mahsulot turi"
                        name="cargo_type"
                        control={control}
                        options={cargoTypesData}
                        valueKey="id"
                        labelKey="name"
                        placeholder="Yuksiz"
                        addButtonProps={{
                            disabled: !loadingValue || !unloadingValue,
                        }}
                    />
                </div>
                <div className="flex-1">
                    <FormDatePicker
                        required
                        label="Sana"
                        control={control}
                        name="date"
                        placeholder="Sanani tanlang"
                        className="w-full"
                    />
                </div>
            </div>

            {/* Status (faqat tahrirlashda) */}
            {currentTripOrder?.id && (
                <FormCombobox
                    label="Holati"
                    name="status"
                    control={control}
                    options={STATUS_OPTIONS}
                    valueKey="id"
                    labelKey="name"
                    placeholder="Holatni tanlang"
                />
            )}

            {/* Yuklangan rasmlar */}
            {previewItems.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {existingImages.map((img, index) => (
                        <div
                            key={`e-${img.id}`}
                            className="relative w-20 h-20 rounded-lg overflow-hidden border cursor-pointer"
                            onClick={() => setPreviewIndex(index)}
                        >
                            <img
                                src={img.image}
                                alt={`rasm-${img.id}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    removeExistingImage(img.id)
                                }}
                                className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm rounded-full p-0.5 hover:bg-destructive hover:text-white transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    {images.map((file, index) => (
                        <div
                            key={`n-${index}`}
                            className="relative w-20 h-20 rounded-lg overflow-hidden border cursor-pointer"
                            onClick={() =>
                                setPreviewIndex(existingImages.length + index)
                            }
                        >
                            <img
                                src={URL.createObjectURL(file)}
                                alt={`rasm-${index}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    removeNewImage(index)
                                }}
                                className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm rounded-full p-0.5 hover:bg-destructive hover:text-white transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Rasm yuklash */}
            <div
                className="border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors hover:border-primary/60 group"
                style={{ minHeight: 100 }}
                onClick={() => rasmInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault()
                    if (e.dataTransfer.files?.length) {
                        addImages(e.dataTransfer.files)
                    }
                }}
            >
                <div className="flex flex-col items-center justify-center gap-2 py-7 text-muted-foreground group-hover:text-primary transition-colors">
                    <ImageIcon size={28} strokeWidth={1.5} />
                    <span className="text-sm font-medium">
                        Rasm yuklash yoki bu yerga tashlang
                    </span>
                    <span className="text-xs">
                        Probeg / TTN rasmini yuklang
                    </span>
                </div>
            </div>
            <input
                ref={rasmInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                    if (e.target.files?.length) {
                        addImages(e.target.files)
                        e.target.value = ""
                    }
                }}
            />

            <div className="flex justify-end pt-1">
                <Button type="submit" loading={isPending} disabled={isPending}>
                    Saqlash
                </Button>
            </div>
        </form>

        <Dialog
            open={previewIndex !== null}
            onOpenChange={() => setPreviewIndex(null)}
        >
            <DialogContent className="max-w-2xl p-2">
                {previewIndex !== null && previewItems[previewIndex] && (
                    <div className="relative flex items-center justify-center">
                        {previewItems.length > 1 && (
                            <button
                                type="button"
                                onClick={() =>
                                    setPreviewIndex(
                                        (previewIndex - 1 + previewItems.length) %
                                            previewItems.length,
                                    )
                                }
                                className="absolute left-2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:bg-accent transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        <img
                            src={previewItems[previewIndex].url}
                            alt="preview"
                            className="w-full h-auto rounded-lg"
                        />
                        {previewItems.length > 1 && (
                            <button
                                type="button"
                                onClick={() =>
                                    setPreviewIndex(
                                        (previewIndex + 1) % previewItems.length,
                                    )
                                }
                                className="absolute right-2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:bg-accent transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
        </>
    )
}

export default AddTripOrders
