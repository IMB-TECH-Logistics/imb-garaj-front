import { Slider } from "@/components/ui/slider"
import { Activity, Minus, RotateCcw, Sparkles } from "lucide-react"
import { useMemo } from "react"
import {
    Area,
    AreaChart,
    ReferenceArea,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

function mean(values: number[]) {
    if (values.length === 0) return 0
    return values.reduce((s, v) => s + v, 0) / values.length
}

function percentile(sortedAsc: number[], p: number) {
    if (sortedAsc.length === 0) return 0
    const idx = Math.max(
        0,
        Math.min(
            sortedAsc.length - 1,
            Math.round((p / 100) * (sortedAsc.length - 1)),
        ),
    )
    return sortedAsc[idx]
}

function buildCurvePoints(
    values: number[],
    min: number,
    max: number,
    bins = 60,
): { score: number; density: number }[] {
    if (values.length === 0 || max <= min) return []
    const width = max - min
    const counts = new Array<number>(bins).fill(0)
    for (const v of values) {
        const idx = Math.max(
            0,
            Math.min(bins - 1, Math.floor(((v - min) / width) * bins)),
        )
        counts[idx] += 1
    }
    const kernel = [1, 4, 11, 21, 28, 21, 11, 4, 1]
    const radius = (kernel.length - 1) / 2
    const smoothed = new Array<number>(bins).fill(0)
    for (let i = 0; i < bins; i++) {
        let acc = 0
        let weight = 0
        for (let k = -radius; k <= radius; k++) {
            const j = i + k
            if (j < 0 || j >= bins) continue
            const w = kernel[k + radius]
            acc += counts[j] * w
            weight += w
        }
        smoothed[i] = weight > 0 ? acc / weight : 0
    }
    const points: { score: number; density: number }[] = []
    for (let i = 0; i < bins; i++) {
        const score = min + ((i + 0.5) * width) / bins
        points.push({ score, density: smoothed[i] })
    }
    return points
}

type Props = {
    scores: number[]
    range: [number, number]
    onRangeChange: (range: [number, number]) => void
    threshold?: number
    onThresholdChange?: (threshold: number) => void
    defaultThreshold?: number
    title?: string
    selectedCount?: number
}

export function RatingBellCurve({
    scores,
    range,
    onRangeChange,
    threshold,
    onThresholdChange,
    defaultThreshold,
    title,
    selectedCount,
}: Props) {
    const stats = useMemo(() => {
        if (scores.length === 0) {
            return { min: 0, max: 100, mean: 0, p10: 0, p50: 0, p90: 0 }
        }
        const sorted = [...scores].sort((a, b) => a - b)
        const m = mean(scores)
        return {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            mean: m,
            p10: percentile(sorted, 10),
            p50: percentile(sorted, 50),
            p90: percentile(sorted, 90),
        }
    }, [scores])

    const pad = Math.max(1, (stats.max - stats.min) * 0.08)
    const xMin = Math.floor(stats.min - pad)
    const xMax = Math.ceil(stats.max + pad)

    const curve = useMemo(
        () => buildCurvePoints(scores, xMin, xMax, 60),
        [scores, xMin, xMax],
    )

    const [rangeMin, rangeMax] = range
    const effThreshold = threshold ?? stats.p10

    return (
        <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                        <Activity className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold leading-tight">
                            {title ?? "Ball taqsimoti"}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                            Eshik chizig'i — "yetarli" va "yetishmovchilik" chegarasi. Slayder orqali aniq oraliqni ko'ring.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                    <Stat label="Tanlandi" value={selectedCount ?? scores.length} highlight />
                    <Stat label="O'rtacha" value={Math.round(stats.mean)} />
                    <Stat label="P10" value={Math.round(stats.p10)} />
                    <Stat label="P90" value={Math.round(stats.p90)} />
                </div>
            </div>

            <div className="relative h-[220px] -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={curve}
                        margin={{ top: 22, right: 8, left: 0, bottom: 4 }}
                    >
                        <defs>
                            <linearGradient id="bell-inside" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.55} />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.04} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="score"
                            type="number"
                            domain={[xMin, xMax]}
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                            label={{
                                value: "Ball",
                                position: "insideBottom",
                                offset: -2,
                                fontSize: 10,
                                fill: "hsl(var(--muted-foreground))",
                            }}
                        />
                        <YAxis
                            domain={[0, "dataMax"]}
                            allowDecimals={false}
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                            width={48}
                            tickFormatter={(v) => String(Math.round(Number(v)))}
                            label={{
                                value: "Haydovchilar soni",
                                angle: -90,
                                position: "insideLeft",
                                offset: 14,
                                style: {
                                    fontSize: 10,
                                    fill: "hsl(var(--muted-foreground))",
                                    textAnchor: "middle",
                                },
                            }}
                        />
                        <Tooltip
                            cursor={{
                                stroke: "hsl(var(--primary))",
                                strokeWidth: 1,
                                strokeDasharray: "3 3",
                            }}
                            wrapperStyle={{ outline: "none" }}
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null
                                const p = payload[0].payload as {
                                    score: number
                                    density: number
                                }
                                return (
                                    <div className="rounded-md border bg-popover px-2 py-1 text-[11px] shadow-md">
                                        <div>
                                            Ball:{" "}
                                            <span className="font-semibold">
                                                {Math.round(p.score)}
                                            </span>
                                        </div>
                                        <div className="text-muted-foreground">
                                            ≈ {Math.round(p.density)} haydovchi
                                        </div>
                                    </div>
                                )
                            }}
                        />
                        {rangeMin > xMin && (
                            <ReferenceArea
                                x1={xMin}
                                x2={rangeMin}
                                fill="hsl(var(--muted-foreground))"
                                fillOpacity={0.08}
                                stroke="none"
                            />
                        )}
                        {rangeMax < xMax && (
                            <ReferenceArea
                                x1={rangeMax}
                                x2={xMax}
                                fill="hsl(var(--muted-foreground))"
                                fillOpacity={0.08}
                                stroke="none"
                            />
                        )}
                        <ReferenceArea
                            x1={xMin}
                            x2={effThreshold}
                            fill="hsl(var(--destructive))"
                            fillOpacity={0.07}
                            stroke="none"
                        />
                        <Area
                            type="basis"
                            dataKey="density"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            fill="url(#bell-inside)"
                            isAnimationActive={false}
                        />
                        <ReferenceLine
                            x={stats.mean}
                            stroke="hsl(var(--primary))"
                            strokeDasharray="2 3"
                            strokeOpacity={0.5}
                            label={{
                                value: "O'rtacha",
                                position: "insideTopLeft",
                                fill: "hsl(var(--primary))",
                                fontSize: 10,
                                fontWeight: 500,
                            }}
                        />
                        <ReferenceLine
                            x={effThreshold}
                            stroke="hsl(var(--destructive))"
                            strokeWidth={2}
                            strokeDasharray="5 3"
                            label={{
                                position: "top",
                                value: "Minimum chegara",
                                fill: "hsl(var(--destructive))",
                                fontSize: 10,
                                fontWeight: 600,
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="pt-1 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                        Oraliq:{" "}
                        <span className="text-foreground font-semibold tabular-nums">
                            {Math.round(rangeMin)}
                        </span>
                        <Minus className="inline w-3 h-3 mx-0.5 opacity-60" />
                        <span className="text-foreground font-semibold tabular-nums">
                            {Math.round(rangeMax)}
                        </span>
                    </span>
                    <button
                        type="button"
                        onClick={() => onRangeChange([xMin, xMax])}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                        <Sparkles className="w-3 h-3" />
                        Hammasi
                    </button>
                </div>
                <Slider
                    min={xMin}
                    max={xMax}
                    step={1}
                    value={[rangeMin, rangeMax]}
                    onValueChange={(v) =>
                        onRangeChange([v[0] ?? xMin, v[1] ?? xMax])
                    }
                />
            </div>

            {onThresholdChange && (
                <div className="flex items-center gap-2 text-[11px]">
                    <span className="inline-block w-2 h-[2px] bg-rose-500 rounded" />
                    <span className="text-muted-foreground">
                        Minimum chegara
                    </span>
                    <button
                        type="button"
                        onClick={() =>
                            onThresholdChange(Math.max(xMin, effThreshold - 1))
                        }
                        className="w-5 h-5 rounded border border-border/70 hover:border-rose-500/60 hover:text-rose-500 flex items-center justify-center"
                        aria-label="decrease"
                    >
                        −
                    </button>
                    <input
                        type="number"
                        value={Math.round(effThreshold)}
                        min={xMin}
                        max={xMax}
                        onChange={(e) => {
                            const n = Number(e.target.value)
                            if (!Number.isNaN(n))
                                onThresholdChange(
                                    Math.max(xMin, Math.min(xMax, n)),
                                )
                        }}
                        className="w-12 h-5 text-center text-xs bg-transparent border border-border/70 rounded tabular-nums font-semibold focus:outline-none focus:border-rose-500/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                        type="button"
                        onClick={() =>
                            onThresholdChange(Math.min(xMax, effThreshold + 1))
                        }
                        className="w-5 h-5 rounded border border-border/70 hover:border-rose-500/60 hover:text-rose-500 flex items-center justify-center"
                        aria-label="increase"
                    >
                        +
                    </button>
                    {defaultThreshold !== undefined &&
                        Math.round(effThreshold) !==
                            Math.round(defaultThreshold) && (
                            <button
                                type="button"
                                onClick={() =>
                                    onThresholdChange(defaultThreshold)
                                }
                                className="flex items-center gap-1 text-muted-foreground hover:text-foreground ml-1"
                                title="Asliga qaytarish"
                            >
                                <RotateCcw className="w-3 h-3" />
                            </button>
                        )}
                </div>
            )}
        </div>
    )
}

function Stat({
    label,
    value,
    highlight,
}: {
    label: string
    value: number | string
    highlight?: boolean
}) {
    return (
        <div className="flex flex-col items-end leading-tight">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {label}
            </span>
            <span
                className={
                    "text-sm tabular-nums " +
                    (highlight
                        ? "text-primary font-semibold"
                        : "font-medium text-foreground")
                }
            >
                {value}
            </span>
        </div>
    )
}
