import i18n from "@/i18n/i18n"

const L = (key: string) => i18n.t(`core.trip_status.${key}`)

const item = (key: string, value: number) => ({
    get label() {
        return L(key)
    },
    value,
})

export const statuss = [
    item("start", 50),
    item("queue", 60),
    item("loading", 70),
    item("loaded", 80),
    item("at_unloading", 90),
    item("finish", 100),
]

export const statussAll = [
    {
        get label() {
            return i18n.t("status.all")
        },
        value: 0,
    },
    ...statuss,
]

export const statusLabel: { [key: number]: string } = {
    get 0() {
        return i18n.t("status.all")
    },
    get 50() {
        return L("start")
    },
    get 60() {
        return L("queue")
    },
    get 70() {
        return L("loading")
    },
    get 80() {
        return L("loaded")
    },
    get 90() {
        return L("at_unloading")
    },
    get 100() {
        return L("finish")
    },
}

interface UseStatusesProps {
    all?: boolean
    start?: boolean
    finish?: boolean
    from?: number
    onlyNext?: boolean
}

export const useStatuses = (props?: UseStatusesProps) => {
    let filteredStatuses = [...statuss]

    if (props?.all === false) {
        filteredStatuses = filteredStatuses.filter(
            (status) => status.value !== 40,
        )
    }

    if (props?.start === false) {
        filteredStatuses = filteredStatuses.filter(
            (status) => status.value !== 50,
        )
    }

    if (props?.finish === false) {
        filteredStatuses = filteredStatuses.filter(
            (status) => status.value !== 100,
        )
    }

    if (props?.from) {
        const startIndex = filteredStatuses.findIndex(
            (status) => status.value === props.from,
        )
        if (startIndex !== -1) {
            filteredStatuses = filteredStatuses.slice(
                startIndex + 1,
                props.onlyNext ? startIndex + 2 : undefined,
            )
        } else {
            filteredStatuses = []
        }
    }

    return filteredStatuses
}
