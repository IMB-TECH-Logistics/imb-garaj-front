import { cn } from "@/lib/utils"
import {
    Check,
    Edit,
    EllipsisVertical,
    Eye,
    RotateCcw,
    SquarePen,
    Trash2,
    Undo,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "../ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"

type Props = {
    menuMode?: boolean
    onEdit?: () => void
    onDelete?: () => void
    onUndo?: () => void
    onView?: () => void
    onRedo?: () => void
    onFinished?: () => void
    className?: string
    disabled?: boolean
    disabledTitle?: string
    editDisabledTitle?: string
}

export default function TableActions({
    menuMode = false,
    onEdit,
    onDelete,
    onUndo,
    onView,
    onRedo,
    onFinished,
    className,
    disabled = false,
    disabledTitle,
    editDisabledTitle,
}: Props) {
    const { t } = useTranslation()
    return menuMode ?
            <DropdownMenu>
                <DropdownMenuTrigger asChild className={className}>
                    <Button
                        variant="ghost"
                        className="!text-primary size-6 "
                        size={"icon"}
                        aria-label={t("actions.more")}
                        icon={<EllipsisVertical width={16} />}
                    />
                </DropdownMenuTrigger>
                <DropdownMenuContent sideOffset={1}>
                    {onView && (
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                onView()
                            }}
                            className="!text-green-500"
                        >
                            <Eye width={16} className="mr-1.5" />
                            {t("actions.view")}
                        </DropdownMenuItem>
                    )}
                    {onEdit && (
                        <DropdownMenuItem
                            disabled={disabled || !!editDisabledTitle}
                            title={disabled ? disabledTitle : editDisabledTitle}
                            onClick={(e) => {
                                e.stopPropagation()
                                onEdit()
                            }}
                            className="!text-primary"
                        >
                            <Edit width={16} className="mr-1.5" />
                            {t("actions.edit")}
                        </DropdownMenuItem>
                    )}
                    {onDelete && (
                        <DropdownMenuItem
                            disabled={disabled}
                            title={disabled ? disabledTitle : undefined}
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete()
                            }}
                            className="!text-red-500"
                        >
                            <Trash2 width={16} className="mr-1.5" />{" "}
                            {t("actions.delete")}
                        </DropdownMenuItem>
                    )}
                    {onUndo && (
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                onUndo()
                            }}
                            className="!text-red-500"
                        >
                            <Undo width={16} className="mr-1.5" /> {t("ui.table_actions.revert")}
                        </DropdownMenuItem>
                    )}
                    {onRedo && (
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                onRedo()
                            }}
                            className="!text-muted-foreground"
                        >
                            <RotateCcw width={16} className="mr-1.5" />{" "}
                            {t("ui.table_actions.recalculate")}
                        </DropdownMenuItem>
                    )}
                    {onFinished && (
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                onFinished()
                            }}
                            className="!text-muted-foreground"
                        >
                            <Check width={16} className="mr-1.5" /> {t("actions.finish")}
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        :   <div
                className={cn(
                    "flex items-center justify-center gap-3 py-2",
                    className,
                )}
            >
                {onFinished && (
                    <Button
                        aria-label={t("actions.finish")}
                        icon={<Check className="text-green-500" size={16} />}
                        size="sm"
                        className="p-0 h-3"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation()
                            onFinished()
                        }}
                    ></Button>
                )}
                {onView && (
                    <Button
                        aria-label={t("actions.view")}
                        icon={<Eye className="text-green-500" size={16} />}
                        size="sm"
                        className="p-0 h-3"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation()
                            onView()
                        }}
                    ></Button>
                )}
                {onEdit && (
                    <span title={disabled ? disabledTitle : editDisabledTitle} className="inline-flex" onClick={(e) => e.stopPropagation()}>
                        <Button
                            aria-label={t("actions.edit")}
                            icon={<SquarePen className="text-primary" size={16} />}
                            size="sm"
                            className="p-0 h-3"
                            variant="ghost"
                            disabled={disabled || !!editDisabledTitle}
                            onClick={(e) => {
                                e.stopPropagation()
                                onEdit()
                            }}
                        ></Button>
                    </span>
                )}
                {onDelete && (
                    <span title={disabled ? disabledTitle : undefined} className="inline-flex" onClick={(e) => e.stopPropagation()}>
                        <Button
                            aria-label={t("actions.delete")}
                            icon={<Trash2 className="text-red-500" size={16} />}
                            size="sm"
                            className="p-0 h-3"
                            variant="ghost"
                            disabled={disabled}
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete()
                            }}
                        ></Button>
                    </span>
                )}
                {onUndo && (
                    <Button
                        aria-label={t("actions.undo")}
                        icon={<Undo className="text-red-500" size={16} />}
                        size="sm"
                        className="p-0 h-3"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation()
                            onUndo()
                        }}
                    ></Button>
                )}
                {onRedo && (
                    <Button
                        aria-label={t("actions.restore")}
                        icon={<RotateCcw size={16} />}
                        size="sm"
                        className="p-0 h-3"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation()
                            onRedo()
                        }}
                    ></Button>
                )}
            </div>
}
