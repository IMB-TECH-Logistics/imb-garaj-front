import CoordinatesCell from "@/components/custom/coordinates-cell"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { SETTINGS_GARAGE_AREAS } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useModal } from "@/hooks/useModal"
import { useGlobalStore } from "@/store/global-store"
import { ColumnDef } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import AddGarageArea, { type GarageArea } from "./add-garage-area"

const GarageAreas = () => {
    const { t } = useTranslation()
    const hasControl = useHasAction("settings_garage_areas_control")
    const { data, isLoading } = useGet<GarageArea[]>(SETTINGS_GARAGE_AREAS)
    const { getData, setData, clearKey } = useGlobalStore()
    const item = getData<GarageArea>(SETTINGS_GARAGE_AREAS)
    const { openModal: openDeleteModal } = useModal("delete")
    const { openModal: openCreateModal } = useModal("create")

    const columns = useMemo<ColumnDef<GarageArea>[]>(
        () => [
            { accessorKey: "name", header: t("form.name") },
            {
                id: "coordinates",
                header: t("coordinates.title"),
                cell: ({ row }) => (
                    <CoordinatesCell
                        lat={row.original.lat}
                        lng={row.original.lng}
                        radius={row.original.polygon ? null : row.original.radius_m}
                    />
                ),
            },
            {
                id: "shape",
                header: t("settings.garage_areas.shape"),
                cell: ({ row }) =>
                    row.original.polygon ?
                        t("settings.garage_areas.shape_polygon")
                    :   t("settings.garage_areas.shape_circle", { radius: row.original.radius_m }),
            },
        ],
        [t],
    )

    const handleAdd = () => {
        clearKey(SETTINGS_GARAGE_AREAS)
        openCreateModal()
    }

    return (
        <>
            <DataTable
                loading={isLoading}
                columns={columns}
                data={data}
                numeration
                onDelete={
                    hasControl ?
                        ({ original }) => {
                            setData(SETTINGS_GARAGE_AREAS, original)
                            openDeleteModal()
                        }
                    :   undefined
                }
                onEdit={
                    hasControl ?
                        ({ original }) => {
                            setData(SETTINGS_GARAGE_AREAS, original)
                            openCreateModal()
                        }
                    :   undefined
                }
                head={
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div>
                            <h1 className="text-xl font-semibold">{t("nav.garage_areas")}</h1>
                            <p className="text-sm text-muted-foreground">{t("settings.garage_areas.hint")}</p>
                        </div>
                        {hasControl && (
                            <Button icon={<Plus size={16} />} onClick={handleAdd}>
                                {t("actions.add")}
                            </Button>
                        )}
                    </div>
                }
            />
            <DeleteModal path={SETTINGS_GARAGE_AREAS} id={item?.id} name={item?.name} />
            <Modal
                size="max-w-2xl"
                title={item?.id ? t("settings.garage_areas.edit_title") : t("settings.garage_areas.add_title")}
                modalKey="create"
            >
                <AddGarageArea />
            </Modal>
        </>
    )
}

export default GarageAreas
