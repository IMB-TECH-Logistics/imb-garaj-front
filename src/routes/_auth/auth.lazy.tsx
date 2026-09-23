import { FormInput } from "@/components/form/input"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LOGIN } from "@/constants/api-endpoints"
import { usePost } from "@/hooks/usePost"
import { handleFormError } from "@/lib/show-form-errors"
import { createLazyFileRoute } from "@tanstack/react-router"
import { Globe, Truck } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

export const Route = createLazyFileRoute("/_auth/auth")({
    component: AuthComponent,
})

type Form = {
    username: string
    password: string
}

const LANGS = [
    { code: "uz", label: "O'zbek", flag: "🇺🇿" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "ja", label: "日本語", flag: "🇯🇵" },
]

function AuthComponent() {
    const { mutate, isPending } = usePost()
    const { t, i18n } = useTranslation()
    const langCode = (i18n.resolvedLanguage ?? i18n.language).split("-")[0]
    const current = LANGS.find((l) => l.code === langCode) ?? LANGS[0]

    const form = useForm<Form>({
        disabled: isPending,
    })

    const onSubmit = form.handleSubmit((data) => {
        mutate(LOGIN, data, {
            onSuccess(res) {
                localStorage.setItem("token", res.access)
                window.location.href = "/"
            },
            onError: (error) => handleFormError(error, form),
        })
    })

    return (
        <div className="min-h-screen flex bg-white relative">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-4 right-4 z-50 gap-1.5 text-xs"
                    >
                        <Globe size={13} />
                        {current.flag} {current.label}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-40">
                    {LANGS.map((lang) => (
                        <DropdownMenuItem
                            key={lang.code}
                            onClick={() => i18n.changeLanguage(lang.code)}
                            className={langCode === lang.code ? "bg-accent" : ""}
                        >
                            <span className="mr-2">{lang.flag}</span>
                            {lang.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden lg:flex lg:w-1/2 bg-[url(/volvo-veb.webp)] bg-cover px-8 pt-8 pb-5 flex-col justify-between relative overflow-hidden bg-center">
                <div className="absolute inset-0 bg-black/50" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                            <Truck className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold">IMB LOGISTIKA</span>
                    </div>
                    <div className="h-[55vh] w-full flex flex-col items-center justify-center">
                        <h2 className="text-4xl font-bold mb-4 leading-tight">
                            {t("auth.welcome")}
                        </h2>
                        <p className="text-lg text-center">
                            {t("auth.description")}
                        </p>
                    </div>
                </div>

                <div className="relative z-10 text-white/90">
                    {t("auth.copyright")}
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center sm:p-8 p-4">
                <div className="w-full max-w-md">
                    <h1 className="text-3xl font-bold text-center sm:text-start mb-2 text-zinc-800">
                        {t("auth.title")}
                    </h1>
                    <p className="sm:mb-6 mb-2 text-gray-600 sm:text-lg text-sm">
                        {t("auth.subtitle")}
                    </p>
                    <form onSubmit={onSubmit} className="space-y-4 flex flex-col items-center">
                        <FormInput
                            name="username"
                            label={t("auth.username")}
                            methods={form}
                            required
                            className="bg-white border border-primary"
                            wrapperClassName="text-zinc-800"
                        />
                        <FormInput
                            name="password"
                            label={t("auth.password")}
                            type="password"
                            methods={form}
                            required
                            className="bg-white border border-primary"
                            wrapperClassName="text-zinc-800"
                        />
                        <Button
                            type="submit"
                            loading={isPending}
                            className="w-full bg-blue-400 hover:bg-blue-500 text-white"
                        >
                            {t("auth.submit")}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
