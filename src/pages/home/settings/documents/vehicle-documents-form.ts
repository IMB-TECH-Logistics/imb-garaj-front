import { VehicleDocumentsRow } from "./types"

export type Photo = File | string | null

export type FormValues = {
    vehicle?: number
    truck_passport_number: string
    truck_passport_issued_date: string | null
    truck_passport_expires_date: string | null
    trailer_passport_number: string
    trailer_passport_issued_date: string | null
    trailer_passport_expires_date: string | null
    photo_front: Photo
    photo_back: Photo
    truck_passport_photo_front: Photo
    truck_passport_photo_back: Photo
    trailer_passport_photo_front: Photo
    trailer_passport_photo_back: Photo
}

export type PhotoField =
    | "photo_front"
    | "photo_back"
    | "truck_passport_photo_front"
    | "truck_passport_photo_back"
    | "trailer_passport_photo_front"
    | "trailer_passport_photo_back"

export const TRUCK_FIELDS: PhotoField[] = [
    "truck_passport_photo_front",
    "truck_passport_photo_back",
]
export const TRAILER_FIELDS: PhotoField[] = [
    "trailer_passport_photo_front",
    "trailer_passport_photo_back",
]

export const getDefaults = (row?: VehicleDocumentsRow): FormValues => {
    const truck = row?.documents.truck_passport
    const trailer = row?.documents.trailer_passport
    return {
        vehicle: row?.id,
        truck_passport_number: truck?.number ?? "",
        truck_passport_issued_date: truck?.issued_date ?? null,
        truck_passport_expires_date: truck?.expires_date ?? null,
        trailer_passport_number: trailer?.number ?? "",
        trailer_passport_issued_date: trailer?.issued_date ?? null,
        trailer_passport_expires_date: trailer?.expires_date ?? null,
        photo_front: null,
        photo_back: null,
        truck_passport_photo_front: truck?.photo_front ?? null,
        truck_passport_photo_back: truck?.photo_back ?? null,
        trailer_passport_photo_front: trailer?.photo_front ?? null,
        trailer_passport_photo_back: trailer?.photo_back ?? null,
    }
}
