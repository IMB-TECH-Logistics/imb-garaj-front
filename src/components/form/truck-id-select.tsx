import { cn } from "@/lib/utils"
import { useRef, useState } from "react"
import { FieldValues, Path, PathValue, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Input } from "../ui/input"
import { formatCarNumber } from "./car-number"

type Props<IForm extends FieldValues> = {
    methods: UseFormReturn<IForm>
    name: Path<IForm>
    options?: { value: string; label: string }[]
    onSearchChange?: (v: string) => void
    required?: boolean
    handleSelect?: (v: string) => void
}

export default function TruckIdSelect<IForm extends FieldValues>({
    options,
    methods,
    name,
    onSearchChange,
    handleSelect,
}: Props<IForm>) {
    const { t } = useTranslation()
    const rf = useRef<NodeJS.Timeout>()
    type Value = PathValue<IForm, Path<IForm>>
    const [open, setOpen] = useState(false)

    const {
        register,
        setValue,
        formState: { errors },
    } = methods

    const reg = register(name, {
        required: {
            value: true,
            message: methods.formState.errors[name]?.message as any,
        },
    })

    function onValueChange(v: string) {
        setValue(name, v as Value)
        if (onSearchChange) {
            if (rf.current) {
                clearTimeout(rf.current)
            }
            rf.current = setTimeout(() => {
                onSearchChange(v)
            }, 300)
        }
    }

    return (
        <div className="w-full relative">
            <Input
                placeholder={t("form.enter_vehicle_number")}
                onFocus={() => setOpen(true)}
                fullWidth
                {...reg}
                onBlurCapture={() =>
                    setTimeout(() => {
                        setOpen(false)
                    }, 200)
                }
                autoComplete="off"
                className={cn(
                    !!errors[name] && "border-destructive ring-0 focus:ring-0",
                )}
                onChange={(v) => onValueChange(formatCarNumber(v.target.value))}
            />
            {open && (
                <div className="bg-secondary p-1 mt-1 rounded-md select-none flex flex-col gap-1 absolute w-full z-20">
                    <p className="text-muted-foreground text-xs">Tavsiyalar</p>
                    <div className="flex flex-col">
                        {options?.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    handleSelect?.(opt.value)
                                    methods.setValue(name, opt.value as Value)
                                }}
                                className="text-start bg-card px-2 py-1 rounded-sm text-sm font-light hover:scale-[101%] hover:pl-4 transition-all duration-200"
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
