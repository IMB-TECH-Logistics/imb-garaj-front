import EmptyBox from "@/components/custom/empty-box"
import Image from "@/components/custom/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TECH_BASE } from "@/constants/api-endpoints"
import { useHasAction } from "@/constants/useUser"
import { useGet } from "@/hooks/useGet"
import { useNavigate } from "@tanstack/react-router"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { fmtDate } from "../ombor/utils"
import AddTrailer from "./add-trailer"
import StatusDot from "./status-dot"
import type { TechKind, TechRow } from "./types"

const pctLabel = (pct: number | null) =>
    pct === null ? "—" : `${Math.round(pct)}%`

const TexnikBaza = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const canControl = useHasAction("tech_base_control")
    const [kind, setKind] = useState<TechKind>("truck")
    const [searchInput, setSearchInput] = useState("")
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [addOpen, setAddOpen] = useState(false)

    useEffect(() => {
        const id = setTimeout(() => {
            setSearch(searchInput.trim())
            setPage(1)
        }, 350)
        return () => clearTimeout(id)
    }, [searchInput])

    const { data, isLoading } = useGet<ListResponse<TechRow>>(TECH_BASE, {
        params: { kind, search, page },
    })
    const rows = data?.results ?? []
    const totalPages = data?.total_pages ?? 1

    const open = (row: TechRow) =>
        navigate({ to: "/texnik-baza/$id", params: { id: String(row.id) } })

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-xl font-semibold">{t("tb.title")}</h1>
                {canControl && (
                    <Button
                        icon={<Plus size={16} />}
                        onClick={() => setAddOpen(true)}
                    >
                        {t("tb.add_trailer")}
                    </Button>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Tabs
                    value={kind}
                    onValueChange={(v) => {
                        setKind(v as TechKind)
                        setPage(1)
                    }}
                >
                    <TabsList>
                        <TabsTrigger value="truck">{t("tb.truck")}</TabsTrigger>
                        <TabsTrigger value="trailer">
                            {t("tb.trailer")}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                <Input
                    wrapperClassName="w-full sm:w-72"
                    placeholder={t("tb.search")}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("tb.plate")}</TableHead>
                            <TableHead>
                                {kind === "truck" ?
                                    t("tb.trailer")
                                :   t("tb.truck")}
                            </TableHead>
                            {kind === "truck" && (
                                <TableHead>{t("tb.driver")}</TableHead>
                            )}
                            <TableHead>{t("tb.tires")}</TableHead>
                            <TableHead>{t("tb.oil")}</TableHead>
                            <TableHead>{t("tb.inspection")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ?
                            Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={6}>
                                        <Skeleton className="h-9 w-full" />
                                    </TableCell>
                                </TableRow>
                            ))
                        :   rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="cursor-pointer"
                                    onClick={() => open(row)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Image
                                                src={row.photo ?? undefined}
                                                className="size-10 rounded-md object-cover"
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium whitespace-nowrap">
                                                    {row.plate}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {row.type_name ?? "—"}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {row.coupled ?
                                            <div className="flex flex-col">
                                                <span className="whitespace-nowrap">
                                                    {row.coupled.plate}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {t("tb.since", {
                                                        date: fmtDate(
                                                            row.coupled.since,
                                                        ),
                                                    })}
                                                </span>
                                            </div>
                                        :   <span className="text-muted-foreground">
                                                {t("tb.not_coupled")}
                                            </span>
                                        }
                                    </TableCell>
                                    {kind === "truck" && (
                                        <TableCell>
                                            {row.driver_name ?? "—"}
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="text-sm tabular-nums">
                                                {row.tires.positions}/
                                                {row.tires.total}
                                            </span>
                                            {row.tires.warn > 0 && (
                                                <StatusDot
                                                    status="warn"
                                                    label={String(
                                                        row.tires.warn,
                                                    )}
                                                />
                                            )}
                                            {row.tires.over > 0 && (
                                                <StatusDot
                                                    status="over"
                                                    label={String(
                                                        row.tires.over,
                                                    )}
                                                />
                                            )}
                                            {row.tires.warn === 0 &&
                                                row.tires.over === 0 && (
                                                    <StatusDot status="ok" />
                                                )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <StatusDot
                                            status={row.oil.status}
                                            label={pctLabel(row.oil.pct)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <StatusDot
                                            status={row.inspection.status}
                                            label={
                                                row.inspection.lifespan ?
                                                    fmtDate(
                                                        row.inspection.lifespan,
                                                    )
                                                :   "—"
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
                {!isLoading && <EmptyBox data={rows} height="h-48" />}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                        icon={<ChevronLeft size={16} />}
                    />
                    <span className="text-sm tabular-nums">
                        {page} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                        icon={<ChevronRight size={16} />}
                    />
                </div>
            )}

            <AddTrailer open={addOpen} onOpenChange={setAddOpen} />
        </div>
    )
}

export default TexnikBaza
