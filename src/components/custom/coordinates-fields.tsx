import FormInput from "@/components/form/input"
import { FieldValues, Path, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

type Props<T extends FieldValues> = {
    methods: UseFormReturn<T>
}

function CoordinatesFields<T extends FieldValues>({ methods }: Props<T>) {
    const { t } = useTranslation()
    return (
        <>
            <FormInput
                name={"coordinates" as Path<T>}
                label={t("coordinates.label")}
                placeholder="41.311081, 69.240562"
                methods={methods}
            />
            <FormInput
                name={"radius_m" as Path<T>}
                type="number"
                label={t("coordinates.radius")}
                placeholder="1000"
                methods={methods}
            />
            <p className="text-xs text-muted-foreground md:col-span-2">{t("coordinates.hint")}</p>
        </>
    )
}

export default CoordinatesFields
