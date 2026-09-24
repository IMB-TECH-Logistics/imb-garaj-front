import { useDownloadAsExcel } from "@/hooks/useDownloadAsExcel"
import { Download } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "../ui/button"

type Props = {
    url: string
    name: string
    children?: ReactNode
    icon?: ReactNode
    variant?: ButtonVariant
    className?: string
    fileType?: string
    params?: Record<string, any>
}

const DownloadAsExcel = ({
    url,
    name,
    children = "Yuklab olish",
    icon = <Download width={16} />,
    variant = "secondary",
    className,
    fileType,
    params,
}: Props) => {
    const { trigger, isFetching } = useDownloadAsExcel({
        url,
        name,
        fileType,
        params,
    })
    return (
        <Button
            variant={variant}
            icon={icon}
            loading={isFetching}
            onClick={trigger}
            className={className}
        >
            {children}
        </Button>
    )
}

export default DownloadAsExcel
