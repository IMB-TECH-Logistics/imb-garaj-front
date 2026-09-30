import { Button } from "@/components/ui/button"
import { Link } from "@tanstack/react-router"
import { ShieldAlert } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function Forbidden({ to = "/" }: { to?: string }) {
    const { t } = useTranslation()
    return (
        <main className="grid place-items-center py-24">
            <div className="flex max-w-sm flex-col items-center gap-3 text-center">
                <ShieldAlert className="h-10 w-10 text-muted-foreground" />
                <h1 className="text-lg font-semibold">{t("page.forbidden_title")}</h1>
                <p className="text-sm text-muted-foreground">
                    {t("page.forbidden_text")}
                </p>
                <Link to={to}>
                    <Button variant="outline">{t("page.go_home")}</Button>
                </Link>
            </div>
        </main>
    )
}
