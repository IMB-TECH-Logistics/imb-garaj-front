import { ParamCombobox } from "@/components/as-params/combobox"
import { SETTINGS_SELECTABLE_VEHICLE_TYPE } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"




export const optionYears = (
    valueKey: string = "id",
    labelKey: string = "name",
    startYear: number = new Date().getFullYear(),
    endYear: number = 2023,
) => {
    const years: {
        [valueKey]: number
        [labelKey]: string
    }[] = []

    for (let year = startYear; year >= endYear; year--) {
        years.push({
            [valueKey]: year,
            [labelKey]: year.toString(),
        })
    }

    return years
}

export const getMonths = (t: TFunction) => [
    { key: "01", name: t("fleet.months.m01") },
    { key: "02", name: t("fleet.months.m02") },
    { key: "03", name: t("fleet.months.m03") },
    { key: "04", name: t("fleet.months.m04") },
    { key: "05", name: t("fleet.months.m05") },
    { key: "06", name: t("fleet.months.m06") },
    { key: "07", name: t("fleet.months.m07") },
    { key: "08", name: t("fleet.months.m08") },
    { key: "09", name: t("fleet.months.m09") },
    { key: "10", name: t("fleet.months.m10") },
    { key: "11", name: t("fleet.months.m11") },
    { key: "12", name: t("fleet.months.m12") },
]

export const monthOnly = String(new Date().getMonth() + 1).padStart(2, "0")
export const yearOnly = new Date().getFullYear()

export default function ReportsFilter() {
    const { t } = useTranslation()
    const statusFilter = [
        { key: 1, name: t("status.loaded") },
        { key: 2, name: t("status.empty") },
        { key: 3, name: t("status.repair") },
    ]

    const { data: vehicleType } = useGet(SETTINGS_SELECTABLE_VEHICLE_TYPE, {
        params: {
            model_name: "vehicle-type"
        }
    })

    return (
        <aside className="flex items-center overflow-x-auto no-scrollbar gap-2 rounded-md ">
            <>
                {/* <ParamCombobox
                    paramName="region"
                    options={regions}
                    isSearch={false}
                    label="Viloyatlar"
                    className="w-full"
                    addButtonProps={{
                        className: "!bg-background dark:!bg-secondary",
                    }}
                /> */}
                <ParamCombobox
                    paramName="truck_type"
                    options={vehicleType}
                    isSearch={false}
                    labelKey={"name"}
                    valueKey={"id"}
                    label={t("nav.truck_types")}
                    className="w-full"
                    addButtonProps={{
                        className: "!bg-background dark:!bg-secondary",
                    }}
                />
                <ParamCombobox
                    paramName="status"
                    options={statusFilter}
                    isSearch={false}
                    valueKey="key"
                    labelKey="name"
                    label={t("table.status")}
                    className="w-full"
                    addButtonProps={{
                        className: "!bg-background dark:!bg-secondary",
                    }}
                />

                {/* <ParamCombobox
                    paramName="garage"
                    options={[
                        { key: "all", name: "Barchasi" },
                        { key: "garage", name: "Garaj" },
                        { key: "street", name: "Ko'cha" },
                    ]}
                    isSearch={false}
                    valueKey="key"
                    labelKey="name"
                    label="Transport egasi"
                    className="w-full"
                    addButtonProps={{
                        className: "!bg-background dark:!bg-secondary",
                    }}
                /> */}

                {/* <ParamCombobox
                    paramName="month"
                    options={months}
                    isSearch={false}
                    valueKey="key"
                    labelKey="name"
                    label="Oy"
                    className="w-full"
                    addButtonProps={{
                        className: "!bg-background dark:!bg-secondary",
                    }}
                    asloClear={["start_date", "end_date"]}
                />
                <ParamCombobox
                    paramName="year"
                    options={optionYears()}
                    isSearch={false}
                    asloClear={["start_date", "end_date"]}
                    label="Yil"
                    className="w-full"
                    addButtonProps={{
                        className: "!bg-background dark:!bg-secondary min-w-32",
                    }}
                /> */}
            </>
            {/* <ParamDateRange
                addButtonProps={{
                    className:
                        "!bg-background dark:!bg-secondary min-w-32 justify-start",
                }}
            /> */}
        </aside>
    )
}

// const statusOptions = [
//     { key: "all", name: "Barchasi" },
//     { key: "garage", name: "Yuklash uchun yo'lga chiqdi" },
//     { key: "street", name: "Yuklash uchun yetib bordi" },
//     { key: "street", name: "Yuklash boshlandi" },
//     { key: "street", name: "Yuklash yakunlandi" },
//     { key: "street", name: "Yo'lga chiqdi" },
//     { key: "street", name: "Yo'lda" },
//     { key: "street", name: "Yetib bordi" },
//     { key: "street", name: "Yuk tushirish boshlandi" },
//     { key: "street", name: "Yuk tushirish tugadi" },
//     { key: "street", name: "Yakunlandi" },
//     { key: "street", name: "Garaj mexanigi tasdiqlandi" },
// ]


// const regions = [
//     { id: 0, name: "Barchasi" },
//     { id: 1, name: "Qoraqalpog'iston Respublikasi" },
//     { id: 2, name: "Andijon viloyati" },
//     { id: 3, name: "Buxoro viloyati" },
//     { id: 4, name: "Farg'ona viloyati" },
//     { id: 5, name: "Jizzax viloyati" },
//     { id: 6, name: "Namangan viloyati" },
//     { id: 7, name: "Navoiy viloyati" },
//     { id: 8, name: "Qashqadaryo viloyati" },
//     { id: 9, name: "Samarqand viloyati" },
//     { id: 10, name: "Sirdaryo viloyati" },
//     { id: 11, name: "Surxondaryo viloyati" },
//     { id: 12, name: "Toshkent viloyati" },
//     { id: 13, name: "Toshkent shahri" },
//     { id: 14, name: "Xorazm viloyati" },
// ]

const truckType = [
    { id: 1, name: "FURA" },
    { id: 2, name: "ISUZU" },
    { id: 3, name: "LABO" },
    { id: 4, name: "DAMAS" },
    { id: 5, name: "NEXIA" },
    { id: 6, name: "COBALT" },
    { id: 7, name: "GENTRA" },
    { id: 8, name: "SPARK" },
    { id: 9, name: "MALIBU" },
    { id: 10, name: "CAPTIVA" },
    { id: 11, name: "TICO" },
    { id: 12, name: "MATIZ" },
    { id: 13, name: "DAEWOO" },
    { id: 14, name: "HYUNDAI" },
    { id: 15, name: "KAMAZ" },
    { id: 16, name: "GAZEL" },
    { id: 17, name: "FORD" },
    { id: 18, name: "MAN" },
    { id: 19, name: "MERCEDES" },
    { id: 20, name: "VOLVO" },
]
