import Image from "@/components/custom/image"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TECH_BASE } from "@/constants/api-endpoints"
import { useGet } from "@/hooks/useGet"
import { Link, useParams } from "@tanstack/react-router"
import { ArrowLeft, Link2, Unlink } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { fmtDate } from "../ombor/utils"
import CoupleDialog, { type CoupleMode } from "./couple-dialog"
import DocumentsCard from "./documents-card"
import FuelCard from "./fuel-card"
import OilCard from "./oil-card"
import TireSchema from "./tire-schema"
import Timeline from "./timeline"
import type { Passport } from "./types"

const PassportPage = () => {
    const { t } = useTranslation()
    const { id } = useParams({ strict: false }) as { id: string }
    const [mode, setMode] = useState<CoupleMode | null>(null)

    const { data, isLoading } = useGet<Passport>(`${TECH_BASE}/${id}`)

    if (isLoading || !data) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    const isTruck = data.kind === "truck"
    const subtitle = [data.type_name, data.model_name, data.year]
        .filter(Boolean)
        .join(" · ")
    const cover = data.photos[0]

    return (
        <div className="flex flex-col gap-4">
            <Link
                to="/texnik-baza"
                className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft size={14} />
                {t("tb.back")}
            </Link>

            <header className="rounded-lg border p-4 flex flex-col gap-4 lg:flex-row lg:items-stretch">
                <div className="flex flex-1 items-center gap-4 min-w-0">
                    {cover ?
                        <Image
                            src={cover.url}
                            alt={cover.label}
                            className="size-20 shrink-0 rounded-lg object-cover"
                        />
                    :   <div className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-muted text-4xl">
                            {isTruck ? "🚛" : "🛻"}
                        </div>
                    }
                    <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-semibold tracking-wide">
                                {data.plate}
                            </h1>
                            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                {isTruck ? t("tb.truck") : t("tb.trailer")}
                            </span>
                        </div>
                        {subtitle && (
                            <span className="text-sm text-muted-foreground">
                                {subtitle}
                            </span>
                        )}
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                            {isTruck && (
                                <span>
                                    <span className="text-muted-foreground">
                                        {t("tb.driver")}:{" "}
                                    </span>
                                    <b className="font-medium">
                                        {data.driver?.name ?? "—"}
                                    </b>
                                </span>
                            )}
                            <span>
                                <span className="text-muted-foreground">
                                    {t("tb.owner")}:{" "}
                                </span>
                                <b className="font-medium">
                                    {data.owner_name ?? "—"}
                                </b>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-center gap-3 rounded-lg bg-muted/50 p-3 lg:w-[420px]">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="rounded-md border bg-background px-2.5 py-1 font-medium">
                            {isTruck ? "🚛" : "🛻"} {data.plate}
                        </span>
                        <span
                            className={
                                data.coupled ?
                                    "flex-1 border-t-2 border-primary"
                                :   "flex-1 border-t-2 border-dashed border-muted-foreground/40"
                            }
                        />
                        {data.coupled ?
                            <Link
                                to="/texnik-baza/$id"
                                params={{ id: String(data.coupled.id) }}
                                className="rounded-md border bg-background px-2.5 py-1 font-medium text-primary hover:underline"
                            >
                                {isTruck ? "🛻" : "🚛"} {data.coupled.plate}
                            </Link>
                        :   <span className="rounded-md border border-dashed px-2.5 py-1 text-muted-foreground">
                                {t("tb.not_coupled")}
                            </span>
                        }
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                            {data.coupled ?
                                t("tb.since", {
                                    date: fmtDate(data.coupled.since),
                                })
                            :   isTruck ? t("tb.trailer") : t("tb.truck")}
                        </span>
                        {data.can_control && (
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    icon={<Link2 size={14} />}
                                    onClick={() => setMode("couple")}
                                >
                                    {t("tb.couple")}
                                </Button>
                                {data.coupled && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive"
                                        icon={<Unlink size={14} />}
                                        onClick={() => setMode("uncouple")}
                                    >
                                        {t("tb.uncouple")}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <section className="flex gap-3 overflow-x-auto pb-1">
                {data.photos.length ?
                    data.photos.map((photo) => (
                        <figure
                            key={photo.url}
                            className="shrink-0 flex flex-col gap-1"
                        >
                            <Image
                                src={photo.url}
                                alt={photo.label}
                                className="h-36 w-52 rounded-lg object-cover"
                            />
                            <figcaption className="text-xs text-muted-foreground">
                                {photo.label}
                            </figcaption>
                        </figure>
                    ))
                :   <p className="text-sm text-muted-foreground">
                        {t("tb.no_photos")}
                    </p>
                }
            </section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <TireSchema
                    id={data.id}
                    axles={data.axles}
                    tires={data.tires}
                    canControl={data.can_control}
                />
                <div className="flex flex-col gap-4">
                    <OilCard
                        id={data.id}
                        oil={data.oil}
                        canControl={data.can_control}
                    />
                    <DocumentsCard documents={data.documents} />
                </div>
            </div>

            <FuelCard id={data.id} />

            <section className="rounded-lg border p-4 flex flex-col gap-3">
                <h2 className="font-semibold">🔗 {t("tb.couplings")}</h2>
                {!data.couplings.length ?
                    <p className="text-sm text-muted-foreground">
                        {t("tb.couplings_empty")}
                    </p>
                :   <ul className="flex flex-col divide-y text-sm">
                        {data.couplings.map((c) => (
                            <li
                                key={c.id}
                                className="flex flex-wrap items-center justify-between gap-2 py-2"
                            >
                                <span className="font-medium">
                                    {c.truck.plate} + {c.trailer.plate}
                                </span>
                                <span className="text-muted-foreground tabular-nums">
                                    {fmtDate(c.start)} –{" "}
                                    {c.end ? fmtDate(c.end) : t("tb.coupling_until")}
                                </span>
                            </li>
                        ))}
                    </ul>
                }
            </section>

            <Timeline id={data.id} />

            <CoupleDialog
                passport={data}
                mode={mode}
                onClose={() => setMode(null)}
            />
        </div>
    )
}

export default PassportPage
