interface AirtagDevice {
    id: number
    device_id: string
    device_index: number
    device_uuid: string
    created_at: string
    status: number
    comment: string
}

interface CreateAirtagDeviceForm {
    device_id: number | string
    device_index?: number | string
    device_uuid?: string
    comment?: string
}

interface AirtagOrderExtraData {
    products: number[]
    order_code: string
    start_time?: string
    finish_time?: string | null
    loaded_time?: string
    loading_time?: string
    truck_number?: string
    expected_date?: string
    analysing_time?: string
    invoice_number?: string
    trailer_number?: string
    driver_full_name?: string
    driver_phone_number?: string
    logistic_created_at?: string
    in_loading_point_time?: string
    transport_planning_pt?: string
    in_unloading_point_time?: string
    delivery?: string
    billing_type?: string
    plate_number?: string
    service_agent?: string
    shipment_type?: string
    forwarding_agent?: string
    storage_location?: string
    distribution_type?: string
    total_gross_weight?: number
}

interface AirtagOrder {
    id: number
    sap: string
    order_id: number | null
    created_at: string
    status: number
    extra_data: AirtagOrderExtraData
    distributor_id: number
}
