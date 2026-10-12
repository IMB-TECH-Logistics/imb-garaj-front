import { useGet } from "@/hooks/useGet"
import { useTranslation } from "react-i18next"

export const useCarTypes = (props?: IuseCar) => {
    const { t } = useTranslation()
    const { data: carTypeData = [] } = useGet<Car[]>("common/options/", {
        params:{type: "car_type"},
    })
    const { data: carModelData = [] } = useGet<Car[]>("common/options/", {
        params:{type: "car_model"},
    })
    const { data: trailerTypeData = [] } = useGet<Car[]>("common/options/", {
        params:{type: "trailer_type"},
    })

    const formatData = (data: Car[], addNew: boolean) =>
        addNew ?
            [
                ...data.map((item) => ({
                    label: item.option_name,
                    value: item.option_name,
                    id: item.id,
                })),
                { label: t("vst.other"), value: "other", id: 1000 },
            ]
        :   data.map((item) => ({
                label: item.option_name,
                value: item.option_name,
                id: item.id,
            })) ?? []

    const car_type = formatData(carTypeData, props?.addNew || false)
    const car_model = formatData(carModelData, props?.addNew || false)
    const trailer_type = formatData(trailerTypeData, props?.addNew || false)

    return { car_type, car_model, trailer_type }
}

type IuseCar = {
    addNew?: boolean
}
  