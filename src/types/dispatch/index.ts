type OrderDispatchData = {
    id: number;
    external_id?: string | null
    is_integration?: boolean
    driver_type: number
    note1:string
    note2:string
    code: string;
    client_id: number
    passport_number: number
    dispatcher_name: string
    status:number;
    created_at: string;
    date: string;
    creator_name: string;
    distributor:number
    comment: string;
    full_name:string
    payment_types: string[];
    loading_name: string
    unloading_name: string
    contact_id: number
    client_code: string
    ttn:number
    type:string
    paid_data: {
        card: boolean
        cash: boolean
        transfer: boolean
    }
    is_paid: boolean
    exist_images?: boolean
    ttn_document_url: string
    manager_comment?: string
    truck_type: string
    waybill: string
    criteria_list: string[]
    truck_id: string
    phone_number: string
    cash_amount?: number | string
    card_amount?: number | string
    has_offer: boolean
    transfer_amount?: number | string
    amount: number
    is_commented: boolean
    is_blocked: boolean
    extra_data: {
        loading_name: string
        unloading_name: string
        truck_type: string
    }
    dispatcher: {
        id: number
        full_name: string
    } | null
    get_time: string
    contact: ContactField
    rejected_time?: string
    updated_at?: string
    sub_status?: number
    loading_id?: number | string
    created_through?: number | string
}


type ContactField = {
    offer: number;
    action: "approve" | string;
    is_blocked: boolean
    cause: string;
    comment: string;
    trailer_type: number;
    full_name: string
    truck_model: number;
    phone: string;
    truck_id: string;
    trailer_id: string;
    cash_amount: number;
    card_amount: number;
    transfer_amount: number;
    ttn: string;
    code: string;
    date: string;
    start_time: string;
    is_now: boolean;
    payment_types: string[];
    waybill: string
    demurrage: string;
    status: number;
    paid: boolean;
    extra_data: string;
    client: number;
    loading: number;
    unloading: number;
    dispatcher: number;
    agent: number;
    creator: number;
    contact: number;
    truck_type: number;
    product: number;
    distributor: number;
    price_state_executor: number;
    criteria: number[];
    order?: string
    passport_number: string
    truck_passport_number?: string
    trailer_passport_number?: string
    trailer_front?: string
    trailer_back?: string
    license_front?: string
    license_back?: string
    truck_type_name?: string
    truck_model_name?: string
    trailer_type_name?: string
    shipper_inn?: string

    id: number
    truck_front: string,
    truck_back: string,
    first_name: string,
    last_name: string,
    middle_name: string,
    birth_date: string,
    birth_place: string,
    given_location: string,
    given_date: string,
    expiration_date: string,
    categories: string[] | string,
    residence: string,
    truck_manufacture_place: string,
    truck_given_date: string,
    truck_full_name: string,
    trailer_full_name: string
    truck_company: string,
    truck_residence: string,
    is_contacted: boolean,
    telegram_id: number,
    type: string,
    responsible_staff: number
    license_id: string
    color: string
    trailer_color: string
    trailer_given_date: string
    tr_ck_color: string
    truck_yhx: string
    trailer_yhx: string

    tr_ck_year: number
    tr_ck_model: string
    tr_ck_system: string
    tr_ck_brutto: number
    tr_ck_tara: number
    tr_ck_engine_number: string
    tr_ck_engine: number
    tr_ck_fuel: string
    tr_ck_seats: number
    tr_ck_users: number
    tr_ck_specials: string
    tr_ck_passport_number: string
    tr_ck_serial: string

    truck_color: string
    truck_year: string
    truck_serial: string
    truck_system: string
    truck_brutto: string
    truck_tara: string
    truck_engine_number: string
    truck_engine: string
    truck_fuel: string
    truck_seats: string
    truck_users: string
    truck_specials: string

    trailer_year: number
    trailer_model: string
    trailer_system: string
    trailer_brutto: number
    trailer_tara: number
    trailer_engine_number: string
    trailer_engine: number
    trailer_fuel: string
    trailer_seats: number
    trailer_users: number
    trailer_specials: string
    trailer_serial: string
}




type ContactComment = {
    id: number;
    first_name: string;
    last_name: string;
    rate: number;
    comment: string;
}