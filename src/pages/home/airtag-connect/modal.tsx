import { useEffect } from "react"
import { useModal } from "@/hooks/useModal"
import { useForm } from "react-hook-form"
import FormInput from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { useGlobalStore } from "@/store/global-store"
import { usePost } from "@/hooks/usePost"
import { AIRTAG_CONNECT_TO_ORDER } from "@/constants/api-endpoints"
import { toast } from "sonner"

interface ConnectForm {
    device_id: string
}

const ConnectModal = () => {
    const { closeModal } = useModal("airtag-connect")
    const { t } = useTranslation()
    const { getData } = useGlobalStore()
    const { mutate, isPending } = usePost()

    const selectedOrder = getData<AirtagOrder>("connect-order")

    const form = useForm<ConnectForm>()
    const { handleSubmit, setFocus } = form

    useEffect(() => {
        setTimeout(() => setFocus("device_id"), 100)
    }, [])

    useEffect(() => {
        const subscription = form.watch((values, { name }) => {
            if (name === "device_id" && values.device_id) {
                try {
                    const cleaned = values.device_id.replace(/^\{\.\s*/, "{")
                    const parsed = JSON.parse(cleaned)
                    if (parsed?.device_id) {
                        form.setValue("device_id", parsed.device_id)
                    }
                } catch { }
            }
        })
        return () => subscription.unsubscribe()
    }, [form])

    const onSubmit = handleSubmit((values) => {
        mutate(AIRTAG_CONNECT_TO_ORDER, {
            device_id: values.device_id,
            order_id: selectedOrder?.id,
        }, {
            onSuccess: () => {
                toast.success(t("Muvaffaqiyatli ulandi"))
                closeModal()
                form.reset()
            },
            onError: (error) => {
                toast.error(t(error))
            }
        },

        )
    })

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="text-sm text-muted-foreground">
                {t("Buyurtma")}: <span className="font-medium text-foreground">{selectedOrder?.extra_data?.order_code}</span>
                {" | SAP: "}
                <span className="font-medium text-foreground">{selectedOrder?.sap}</span>
            </div>
            <FormInput
                name="device_id"
                label={t("AirTag QR kod token")}
                placeholder={t("QR kodni skanerlang yoki linkni kiriting")}
                methods={form}
                required
            />
            <Button type="submit" className="w-full" disabled={isPending}>
                {t("Tasdiqlash")}
            </Button>
        </form>
    )
}

export default ConnectModal
