import { useUser } from "@/constants/useUser"
import { cn } from "@/lib/utils"
import { Landmark, Wallet } from "lucide-react"
import { useTranslation } from "react-i18next"

export type PaymentMethod = "kassa" | "bank"

export const useBankEnabled = () => {
    const { data } = useUser()
    return !!data?.bank_enabled
}

const PaymentMethodToggle = ({
    value,
    onChange,
}: {
    value: PaymentMethod
    onChange: (next: PaymentMethod) => void
}) => {
    const { t } = useTranslation()
    const options: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
        { value: "kassa", label: t("bank_page.method_kassa"), icon: <Wallet size={16} /> },
        { value: "bank", label: t("bank_page.method_bank"), icon: <Landmark size={16} /> },
    ]
    return (
        <fieldset className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t("bank_page.method")}</span>
            <div className="grid grid-cols-2 gap-2">
                {options.map((o) => (
                    <button
                        key={o.value}
                        type="button"
                        onClick={() => onChange(o.value)}
                        className={cn(
                            "flex h-10 items-center justify-center gap-2 rounded-md border border-input text-sm shadow-sm transition-colors",
                            value === o.value ?
                                "border-primary bg-primary/10 text-primary font-medium"
                            :   "bg-background hover:bg-muted",
                        )}
                    >
                        {o.icon}
                        {o.label}
                    </button>
                ))}
            </div>
        </fieldset>
    )
}

export default PaymentMethodToggle
