import { cn } from "@/lib/utils"
import {
    Edit,
    EllipsisVertical,
    Eye,
    RotateCcw,
    SquarePen,
    Trash2,
    Undo,
} from "lucide-react"
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
    className?: string
}

export default function TableActions({
    menuMode = false,
    onEdit,
    onDelete,
    onUndo,
    onView,
    onRedo,
    className,
}: Props) {
    return menuMode ?
            <DropdownMenu>
                <DropdownMenuTrigger asChild className={className}>
                    <Button
                        variant="ghost"
                        className="!text-primary size-6 "
                        size={"icon"}
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
                            {"Ko'rish"}
                        </DropdownMenuItem>
                    )}
                    {onEdit && (
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                onEdit()
                            }}
                            className="!text-primary"
                        >
                            <Edit width={16} className="mr-1.5" />
                            {"Tahrirlash"}
                        </DropdownMenuItem>
                    )}
                    {onDelete && (
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete()
                            }}
                            className="!text-red-500"
                        >
                            <Trash2 width={16} className="mr-1.5" />{" "}
                            {"O'chirish"}
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
                            <Undo width={16} className="mr-1.5" /> {"Qaytarish"}
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
                            {"Hisoblash"}
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
                {onView && (
                    <Button
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
                    <Button
                        icon={<SquarePen className="text-primary" size={16} />}
                        size="sm"
                        className="p-0 h-3"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit()
                        }}
                    ></Button>
                )}
                {onDelete && (
                    <Button
                        icon={<Trash2 className="text-red-500" size={16} />}
                        size="sm"
                        className="p-0 h-3"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete()
                        }}
                    ></Button>
                )}
                {onUndo && (
                    <Button
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
