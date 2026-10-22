export type AlertKind = "unassigned_drive" | "long_drive" | "oil_change" | "tire_change"

export type AlertSeverity = "info" | "warning" | "overdue"

export type AlertResolveReason = "auto_trip" | "auto_rest" | "auto_service" | "manual"

export type AlertItem = {
    id: number
    kind: AlertKind
    status: "open" | "resolved"
    severity: AlertSeverity
    vehicle: { id: number; truck_number: string }
    driver: { id: number; name: string } | null
    lot: { id: number; name: string; factory_number: string } | null
    title: string
    message: string
    started_at: string | null
    ended_at: string | null
    distance_km: number | null
    duration_minutes: number | null
    remaining_km: number | null
    remaining_days: number | null
    trip_id: number | null
    created_at: string
    updated_at: string
    resolved_at: string | null
    resolved_by_name: string | null
    resolve_reason: AlertResolveReason | null
    comment: string | null
    can_resolve: boolean
}

export type AlertListResponse = ListResponse<AlertItem> & {
    next: string | null
    previous: string | null
}

export type AlertCounts = {
    total: number
    unassigned_drive: number
    long_drive: number
    oil_change: number
    tire_change: number
}

export type AlertSettingsValues = {
    unassigned_km: number
    unassigned_minutes: number
    long_drive_hours: number
    rest_minutes: number
    oil_km: number
    oil_months: number
    tire_km: number
    warn_km: number
    warn_days: number
}

export type AlertSettings = AlertSettingsValues & {
    oil_category: { id: number; name: string } | null
}

export type VehicleAlertSettings = { [K in keyof AlertSettingsValues]: number | null } & {
    effective: AlertSettingsValues
}
