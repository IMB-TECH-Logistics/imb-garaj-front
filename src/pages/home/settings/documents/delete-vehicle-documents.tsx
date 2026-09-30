import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import {
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    VEHICLE_DOCUMENT_ALERTS,
    VEHICLE_DOCUMENTS,
    VEHICLE_DOCUMENTS_TRUCKS,
} from "@/constants/api-endpoints"
import { useDelete } from "@/hooks/useDelete"
import { useModal } from "@/hooks/useModal"
import { handleFormError } from "@/lib/show-form-errors"
import { useGlobalStore } from "@/store/global-store"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { VehicleDocumentsRow } from "./types"

const DeleteVehicleDocumentsModal = () => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("delete-vehicle-docs")
    const { getData, clearKey } = useGlobalStore()
    const row = getData<VehicleDocumentsRow>(VEHICLE_DOCUMENTS_TRUCKS)
    const { mutateAsync } = useDelete()
    const [pending, setPending] = useState(false)

    const ids = [
        row?.documents.truck_passport?.id,
        row?.documents.trailer_passport?.id,
    ].filter((id): id is number => !!id)

    const handleDelete = async () => {
        setPending(true)
        try {
            for (const id of ids) {
                await mutateAsync(`${VEHICLE_DOCUMENTS}/${id}`)
            }
            toast.success(t("documents_page.deleted"))
            clearKey(VEHICLE_DOCUMENTS_TRUCKS)
        } catch (error) {
            handleFormError(error)
        } finally {
            setPending(false)
            closeModal()
            queryClient.refetchQueries({
                predicate: (q) =>
                    [VEHICLE_DOCUMENTS_TRUCKS, VEHICLE_DOCUMENT_ALERTS].includes(
                        q.queryKey[0] as string,
                    ),
            })
        }
    }

    return (
        <Modal size="max-w-md" modalKey="delete-vehicle-docs" titleInChildren>
            <DialogHeader>
                <DialogTitle className="font-normal max-w-sm">
                    {row?.truck_number && (
                        <span className="block font-medium mb-1 break-all">
                            {`«${row.truck_number} — ${t("documents_page.documents_title")}»`}
                        </span>
                    )}
                    {t("documents_page.delete_confirm")}
                </DialogTitle>
                <DialogDescription>
                    {t("documents_page.delete_irreversible")}
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
                <Button variant="outline" onClick={closeModal} disabled={pending}>
                    {t("actions.cancel")}
                </Button>
                <Button
                    variant="destructive"
                    onClick={handleDelete}
                    loading={pending}
                >
                    {t("actions.delete")}
                </Button>
            </DialogFooter>
        </Modal>
    )
}

export default DeleteVehicleDocumentsModal
