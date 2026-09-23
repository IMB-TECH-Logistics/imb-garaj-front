import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { Button, buttonVariants } from "../ui/button"
import { DialogClose } from "../ui/dialog"

type Props = {
    loading?: boolean
    className?: string
    disabled?: boolean
    submitName?: string
    hideSubmit?: boolean
}

export default function FormAction({
    loading,
    disabled,
    className,
    submitName,
    hideSubmit = false,
}: Props) {
    const { t } = useTranslation()
    const label = submitName ?? t("actions.save")

    return (
        <div
            className={cn(
                "flex items-center justify-end gap-2 mt-2",
                className,
            )}
        >
            <DialogClose disabled={disabled || loading}>
                <div className={cn(buttonVariants({ variant: "outline" }))}>
                    {t("actions.back")}
                </div>
            </DialogClose>
            {!hideSubmit && (
                <Button loading={loading} type="submit" disabled={disabled}>
                    {label}
                </Button>
            )}
        </div>
    )
}
