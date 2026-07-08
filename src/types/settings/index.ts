type ForceMajor = {
    accountant_number: string
    car_model: string
    car_type: string | null
    card: number
    cash: number
    code: string
    comment: string
    company_code: number
    contract: string | null
    contract_date: any
    created_at: string
    departure_point: string
    destination: string
    driver_jsh: number
    from_lat: string
    from_long: string
    full_name: string
    id: number
    payment_type: string
    phone_number: string
    reject_comment: string | null
    score: number | null
    shipper_inn: number
    shipper_name: string
    status: string
    summa_perechisleniya: number
    to_lat: string
    to_long: string
    trailer_id: string
    trailer_type: string
    truck_id: string
    wanted_date: string
    waybill: string | null
    reyestr_comment: string | null
}

type Driver = {
    lat: string
    long: string
    telegram_username: string
    trailer_type: string
    truck_id: string
    user: {
        id: number
        first_name: string
        last_name: string
        username: string
    }
    timestamp: string
}

type TExcelPassword = {
    id: number
    name: string
    password: string
}

type OptionResType = {
    id: number
    name: string
    created_at: string
    update_at: string
    type: string
}

type SearchParamsProvinces = {
    provinces_search?: string
    provinces_page_size?: number
    provinces_page?: number
}

// DistrictsType

type DistrictsType = {
    id: number
    name: string
    region: string | number
    created_at: string
}

type SearchParamsDistricts = {
    districts_search?: string
    districts_page_size?: number
    districts_page?: number
}

// Hr

type StatusType = {
    face: string
    id: number
    full_name: string
    user: string
    start: string
    end: string
    comment: string
    response_comment: string
    status: string | number
}

type PenaltyRule = {
    start: string
    end: string
    amount: string
    unit: string
    type?: number
}

type FormValuesFines = {
    id: number
    name: string
    lateness_rules: PenaltyRule[]
    early_departure_rules: PenaltyRule[]
    times: PenaltyRule[]
    absence_amount: string
    absence_unit: number | string
    start: string
    end: string
    is_absent: boolean
}

type ShiftRule = {
    day: number
    work_day: boolean
    start: string
    end: string
    has_lunch: boolean
    lunch_end: string
    lunch_start: string
}

type FormValuesShift = {
    id: number
    name: string
    start: string
    days: number
    shift_days: ShiftRule[]
}

type FormValuesSchedule = {
    id: number
    name?: string
    type: string
    is_last_date?: string
    schedule_day?: number
    weeks_to_repeat: number
    week_day: number
    role_count: number
    employee_count: number
    range_dates: RangeDateItem[]
    range_salary_type?: RangeDateItem[]
}

type RangeDateItem = {
    date: string
    percentage: number
}

type MonthlySucheduleHuman = {
    face?: string
    id: number
    phone_number: string | number
    role_name: string
    salary: number | string | undefined
    full_name?: string
    shift_name?: string
    salary_type?: string
}

type Department = {
    id: number
    name: string
    company: number
    company_name: string
}

type Position = {
    id: number
    name: string
    salary: number
    fine: number
    shift: number
    fine_name?: string
    shift_name?: string
    count: number
    start?: string
    department: number
    department_name: string
    company_name: string
}

type CustomersType = {
    id: number
    name: string
    phone_number: string
}
type UserType = {
    id: number
    password: string
    is_superuser: boolean
    username: string
    first_name: string
    last_name: string
    is_staff: boolean
    is_active: boolean
    role: number
    role_name: string
    actions: string[]
}

type DriversType = {
    id: number
    driver: DriverInfoType
    password: string
    last_login: string
    is_superuser: boolean
    username: string
    first_name: string
    last_name: string
    date_joined: string
    is_staff: boolean
    is_active: boolean
    role: number
}

type DriverInfoType = {
    passport_serial: string
    pinfl: string
    phone: string
    driver_license: string
    driver_license_date: string
    experience: string
}

// SETTING/LOCATION

// regions

type RegionsType = {
    id: number
    name: string
    country: number
}

// district

type SettingsDistrictType = {
    id: number
    name: string
    region: number
}
