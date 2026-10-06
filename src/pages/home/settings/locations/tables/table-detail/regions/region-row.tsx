import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { SETTINGS_REGIONS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { cn } from "@/lib/utils"
import { CirclePlus, MoreVertical, Pencil, Trash2 } from "lucide-react"
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
    selected: boolean
    onSelect: () => void
}

export const RegionRowTable = ({ region, index, selected, onSelect }: RegionRowProps) => {
    const hasControl = useHasAction("settings_locations_control")
    const { setData } = useGlobalStore()
    const { openModal: openCreateModal } = useModal("create-region")
    const { openModal: openDeleteModal } = useModal("delete-region")

    return (
        <TableRow
            className={cn("cursor-pointer", selected && "!bg-primary/10")}
            onClick={onSelect}
        >
            <TableCell>{index + 1}</TableCell>
            <TableCell className="max-w-0 w-full truncate font-bold" title={region.name}>
                {region.name}
                <Badge variant="secondary" className="ml-2 font-normal">
                    {region.children_count ?? 0}
                </Badge>
            </TableCell>
            <TableCell className="p-0 text-right w-[40px]">
                {hasControl && (
                    <RegionRowActions
                        onEdit={() => {
                            setData(SETTINGS_REGIONS, region)
                            openCreateModal()
                        }}
                        onDelete={() => {
                            setData(SETTINGS_REGIONS, region)
                            openDeleteModal()
                        }}
                    />
                )}
            </TableCell>
        </TableRow>
    )
}

export const PlacesTable = ({ region }: { region: RegionsType | null }) => {
    const { t } = useTranslation()
    const hasControl = useHasAction("settings_locations_control")
    const { setData } = useGlobalStore()
    const { openModal: openCreateModal } = useModal("create-region")
    const { openModal: openDeleteModal } = useModal("delete-region")

    const { data, isLoading } = useGet<ListResponse<RegionsType>>(SETTINGS_REGIONS, {
        params: { parent: region?.id, page_size: 1000 },
        enabled: !!region,
    })

    const handleAdd = () => {
        if (!region) return
        setData(SETTINGS_REGIONS, { parent: region.id, country: region.country })
        openCreateModal()
    }

    return (
        <div className="flex flex-col min-h-0 h-full">
            <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-semibold truncate">
                        {region ? region.name : t("form.place")}
                    </h3>
                    {region && <Badge>{data?.count ?? 0}</Badge>}
                </div>
                {hasControl && region && (
                    <Button
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={handleAdd}
                        icon={<CirclePlus size={16} />}
                    >
                        {t("actions.add")}
                    </Button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto">
                {!region ?
                    <p className="py-10 text-center text-sm text-muted-foreground">
                        {t("form.region")} tanlang
                    </p>
                :   <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10">#</TableHead>
                                <TableHead>{t("form.place")}</TableHead>
                                <TableHead className="w-[40px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={3}>
                                        <Skeleton className="h-6 w-full" />
                                    </TableCell>
                                </TableRow>
                            )}
                            {data?.results?.map((child, index) => (
                                <TableRow key={child.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="max-w-0 w-full truncate" title={child.name}>
                                        {child.name}
                                    </TableCell>
                                    <TableCell className="p-0 text-right w-[40px]">
                                        {hasControl && (
                                            <RegionRowActions
                                                onEdit={() => {
                                                    setData(SETTINGS_REGIONS, child)
                                                    openCreateModal()
                                                }}
                                                onDelete={() => {
                                                    setData(SETTINGS_REGIONS, child)
                                                    openDeleteModal()
                                                }}
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && data?.results?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                                        —
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                }
            </div>
        </div>
    )
}
