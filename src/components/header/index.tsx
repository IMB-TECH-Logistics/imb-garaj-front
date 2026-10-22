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
import { DocumentNotification } from "./document-notification"
import { TechCheckNotification } from "./tech-check-notification"
import { TenantFilter } from "./tenant-filter"
import { TenantSwitcher } from "./tenant-switcher"
import { useAlertCounts } from "@/components/alerts/use-alert-counts"
import OmborHeaderSearch from "@/pages/home/ombor/header-search"
import OmborHeaderTabs from "@/pages/home/ombor/header-tabs"
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
    { code: "uz-Cyrl", label: "Ўзбек", flag: "🇺🇿" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "ja", label: "日本語", flag: "🇯🇵" },
]

function LangButton() {
    const { i18n } = useTranslation()
    const lng = i18n.resolvedLanguage ?? i18n.language
    const langCode = LANGS.some((l) => l.code === lng) ? lng : lng.split("-")[0]
    const current = LANGS.find((l) => l.code === langCode) ?? LANGS[0]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="default" size="icon" className="relative size-9 shrink-0" title={current.label}>
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
const HEADER_SEARCH: { prefix: string; searchKey: string; placeholderKey: string }[] = [
    { prefix: "/buxgalteriya", searchKey: "search", placeholderKey: "ui.header_search.vehicle_number" },
    { prefix: "/haydovchilar", searchKey: "driver_search", placeholderKey: "ui.header_search.driver" },
    { prefix: "/managers", searchKey: "search", placeholderKey: "ui.header_search.vehicle_number" },
    { prefix: "/manager-trips/manager-reys", searchKey: "search", placeholderKey: "ui.header_search.trip" },
    { prefix: "/kassa", searchKey: "tx_search", placeholderKey: "ui.header_search.comment_responsible" },
    { prefix: "/texnik-check", searchKey: "vehicle_search", placeholderKey: "ui.header_search.vehicle_number" },
    { prefix: "/technic-check", searchKey: "vehicle_search", placeholderKey: "ui.header_search.vehicle_number" },
    { prefix: "/petrol-stations", searchKey: "petrol_search", placeholderKey: "ui.header_search.search" },
    { prefix: "/truck", searchKey: "search", placeholderKey: "ui.header_search.vehicle_number" },
    { prefix: "/ombor", searchKey: "search", placeholderKey: "ui.header_search.product" },
    { prefix: "/monitoring", searchKey: "q", placeholderKey: "ui.header_search.vehicle_or_driver" },
    { prefix: "/flights", searchKey: "search", placeholderKey: "ui.header_search.vehicle_client_place" },
]

const Header = () => {
    const { open } = useSidebar()
    const { t } = useTranslation()
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

    const canSeeBell = useAlertCounts().canSee

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
                        "flex items-center gap-3 transition-all duration-300 shrink-0",
                        open && "min-w-[13rem]",
                    )}
                >
                    <SidebarTrigger className="text-gray-500 dark:text-white" />
                    <span className="font-bold text-primary text-2xl ">
                        GARAJ
                    </span>
                </div>
                {!childPaths.length && pathname.startsWith("/ombor") && (
                    <OmborHeaderTabs />
                )}
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
                                    {!!link.badge && (
                                        <span className="ml-1.5 rounded-full bg-red-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center leading-none">
                                            {link.badge}
                                        </span>
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                )}
            </div>

            <hgroup className="flex items-center gap-2 sm:gap-4">
                <TenantSwitcher />
                <TenantFilter />
                {searchConfig && pathname.startsWith("/ombor") && (
                    <OmborHeaderSearch key={searchConfig.prefix} />
                )}
                {searchConfig && !pathname.startsWith("/ombor") && (
                    <ParamInput
                        key={searchConfig.prefix}
                        searchKey={searchConfig.searchKey}
                        placeholder={t(searchConfig.placeholderKey)}
                        wrapperClassName="!h-9 !w-36 sm:!w-56 shrink-0"
                        className="!h-9 !bg-muted/40 text-sm"
                    />
                )}
                {pathname.startsWith("/moliya") && (
                    <div className="hidden sm:block">
                        <ParamDateRange
                            from="from_date"
                            to="to_date"
                            addButtonProps={{
                                className: "!bg-muted/50 h-8 text-xs min-w-28 justify-start",
                            }}
                        />
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <DocumentNotification />
                    <TechCheckNotification />
                    {canSeeBell && <IntegrationNotification />}
                    <LangButton />
                    <ThemeColorToggle />
                </div>
                {isMobile && <NavUser />}
            </hgroup>
        </header>
    )
}

export default Header
