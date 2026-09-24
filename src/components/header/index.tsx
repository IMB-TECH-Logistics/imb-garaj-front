import { usePaths } from "@/hooks/usePaths"
import { cn } from "@/lib/utils"
import { useLocation, useNavigate, useSearch } from "@tanstack/react-router"
import { useMemo } from "react"
import { NavUser } from "../sidebar/nav-user"
import { SidebarTrigger, useSidebar } from "../ui/sidebar"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import { ThemeColorToggle } from "./color-toggle"
import ParamDateRange from "@/components/as-params/date-picker-range"
import ParamInput from "@/components/as-params/input"
import { IntegrationNotification } from "./integration-notification"
import { useHasAction } from "@/constants/useUser"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import { useTranslation } from "react-i18next"

const LANGS = [
    { code: "uz", label: "O'zbek", flag: "🇺🇿" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "ja", label: "日本語", flag: "🇯🇵" },
]

function LangButton() {
    const { i18n } = useTranslation()
    const langCode = (i18n.resolvedLanguage ?? i18n.language).split("-")[0]
    const current = LANGS.find((l) => l.code === langCode) ?? LANGS[0]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative" title={current.label}>
                    <Globe size={18} />
                    <span className="absolute -bottom-1 -right-1 text-[10px] leading-none">{current.flag}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-36">
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
    )
}

// Per-section search box shown in the header. Settings ("Sozlamalar") routes are
// intentionally excluded — they keep their own in-page search. Matched by pathname
// (exact or a "/"-segment prefix, first match wins); each `searchKey` mirrors the
// URL param the corresponding page already reads.
const HEADER_SEARCH: { prefix: string; searchKey: string; placeholder: string }[] = [
    { prefix: "/buxgalteriya", searchKey: "search", placeholder: "Davlat raqami..." },
    { prefix: "/haydovchilar", searchKey: "driver_search", placeholder: "Haydovchi..." },
    { prefix: "/managers", searchKey: "search", placeholder: "Mashina raqami..." },
    { prefix: "/manager-trips/manager-reys", searchKey: "search", placeholder: "Joy, yuk turi, yuk beruvchi yoki ID..." },
    { prefix: "/kassa", searchKey: "tx_search", placeholder: "Izoh / ma'sul..." },
    { prefix: "/texnik-check", searchKey: "vehicle_search", placeholder: "Mashina raqami..." },
    { prefix: "/technic-check", searchKey: "vehicle_search", placeholder: "Mashina raqami..." },
    { prefix: "/petrol-stations", searchKey: "petrol_search", placeholder: "Qidirish..." },
    { prefix: "/truck", searchKey: "search", placeholder: "Mashina raqami..." },
    { prefix: "/ombor", searchKey: "search", placeholder: "Mahsulot nomi..." },
    { prefix: "/monitoring", searchKey: "q", placeholder: "Mashina yoki haydovchi..." },
    { prefix: "/flights", searchKey: "search", placeholder: "Mashina, mijoz yoki joy..." },
]

const Header = () => {
    const { open } = useSidebar()
    const { pathname } = useLocation()
    const navigate = useNavigate()
    const { childPaths } = usePaths()
    const { isMobile } = useSidebar()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const search: any = useSearch({ strict: false })

    const searchConfig = useMemo(() => {
        const cfg = HEADER_SEARCH.find(
            (c) => pathname === c.prefix || pathname.startsWith(c.prefix + "/"),
        )
        if (!cfg) return undefined
        // Monitoring search filters the report list only, not the live map.
        if (cfg.prefix === "/monitoring" && !search?.report) return undefined
        return cfg
    }, [pathname, search?.report])

    const canSeeIntegration = useHasAction("manager_vehicles_view")

    const activeTab = useMemo(() => {
        // Find the matching tab for nested routes (e.g. /manager-trips/123 -> /managers)
        const exact = childPaths.find((c) => c.path === pathname)
        if (exact) return exact.path

        const match = childPaths.find(
            (c) =>
                pathname.startsWith(c.path + "/") ||
                c.extraPaths?.some(
                    (p) => pathname === p || pathname.startsWith(p + "/"),
                ),
        )
        return match?.path ?? pathname
    }, [childPaths, pathname])

    return (
        <header className="p-2 gap-4 flex items-center justify-between bg-card border-b border-border max-w-full box-border">
            <div className="flex items-center xl:gap-6 max-w-full overflow-x-auto custom-scrollbar">
                <div
                    className={cn(
                        "flex items-center gap-3 transition-all duration-300 min-w-0",
                        open && "min-w-[13rem]",
                    )}
                >
                    <SidebarTrigger className="text-gray-500 dark:text-white" />
                    <h1 className="font-bold text-primary text-2xl ">
                        GARAJ
                    </h1>
                </div>
                {!!childPaths.length && (
                    <Tabs
                        className="hidden xl:flex overflow-x-auto custom-scrollbar max-w-full"
                        value={activeTab}
                        onValueChange={(path) => navigate({ to: path })}
                    >
                        <TabsList className="gap-2 bg-transparent ">
                            {childPaths?.map((link) => (
                                <TabsTrigger key={link.label} value={link.path}>
                                    {link.icon} {link.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                )}
            </div>

            <hgroup className="flex items-center gap-2 sm:gap-4">
                {searchConfig && (
                    <ParamInput
                        key={searchConfig.prefix}
                        searchKey={searchConfig.searchKey}
                        placeholder={searchConfig.placeholder}
                        wrapperClassName="!h-9 !w-56 hidden sm:block"
                        className="!h-9 !bg-muted/40 text-sm"
                    />
                )}
                {pathname.startsWith("/moliya") && (
                    <ParamDateRange
                        from="from_date"
                        to="to_date"
                        addButtonProps={{
                            className: "!bg-muted/50 h-8 text-xs min-w-28 justify-start",
                        }}
                    />
                )}
                {canSeeIntegration && <IntegrationNotification />}
                <div className="flex items-center sm:gap-2">
                    <LangButton />
                    <ThemeColorToggle />
                </div>
                {isMobile && <NavUser />}
            </hgroup>
        </header>
    )
}

export default Header
