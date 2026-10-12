export type DocType = "truck_passport" | "trailer_passport" | "driver_license"

export type DocTab = "drivers" | "vehicles"

export type DocStatus = "ok" | "expiring" | "expired" | null

export type DocumentCell = {
    id: number
    number: string
    issued_date: string | null
    expires_date: string | null
    status: DocStatus
    days_left: number | null
    photo_front: string | null
    photo_back: string | null
}

export type VehicleDocumentsRow = {
    id: number
    truck_number: string
    trailer_number: string | null
    shared_photos: boolean
    driver_name: string | null
    documents: Record<"truck_passport" | "trailer_passport", DocumentCell | null>
}

export type DriverDocumentsRow = {
    id: number
    full_name: string
    phone: string | null
    documents: Record<"driver_license", DocumentCell | null>
}

export type VehicleDocumentType = Partial<DocumentCell> & {
    doc_type: DocType
    vehicle?: number
    driver?: number
    owner_name?: string
}

export type DocumentAlert = {
    id: number
    doc_type: DocType
    doc_type_name: string
    tab: DocTab
    driver_name: string | null
    truck_number: string | null
    trailer_number: string | null
    expires_date: string | null
    status: DocStatus
    days_left: number | null
}

export type DocumentAlerts = {
    count: number
    expired: number
    expiring: number
    drivers: number
    vehicles: number
    results: DocumentAlert[]
}

export const DOC_TYPE_OPTIONS: { value: DocType; labelKey: string }[] = [
    { value: "truck_passport", labelKey: "documents_page.truck_passport" },
    { value: "trailer_passport", labelKey: "documents_page.trailer_passport" },
    { value: "driver_license", labelKey: "documents_page.driver_license" },
]

export const TAB_DOC_TYPES: Record<DocTab, DocType[]> = {
    drivers: ["driver_license"],
    vehicles: ["truck_passport", "trailer_passport"],
}

export const ALERT_DAYS = 5
export const MAX_PHOTO_MB = 10
