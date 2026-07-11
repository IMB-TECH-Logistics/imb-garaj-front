type VehicleType = {
    id: 1
    number: string
    trailer_number: string
    type?:string|number
}

type VehicleRoleType = {
    id: number
    name: string
    type: string
    owner:number
}

type VehicleCashflowsType = {
    id: number
    vehicle_number: string
    category_name: string
    comment: string
    vehicle: number
    executor: number
    transaction: number
    category: number
}

type VehicleDetailType = {
    id: number
    driver_name: string
    trailer_type_name: string
    truck_type_name: string
    created: string
    updated: string
    truck_number: string
    truck_passport: string
    trailer_number: string
    fuel: string
    truck_type: number
    trailer_type: number
    driver: number
    owner: number
    year: number
    status: number
    registered_date: string
    consumption: number
    truck_front: string | File | null
    truck_back: string | File | null
    license_front: string | File | null
    license_back: string | File | null
    trailer_front: string | File | null
    trailer_back: string | File | null
}
type VehicleCashFlowAdd = {
    id: number
    vehicle: number
    amount: number
    category: number
    comment:string
}
