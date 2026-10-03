import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableRow } from "@/components/ui/table"
import { SETTINGS_REGIONS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { ChevronDown, CirclePlus, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

interface RegionRowActionsProps {
    onEdit: () => void
    onDelete: () => void
}

const RegionRowActions = ({ onEdit, onDelete }: RegionRowActionsProps) => {
    const { t } = useTranslation()
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={(e) => {
                        e.stopPropagation()
                        onEdit()
                    }}
                >
                    <Pencil className="mr-2 h-4 w-4" />
                    {t("actions.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                    }}
                    className="text-destructive focus:text-destructive"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("actions.delete")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

interface RegionRowProps {
    region: RegionsType
    index: number
    colSpan: number
}

export const RegionRowTable = ({ region, index, colSpan }: RegionRowProps) => {
    const { t } = useTranslation()
    const hasControl = useHasAction("settings_locations_control")
    const { setData } = useGlobalStore()
    const { openModal: openCreateModal } = useModal("create-region")
    const { openModal: openDeleteModal } = useModal("delete-region")
    const [expanded, setExpanded] = useState(false)

    const { data: children, isLoading } = useGet<ListResponse<RegionsType>>(
        SETTINGS_REGIONS,
        {
            params: { parent: region.id, page_size: 1000 },
            enabled: expanded,
        },
    )

    const handleEdit = (item: RegionsType) => {
        setData(SETTINGS_REGIONS, item)
        openCreateModal()
    }

    const handleDelete = (item: RegionsType) => {
        setData(SETTINGS_REGIONS, item)
        openDeleteModal()
    }

    const handleAddPlace = () => {
        setData(SETTINGS_REGIONS, { parent: region.id, country: region.country })
        openCreateModal()
    }

    const toggle = () => setExpanded((prev) => !prev)

    return (
        <>
            <TableRow className="cursor-pointer" onClick={toggle}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="max-w-0 w-full truncate font-bold" title={region.name}>
                    {region.name}
                    <Badge variant="secondary" className="ml-2 font-normal">
                        {region.children_count ?? 0}
                    </Badge>
                </TableCell>
                <TableCell className="p-0 text-right w-[40px] sticky right-10 bg-card">
                    {hasControl && (
                        <RegionRowActions
                            onEdit={() => handleEdit(region)}
                            onDelete={() => handleDelete(region)}
                        />
                    )}
                </TableCell>
                <TableCell className="text-right p-0 w-[40px] sticky right-0 bg-card">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                            e.stopPropagation()
                            toggle()
                        }}
                    >
                        <ChevronDown
                            className={`h-5 w-5 transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                    </Button>
                </TableCell>
            </TableRow>

            {expanded && isLoading && (
                <TableRow>
                    <TableCell colSpan={colSpan}>
                        <Skeleton className="h-6 w-full" />
                    </TableCell>
                </TableRow>
            )}

            {expanded &&
                children?.results?.map((child) => (
                    <TableRow key={child.id} className="bg-muted/40">
                        <TableCell />
                        <TableCell className="max-w-0 w-full truncate pl-8" title={child.name}>
                            {child.name}
                        </TableCell>
                        <TableCell className="p-0 text-right w-[40px] sticky right-10 bg-card">
                            {hasControl && (
                                <RegionRowActions
                                    onEdit={() => handleEdit(child)}
                                    onDelete={() => handleDelete(child)}
                                />
                            )}
                        </TableCell>
                        <TableCell className="w-[40px] sticky right-0 bg-card" />
                    </TableRow>
                ))}

            {expanded && hasControl && !isLoading && (
                <TableRow className="bg-muted/40">
                    <TableCell colSpan={colSpan} className="pl-8">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={handleAddPlace}
                            icon={<CirclePlus size={16} />}
                        >
                            {t("actions.add")} {t("form.place").toLowerCase()}
                        </Button>
                    </TableCell>
                </TableRow>
            )}
        </>
    )
}
