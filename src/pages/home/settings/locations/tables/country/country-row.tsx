import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableCell, TableRow } from "@/components/ui/table"
import { SETTINGS_COUNTRIES } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { ChevronDown, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CountriesDetailRow } from "../table-detail"

interface CountryRowTableType {
    countries: RolesType
    index: number
    colSpan?: number
}

export const CountryRowTable = ({
    countries,
    index,
    colSpan,
}: CountryRowTableType) => {
    const { t } = useTranslation()
    const search = useSearch({ strict: false })
    const hasControl = useHasAction("settings_locations_control")
    const { setData } = useGlobalStore()
    const { openModal: openCreateModal } = useModal("country-modal")
    const { openModal: openDeleteModal } = useModal("delete-country")

    const { country, region, ...otherSearchParams } = search as any
    const navigate = useNavigate()

    const cols = [
        {
            value: countries.name,
        },
    ]

    const handleRowClick = () => {
        const hasId = country === String(countries.id)

        const updateSearch = (prev: Record<string, unknown>) => {
            const updated = {
                ...prev,
                country: hasId ? undefined : String(countries.id),
                region: undefined,
            }

            return updated as Record<string, unknown>
        }

        navigate({
            search: updateSearch as any,
        })
    }

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation()
        setData(SETTINGS_COUNTRIES, countries)
        openCreateModal()
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation()
        setData(SETTINGS_COUNTRIES, countries)
        openDeleteModal()
    }

    const handleChevronClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        handleRowClick()
    }

    const totalColSpan = colSpan || 10

    return (
        <>
            <TableRow
                className={`cursor-pointer ${country == String(countries.id) ? "bg-secondary" : ""}`}
                onClick={handleRowClick}
            >
                <TableCell>{index + 1}</TableCell>

                {cols.map((cell, i) => (
                    <TableCell
                        key={i}
                        className="max-w-0 w-full truncate"
                        title={cell?.value}
                    >
                        {cell?.value}
                    </TableCell>
                ))}

                <TableCell className="p-0 text-right w-[40px]">
                    {hasControl && (
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
                                <DropdownMenuItem onClick={handleEdit}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    {t("actions.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={handleDelete}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t("actions.delete")}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </TableCell>

                <TableCell className="text-right p-0 w-[40px]">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={handleChevronClick}
                    >
                        <ChevronDown
                            className={`h-5 w-5 transition-transform ${
                                country == String(countries.id) ? "rotate-180"
                                :   ""
                            }`}
                        />
                    </Button>
                </TableCell>
            </TableRow>

            {country == String(countries.id) && (
                <TableRow>
                    <TableCell colSpan={totalColSpan} className="p-0">
                        <CountriesDetailRow
                            country_id={parseInt(countries.id)}
                        />
                    </TableCell>
                </TableRow>
            )}
        </>
    )
}
