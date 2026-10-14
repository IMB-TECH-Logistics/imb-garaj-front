import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import {
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { VEHICLES } from "@/constants/api-endpoints"
import { useModal } from "@/hooks/useModal"
import { usePatch } from "@/hooks/usePatch"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

const RemoveTrailerModal = ({ item }: { item?: VehicleDetailType }) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { closeModal } = useModal("delete")

    const { mutate, isPending } = usePatch({
        onSuccess: () => {
            toast.success(t("messages.success_delete"))
            closeModal()
            queryClient.refetchQueries({ queryKey: [VEHICLES] })
        },
    })

    return (
        <Modal size="max-w-md" modalKey="delete" titleInChildren>
            <DialogHeader>
                <DialogTitle className="font-normal max-w-sm">
                    <span className="block font-medium mb-1 break-all">
                        {item?.trailer_number}
                    </span>
                    {t("settings.vehicles.remove_trailer_question")}
                </DialogTitle>
                <DialogDescription>
                    {t("settings.vehicles.remove_trailer_hint", { truck: item?.truck_number })}
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
                <Button variant="outline" onClick={closeModal} disabled={isPending}>
                    {t("actions.cancel")}
                </Button>
                <Button
                    variant="destructive"
                    loading={isPending}
                    onClick={() =>
                        mutate(`${VEHICLES}/${item?.id}`, {
                            trailer_number: null,
                            trailer_type: null,
                        })
                    }
                >
                    {t("actions.delete")}
                </Button>
            </DialogFooter>
        </Modal>
    )
}

export default RemoveTrailerModal
