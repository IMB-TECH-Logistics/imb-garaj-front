export type DocType = "truck_passport" | "trailer_passport" | "driver_license"

export type DocStatus = "ok" | "expiring" | "expired" | null

export type DocumentCell = {
    id: number
    number: string
    issued_date: string | null
    expires_date: string | null
    status: DocStatus
    days_left: number | null
}

export type VehicleDocumentsRow = {
    id: number
    truck_number: string
    trailer_number: string | null
    driver: number | null
    driver_name: string | null
    documents: Record<DocType, DocumentCell | null>
}

export type VehicleDocumentType = DocumentCell & {
    vehicle: number
    truck_number: string
    trailer_number?: string | null
    driver_name?: string | null
    doc_type: DocType
    doc_type_name?: string
}

export type DocumentAlerts = {
    count: number
    expired: number
    expiring: number
    results: VehicleDocumentType[]
}

export const DOC_TYPE_OPTIONS: { value: DocType; label: string }[] = [
    { value: "truck_passport", label: "Texpasport (tyagach)" },
    { value: "trailer_passport", label: "Texpasport (tirkama)" },
    { value: "driver_license", label: "Haydovchilik guvohnomasi" },
]

export const DOC_TYPE_LABELS = Object.fromEntries(
    DOC_TYPE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<DocType, string>

export const ALERT_DAYS = 5
