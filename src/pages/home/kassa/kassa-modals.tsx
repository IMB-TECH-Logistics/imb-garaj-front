import { CHECKOUT_BALANCES, CHECKOUT_LOGS, CHECKOUT_SUMMARY, CHECKOUT_TRANSACTIONS, TRANSACTIONS } from "@/constants/api-endpoints"
import DeleteModal from "@/components/custom/delete-modal"
import Modal from "@/components/custom/modal"
import CheckoutAdjustModal from "./adjust-modal"
import CheckoutTransferModal from "./transfer-modal"
import CheckoutRequestModal from "./request-modal"
import { useTranslation } from "react-i18next"
import { Transaction } from "./transaction-cols"

export const KassaModals = ({ selected }: { selected: Transaction | null }) => {
    const { t } = useTranslation()
    return (
        <>
            <Modal
                modalKey="checkout-top-up"
                title={t("page.top_up_balance")}
                size="max-w-md"
            >
                <CheckoutAdjustModal
                    modalKey="checkout-top-up"
                    kind="income"
                />
            </Modal>
            <Modal
                modalKey="checkout-expense"
                title={t("page.add_expense")}
                size="max-w-md"
            >
                <CheckoutAdjustModal
                    modalKey="checkout-expense"
                    kind="expense"
                />
            </Modal>
            <Modal
                modalKey="checkout-edit"
                title={t("page.edit_record")}
                size="max-w-md"
            >
                <CheckoutAdjustModal
                    modalKey="checkout-edit"
                    kind={selected?.type === -1 ? "expense" : "income"}
                    editing={
                        selected ?
                            {
                                id: selected.id,
                                amount: selected.amount,
                                comment: selected.comment,
                                checkout_kind: selected.checkout_kind,
                            }
                        :   undefined
                    }
                />
            </Modal>
            <Modal
                modalKey="checkout-transfer"
                title={t("kassa.transfer_title")}
                size="max-w-md"
            >
                <CheckoutTransferModal modalKey="checkout-transfer" />
            </Modal>
            <Modal
                modalKey="checkout-request-create"
                title={t("kassa.request")}
                size="max-w-md"
            >
                <CheckoutRequestModal modalKey="checkout-request-create" />
            </Modal>
            <DeleteModal
                modalKey="checkout-delete"
                path={CHECKOUT_TRANSACTIONS}
                id={selected?.id}
                refetchKeys={[CHECKOUT_BALANCES, CHECKOUT_SUMMARY, TRANSACTIONS, CHECKOUT_LOGS]}
            />
        </>
    )
}
