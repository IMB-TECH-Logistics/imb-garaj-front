import { Button } from "@/components/ui/button"
import { generatePassword } from "@/lib/generate-password"
import { Copy, Eye, EyeOff, WandSparkles } from "lucide-react"
import { useState } from "react"
import { FieldValues, Path, PathValue, UseFormReturn, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { FormInput } from "./input"

interface PasswordFieldProps<IForm extends FieldValues> {
    methods: UseFormReturn<IForm>
    name: Path<IForm>
    label?: string
    required?: boolean
    placeholder?: string
}

export function PasswordField<IForm extends FieldValues>({
    methods,
    name,
    label,
    required,
    placeholder,
}: PasswordFieldProps<IForm>) {
    const { t } = useTranslation()
    const [visible, setVisible] = useState(false)
    const value = useWatch({ control: methods.control, name }) as string | undefined

    const generate = () => {
        methods.setValue(name, generatePassword() as PathValue<IForm, Path<IForm>>, {
            shouldDirty: true,
            shouldValidate: true,
        })
        setVisible(true)
    }

    const copy = async () => {
        if (!value) return
        await navigator.clipboard.writeText(value)
        toast.success(t("form.password_copied"))
    }

    return (
        <div className="flex flex-col gap-1.5">
            <FormInput
                required={required}
                type={visible ? "text" : "password"}
                name={name}
                label={label}
                methods={methods}
                placeholder={placeholder}
                autoComplete="new-password"
            />
            <div className="flex flex-wrap items-center gap-1">
                <Button type="button" variant="outline" size="sm" onClick={generate}>
                    <WandSparkles className="size-4" />
                    {t("form.generate_password")}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? t("form.hide_password") : t("form.show_password")}
                >
                    {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={copy}
                    disabled={!value}
                    aria-label={t("form.copy_password")}
                >
                    <Copy className="size-4" />
                </Button>
            </div>
        </div>
    )
}
