import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { useModal } from "@/hooks/useModal"
import { useQueryClient } from "@tanstack/react-query"
import { Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { ContragentType, KONTRAGENT, Kontragent, kontragentUrl, useRefreshFinance } from "./api"
import { AddContragentForm, CONTRAGENT_DELETE, CONTRAGENT_EDIT } from "./forms"

export const EditDeleteActions = ({ row, listUrl, fixedType }: { row: Kontragent; listUrl: string; fixedType?: ContragentType }) => {
    const { t } = useTranslation()
    const refresh = useRefreshFinance()
    const qc = useQueryClient()
    const own = kontragentUrl(row.id)
    const onDeleted = () => {
        qc.removeQueries({ predicate: (q) => String(q.queryKey[0]).startsWith(own) })
        refresh()
    }
    const { openModal: openEdit } = useModal(CONTRAGENT_EDIT)
    const { openModal: openDelete } = useModal(CONTRAGENT_DELETE)

    return (
        <>
            <Button variant="outline" size="icon" aria-label={t("actions.edit")} title={t("actions.edit")} onClick={openEdit}>
                <Pencil className="w-4 h-4" />
            </Button>
            <Button
                variant="outline"
                size="icon"
                className="text-destructive hover:text-destructive"
                aria-label={t("actions.delete")}
                title={t("actions.delete")}
                onClick={openDelete}
            >
                <Trash2 className="w-4 h-4" />
            </Button>
            <Modal title={t("actions.edit")} modalKey={CONTRAGENT_EDIT}>
                <AddContragentForm key={row.id} initial={row} fixedType={fixedType} modalKey={CONTRAGENT_EDIT} />
            </Modal>
            <DeleteModal
                path={KONTRAGENT}
                id={row.id}
                name={`«${row.name}»`}
                modalKey={CONTRAGENT_DELETE}
                disableRefetch
                onSuccessAction={onDeleted}
                url={listUrl}
            />
        </>
    )
}
