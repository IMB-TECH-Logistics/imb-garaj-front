import { Button } from "@/components/ui/button"
import SeeInView from "@/components/ui/see-in-view"
import { formatDate } from "@/lib/format-date"
import { cn } from "@/lib/utils"
import { ColumnDef } from "@tanstack/react-table"
import { TFunction } from "i18next"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { DocumentCell, DriverDocumentsRow, VehicleDocumentsRow } from "./types"

const STATUS_CLASSES: Record<string, string> = {
    expired:
        "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800 font-semibold",
    expiring:
        "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800 font-semibold",
    ok: "border-transparent",
}

const statusHint = (doc: DocumentCell, t: TFunction) => {
    if (doc.days_left === null) return ""
    if (doc.days_left < 0)
        return t("documents_page.expired_ago", { days: -doc.days_left })
    if (doc.days_left === 0) return t("documents_page.expires_today")
    return t("documents_page.days_left", { days: doc.days_left })
}

const PhotoThumbs = ({ doc }: { doc: DocumentCell }) => {
    const { t } = useTranslation()
    const photos = [
        { url: doc.photo_front, label: t("documents_page.photo_front") },
        { url: doc.photo_back, label: t("documents_page.photo_back") },
    ].filter((p) => !!p.url)
    if (!photos.length) return null
    return (
        <span className="inline-flex items-center gap-1">
            {photos.map((p) => (
                <SeeInView key={p.label} url={p.url}>
                    <img
                        src={p.url as string}
                        alt={p.label}
                        title={p.label}
                        className="size-8 rounded border object-cover"
                    />
                </SeeInView>
            ))}
        </span>
    )
}

type CellProps = {
    doc: DocumentCell | null
    canEdit: boolean
    onClick: () => void
    withPhotos?: boolean
}

const DocCell = ({ doc, canEdit, onClick, withPhotos = true }: CellProps) => {
    const { t } = useTranslation()
    if (!doc) {
        return canEdit ?
                <button
                    type="button"
                    onClick={onClick}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                >
                    <Plus size={14} /> {t("documents_page.add_label")}
                </button>
            :   <span className="text-muted-foreground">-</span>
    }
    return (
        <span className="inline-flex items-center gap-2">
            <button
                type="button"
                disabled={!canEdit}
                onClick={onClick}
                title={[doc.number, statusHint(doc, t)]
                    .filter(Boolean)
                    .join(" · ")}
                className={cn(
                    "rounded-md border px-2 py-0.5 text-sm tabular-nums disabled:cursor-default",
                    canEdit && "hover:ring-1 hover:ring-primary/40",
                    STATUS_CLASSES[doc.status ?? "ok"],
                )}
            >
                {doc.expires_date ?
                    formatDate(doc.expires_date)
                :   t("documents_page.no_expiry")}
            </button>
            {withPhotos && <PhotoThumbs doc={doc} />}
        </span>
    )
}

export const useColumnsDriverDocuments = (
    canEdit: boolean,
    onEdit: (row: DriverDocumentsRow) => void,
    onDelete: (row: DriverDocumentsRow) => void,
) => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<DriverDocumentsRow>[]>(() => {
        const columns: ColumnDef<DriverDocumentsRow>[] = [
            {
                id: "driver_name",
                accessorKey: "full_name",
                header: t("documents_page.driver"),
                enableSorting: true,
            },
            {
                accessorKey: "phone",
                header: t("documents_page.phone"),
                enableSorting: true,
                cell: ({ row }) => row.original.phone || "-",
            },
            {
                id: "license_number",
                accessorFn: (row) => row.documents.driver_license?.number,
                header: t("documents_page.license_number"),
                enableSorting: true,
                cell: ({ row }) =>
                    row.original.documents.driver_license?.number || "-",
            },
            {
                id: "issued_date",
                accessorFn: (row) => row.documents.driver_license?.issued_date,
                header: t("documents_page.issued_date"),
                enableSorting: true,
                cell: ({ row }) => {
                    const date =
                        row.original.documents.driver_license?.issued_date
                    return date ? formatDate(date) : "-"
                },
            },
            {
                id: "expires_date",
                accessorFn: (row) => row.documents.driver_license?.expires_date,
                header: t("documents_page.expires_date"),
                enableSorting: true,
                cell: ({ row }) => (
                    <DocCell
                        withPhotos={false}
                        doc={row.original.documents.driver_license}
                        canEdit={canEdit}
                        onClick={() => onEdit(row.original)}
                    />
                ),
            },
            {
                id: "photos",
                header: t("documents_page.photos"),
                enableSorting: false,
                cell: ({ row }) => {
                    const doc = row.original.documents.driver_license
                    return doc ? <PhotoThumbs doc={doc} /> : "-"
                },
            },
        ]
        if (canEdit) {
            columns.push({
                id: "actions",
                header: " ",
                enableSorting: false,
                size: 120,
                cell: ({ row }) =>
                    row.original.documents.driver_license ?
                        <div className="flex items-center justify-end gap-2 pr-2">
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                title={t("actions.edit")}
                                onClick={() => onEdit(row.original)}
                            >
                                <Pencil size={16} />
                            </Button>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                                title={t("actions.delete")}
                                onClick={() => onDelete(row.original)}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    :   null,
            })
        }
        return columns
    }, [t, canEdit, onEdit, onDelete])
}

const VehiclePhotoThumbs = ({ row }: { row: VehicleDocumentsRow }) => {
    const { t } = useTranslation()
    const truck = row.documents.truck_passport
    const trailer = row.documents.trailer_passport
    const photos =
        row.shared_photos ?
            [
                {
                    url: truck?.photo_front,
                    label: t("documents_page.photo_shared_front"),
                },
                {
                    url: truck?.photo_back,
                    label: t("documents_page.photo_shared_back"),
                },
            ]
        :   [
                {
                    url: truck?.photo_front,
                    label: t("documents_page.photo_truck_front"),
                },
                {
                    url: truck?.photo_back,
                    label: t("documents_page.photo_truck_back"),
                },
                {
                    url: trailer?.photo_front,
                    label: t("documents_page.photo_trailer_front"),
                },
                {
                    url: trailer?.photo_back,
                    label: t("documents_page.photo_trailer_back"),
                },
            ]
    const visible = photos.filter((p) => !!p.url)
    if (!visible.length) return "-"
    return (
        <span className="inline-flex items-center gap-1">
            {visible.map((p) => (
                <SeeInView key={p.label} url={p.url as string}>
                    <img
                        src={p.url as string}
                        alt={p.label}
                        title={p.label}
                        className="size-8 rounded border object-cover"
                    />
                </SeeInView>
            ))}
        </span>
    )
}

export const useColumnsVehicleDocuments = (
    canEdit: boolean,
    onEdit: (row: VehicleDocumentsRow) => void,
    onDelete: (row: VehicleDocumentsRow) => void,
) => {
    const { t } = useTranslation()
    return useMemo<ColumnDef<VehicleDocumentsRow>[]>(() => {
        const columns: ColumnDef<VehicleDocumentsRow>[] = [
            {
                accessorKey: "truck_number",
                header: t("documents_page.truck_number"),
                enableSorting: true,
            },
            {
                accessorKey: "trailer_number",
                header: t("documents_page.trailer_number"),
                enableSorting: true,
                cell: ({ row }) => row.original.trailer_number || "-",
            },
            ...(["truck_passport", "trailer_passport"] as const).map(
                (docType): ColumnDef<VehicleDocumentsRow> => ({
                    id: `${docType}_expires`,
                    accessorFn: (row) => row.documents[docType]?.expires_date,
                    header: t(`documents_page.${docType}`),
                    enableSorting: true,
                    cell: ({ row }) =>
                        (
                            docType === "trailer_passport" &&
                            !row.original.trailer_number
                        ) ?
                            "-"
                        :   <DocCell
                                withPhotos={false}
                                doc={row.original.documents[docType]}
                                canEdit={canEdit}
                                onClick={() => onEdit(row.original)}
                            />,
                }),
            ),
            {
                id: "photos",
                header: t("documents_page.photos"),
                enableSorting: false,
                cell: ({ row }) => <VehiclePhotoThumbs row={row.original} />,
            },
        ]
        if (canEdit) {
            columns.push({
                id: "actions",
                header: " ",
                enableSorting: false,
                size: 120,
                cell: ({ row }) =>
                    (
                        row.original.documents.truck_passport ||
                        row.original.documents.trailer_passport
                    ) ?
                        <div className="flex items-center justify-end gap-2 pr-2">
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                title={t("actions.edit")}
                                onClick={() => onEdit(row.original)}
                            >
                                <Pencil size={16} />
                            </Button>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                                title={t("actions.delete")}
                                onClick={() => onDelete(row.original)}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    :   null,
            })
        }
        return columns
    }, [t, canEdit, onEdit, onDelete])
}
