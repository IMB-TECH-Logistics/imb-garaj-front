

type PaginationProps = {
    totalPages?: number | undefined
    paramName?: string
    disabled?: boolean
    page_sizes?: number[]
    pageSizeParamName?: string
    changePageSize?: boolean
    PageSize?: number
}

type User = {
    id: number
    username: string
    first_name: string
    last_name: string
    role: number
    role_name: string
    actions: string[]
    is_superuser: boolean
    uuid?: string
    full_name?: string
    phone?: string | null
}

type MonthCalProps = {
    selectedMonth?: Date
    onMonthSelect?: (date: Date) => void
    onYearForward?: () => void
    onYearBackward?: () => void
    callbacks?: {
        yearLabel?: (year: number) => string
        monthLabel?: (month: Month) => string
    }
    variant?: {
        calendar?: {
            main?: ButtonVariant
            selected?: ButtonVariant
        }
        chevrons?: ButtonVariant
    }
    minDate?: Date
    maxDate?: Date
    disabledDates?: Date[]
    disabled?: boolean
}

type ButtonVariant =
    | "default"
    | "outline"
    | "ghost"
    | "link"
    | "destructive"
    | "secondary"
    | null
    | undefined
type Month = {
    number: number
    name: string
}



type NotificationItem = {
    id: number
    title: string
    description: string
    image?: string
    file?: string
    creator?: {
        id: number
        first_name: string
        last_name: string
        profile_photo: string
    }
    date: string
    is_read: boolean
    created_at: string
}


type ListResponse<T> = {
    page_size: number
    total_pages: number
    count: number
    results: T[]
}

type SelectableResponse<T> = {
    data?:T[]
}