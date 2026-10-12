import { useTranslation } from "react-i18next"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { X } from "lucide-react"
import { Button, ButtonProps } from "../ui/button"

type Props = {
    keys?: string[]
}

export default function FilterClearButton({
    keys = [],
    ...props
}: Props & ButtonProps) {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const params = useSearch({ strict: false })

    function handleClick() {
        if (keys.length) {
            const ns: Record<string, boolean | string | undefined> = {}
            for (const key of keys) {
                ns[key] = undefined
            }
            navigate({
                search: {
                    ...params,
                    ...ns,
                } as any,
            })
        } else
            navigate({
                search: {} as any,
            })
    }


    return (
        <Button
            size="icon"
            variant="destructive"
            aria-label={t("page.clear_filters")}
            {...props}
            onClick={handleClick}
        >
            <X size={20}/>
        </Button>
    )
}
