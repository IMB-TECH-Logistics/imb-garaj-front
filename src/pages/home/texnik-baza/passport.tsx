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

    const partnerLabel =
        data.kind === "truck" ? t("tb.trailer") : t("tb.truck")

    const facts: [string, string | null][] = [
        [t("tb.type"), data.type_name],
        [t("tb.model"), data.model_name],
        [t("tb.year"), data.year ? String(data.year) : null],
        [t("tb.owner"), data.owner_name],
        ...(data.kind === "truck" ?
            ([[t("tb.driver"), data.driver?.name ?? null]] as [
                string,
                string | null,
            ][])
        :   []),
    ]

    return (
        <div className="flex flex-col gap-4">
            <Link
                to="/texnik-baza"
                className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft size={14} />
                {t("tb.back")}
            </Link>

            <header className="rounded-lg border p-4 flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">{data.plate}</h1>
                        <span className="text-sm text-muted-foreground">
                            {data.kind === "truck" ?
                                t("tb.truck")
                            :   t("tb.trailer")}
                        </span>
                    </div>
                    {data.can_control && (
                        <div className="flex flex-wrap gap-2">
                            <Button
                                icon={<Link2 size={16} />}
                                onClick={() => setMode("couple")}
                            >
                                {t("tb.couple")}
                            </Button>
                            {data.coupled && (
                                <Button
                                    variant="destructive"
                                    icon={<Unlink size={16} />}
                                    onClick={() => setMode("uncouple")}
                                >
                                    {t("tb.uncouple")}
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-5">
                    {facts.map(([k, v]) => (
                        <div key={k} className="flex flex-col">
                            <dt className="text-xs text-muted-foreground">{k}</dt>
                            <dd className="font-medium">{v ?? "—"}</dd>
                        </div>
                    ))}
                    <div className="flex flex-col">
                        <dt className="text-xs text-muted-foreground">
                            {partnerLabel}
                        </dt>
                        <dd className="font-medium">
                            {data.coupled ?
                                <Link
                                    to="/texnik-baza/$id"
                                    params={{ id: String(data.coupled.id) }}
                                    className="text-primary hover:underline"
                                >
                                    {data.coupled.plate}{" "}
                                    <span className="text-xs text-muted-foreground font-normal">
                                        {t("tb.since", {
                                            date: fmtDate(data.coupled.since),
                                        })}
                                    </span>
                                </Link>
                            :   <span className="text-muted-foreground">
                                    {t("tb.not_coupled")}
                                </span>
                            }
                        </dd>
                    </div>
                </dl>
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
