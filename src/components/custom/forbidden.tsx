import { Button } from "@/components/ui/button"
import { Link } from "@tanstack/react-router"
import { ShieldAlert } from "lucide-react"

export default function Forbidden({ to = "/" }: { to?: string }) {
    return (
        <main className="grid place-items-center py-24">
            <div className="flex max-w-sm flex-col items-center gap-3 text-center">
                <ShieldAlert className="h-10 w-10 text-muted-foreground" />
                <h1 className="text-lg font-semibold">Sizga ruxsat berilmagan</h1>
                <p className="text-sm text-muted-foreground">
                    Bu bo'limni ochish uchun ruxsatingiz yo'q. Kerak bo'lsa,
                    administratordan rolingizga ruxsat qo'shishni so'rang.
                </p>
                <Link to={to}>
                    <Button variant="outline">Bosh sahifaga</Button>
                </Link>
            </div>
        </main>
    )
}
