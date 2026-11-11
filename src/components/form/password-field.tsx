import { generatePassword } from "@/lib/generate-password"
import { Eye, EyeOff, WandSparkles } from "lucide-react"
import { useState } from "react"
import { FieldValues, Path, PathValue, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
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

    const generate = () => {
        methods.setValue(name, generatePassword() as PathValue<IForm, Path<IForm>>, {
            shouldDirty: true,
            shouldValidate: true,
        })
        setVisible(true)
    }

    return (
        <FormInput
            required={required}
            type={visible ? "text" : "password"}
            name={name}
            label={label}
            methods={methods}
            placeholder={placeholder}
            autoComplete="new-password"
            noPasswordToggle
            className="pr-16"
            suffix={
                <span className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={generate}
                        title={t("form.generate_password")}
                        aria-label={t("form.generate_password")}
                        className="hover:text-foreground"
                    >
                        <WandSparkles width={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setVisible((v) => !v)}
                        aria-label={visible ? t("form.hide_password") : t("form.show_password")}
                        className="hover:text-foreground"
                    >
                        {visible ? <EyeOff width={18} /> : <Eye width={18} />}
                    </button>
                </span>
            }
        />
    )
}
