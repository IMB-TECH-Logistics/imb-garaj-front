import { cn } from "@/lib/utils"
import type { TechStatus } from "./types"
import { STATUS_DOT } from "./utils"

type Props = {
    status: TechStatus
    label?: string
    className?: string
}

const StatusDot = ({ status, label, className }: Props) => (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span
            className={cn(
                "inline-block size-2.5 rounded-full",
                STATUS_DOT[status],
                className,
            )}
        />
        {label && <span className="text-sm tabular-nums">{label}</span>}
    </span>
)

export default StatusDot
