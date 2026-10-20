import { COMMON_DIRECTIONS, MANAGERS_VEHICLES, MANAGERS_TRIPS, SETTINGS_DRIVERS, SETTINGS_CARGO_TYPE, SETTINGS_SELECTABLE_CLIENT, SETTINTS_PAYMENT_TYPE } from "@/constants/api-endpoints"
import { PaymentType } from "./payment-fields"
import { useGet } from "@/hooks/useGet"
import { useMemo, useRef, useState } from "react"
import { Control, useController } from "react-hook-form"
import { Direction } from "./create-reys-options"

export const useReysLookups = (id: string | undefined) => {
    const { data: directionsResponse } = useGet<ListResponse<Direction>>(
        COMMON_DIRECTIONS,
        { params: { page_size: 10000 } },
    )

    const { data: paymentTypesData } = useGet<ListResponse<PaymentType>>(
        SETTINTS_PAYMENT_TYPE,
        { params: { page_size: 1000000 } },
    )

    const { data: clientsData } = useGet<{ id: number; name: string }[]>(
        SETTINGS_SELECTABLE_CLIENT,
        { params: { model_name: "client" } },
    )

    const { data: cargoTypesResponse } = useGet<ListResponse<{ id: number; name: string }>>(
        SETTINGS_CARGO_TYPE,
        { params: { page_size: 1000 } },
    )

    const { data: tripData } = useGet<{ driver: number | null; vehicle: number | null }>(
        `${MANAGERS_TRIPS}/${id}`,
        { enabled: !!id && id !== "all" },
    )
    const { data: driversData } = useGet<ListResponse<{ id: number; first_name: string; last_name?: string }>>(
        SETTINGS_DRIVERS,
        { params: { page_size: 10000 } },
    )
    const driverOptions = useMemo(
        () =>
            (driversData?.results ?? []).map((d) => ({
                id: d.id,
                name: `${d.first_name} ${d.last_name || ""}`.trim(),
            })),
        [driversData],
    )
    const { data: managerVehicles } = useGet<ListResponse<{ id: number; trailer_number: string | null }>>(
        MANAGERS_VEHICLES,
        { params: { page_size: 10000 } },
    )
    const trailerOptions = useMemo(() => {
        const seen = new Set<string>()
        return (managerVehicles?.results ?? [])
            .map((v) => v.trailer_number)
            .filter((n): n is string => !!n && !seen.has(n) && !!seen.add(n))
            .sort()
            .map((n) => ({ id: n, name: n }))
    }, [managerVehicles])
    return { directionsResponse, paymentTypesData, clientsData, cargoTypesResponse, tripData, managerVehicles, driverOptions, trailerOptions }
}

export const useReysImages = (control: Control<any>, currentTripOrder: TripOrdersRow | undefined) => {
    const [existingImages, setExistingImages] = useState<
        { id: number; image: string }[]
    >(currentTripOrder?.images ?? [])
    const [removedImageIds, setRemovedImageIds] = useState<number[]>([])

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
    return { existingImages, removedImageIds, previewIndex, setPreviewIndex, rasmInputRef, images, addImages, removeNewImage, removeExistingImage, previewItems }
}
