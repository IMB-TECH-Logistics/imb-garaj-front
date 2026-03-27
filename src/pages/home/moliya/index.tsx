import { useState, useEffect, useRef, useCallback, ReactNode, CSSProperties } from "react"
import { cn } from "@/lib/utils"
import CandlestickChart from "./candlestick-chart"
import IncomeExpenseChart from "./income-expense-chart"
import FlowChart from "./flow-chart"
import TransactionLedger from "./transaction-ledger"
import { DebtorCard, CreditorCard } from "./debtor-creditor"
import CashflowForecast from "./cashflow-forecast"
import ParamDateRange from "@/components/as-params/date-picker-range"

function ExpandIcon({ expanded }: { expanded: boolean }) {
    if (expanded) {
        return (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 2v3c0 1.1-.9 2-2 2H4M15 2v3c0 1.1.9 2 2 2h3M4 15h3c1.1 0 2 .9 2 2v3M20 15h-3c-1.1 0-2 .9-2 2v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    }
    return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

const INSET = 12

function ChartPanel({
    children,
    expandedId,
    panelId,
    onToggle,
}: {
    children: ReactNode
    expandedId: string | null
    panelId: string
    onToggle: (id: string | null) => void
}) {
    const ref = useRef<HTMLDivElement>(null)
    const originRect = useRef<DOMRect | null>(null)
    const isExpanded = expandedId === panelId
    const isOther = expandedId !== null && !isExpanded
    const [animStyle, setAnimStyle] = useState<CSSProperties>({})
    const [phase, setPhase] = useState<"idle" | "expanding" | "expanded" | "collapsing">("idle")

    const expand = useCallback(() => {
        const el = ref.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        originRect.current = rect

        // Snap to current position
        setAnimStyle({
            position: "fixed",
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            zIndex: 50,
            transition: "none",
            borderRadius: 12,
        })
        setPhase("expanding")
        onToggle(panelId)

        // Animate to fullscreen
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setAnimStyle({
                    position: "fixed",
                    top: INSET,
                    left: INSET,
                    width: `calc(100vw - ${INSET * 2}px)`,
                    height: `calc(100vh - ${INSET * 2}px)`,
                    zIndex: 50,
                    transition: "top 500ms cubic-bezier(0.22,1,0.36,1), left 500ms cubic-bezier(0.22,1,0.36,1), width 500ms cubic-bezier(0.22,1,0.36,1), height 500ms cubic-bezier(0.22,1,0.36,1), border-radius 500ms cubic-bezier(0.22,1,0.36,1)",
                    borderRadius: 16,
                })
                setTimeout(() => setPhase("expanded"), 520)
            })
        })
    }, [onToggle, panelId])

    const collapse = useCallback(() => {
        const rect = originRect.current
        if (!rect) {
            setAnimStyle({})
            setPhase("idle")
            onToggle(null)
            return
        }

        setPhase("collapsing")
        // First clear expandedId so other panels fade back in
        onToggle(null)

        setAnimStyle({
            position: "fixed",
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            zIndex: 50,
            transition: "top 450ms cubic-bezier(0.22,1,0.36,1), left 450ms cubic-bezier(0.22,1,0.36,1), width 450ms cubic-bezier(0.22,1,0.36,1), height 450ms cubic-bezier(0.22,1,0.36,1), border-radius 450ms cubic-bezier(0.22,1,0.36,1)",
            borderRadius: 12,
        })

        setTimeout(() => {
            setAnimStyle({})
            setPhase("idle")
        }, 470)
    }, [onToggle])

    const handleClick = () => {
        if (phase === "expanded" || phase === "expanding") collapse()
        else if (phase === "idle") expand()
    }

    const isAnimating = phase !== "idle"

    return (
        <>
            {/* Placeholder to keep grid slot when card goes fixed */}
            {isAnimating && (
                <div className="rounded-xl border border-dashed border-border/40 bg-muted/20" />
            )}
            <div
                ref={ref}
                className={cn(
                    "relative bg-card border rounded-xl overflow-hidden",
                    "transition-opacity duration-400 ease-out",
                    isOther && !isAnimating ? "opacity-30 scale-[0.98]" : "opacity-100 scale-100",
                )}
                style={isAnimating ? {
                    ...animStyle,
                    boxShadow: phase === "collapsing" ? "none" : "0 25px 50px -12px rgba(0,0,0,0.25)",
                    opacity: 1,
                } : {
                    transition: "opacity 400ms ease, transform 400ms ease",
                }}
            >
                {children}
                <div className={cn(
                    "absolute z-10 flex items-center gap-2",
                    "transition-all duration-200",
                    phase === "expanded" || phase === "expanding" ? "top-3 right-3" : "top-2 right-2",
                )}>
                    {(phase === "expanded") && (
                        <ParamDateRange
                            from="from_date"
                            to="to_date"
                            addButtonProps={{
                                className: "!bg-background/70 backdrop-blur-sm border shadow-sm h-8 text-xs min-w-28 justify-start",
                            }}
                        />
                    )}
                    <button
                        onClick={handleClick}
                        className="size-8 rounded-lg flex items-center justify-center bg-background/70 backdrop-blur-sm border shadow-sm text-muted-foreground hover:text-foreground hover:bg-background/90 transition-all duration-200"
                    >
                        <ExpandIcon expanded={phase === "expanded" || phase === "expanding"} />
                    </button>
                </div>
            </div>
        </>
    )
}

export default function MoliyaPage() {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const pageRef = useRef<HTMLDivElement>(null)

    // Prevent browser pinch-to-zoom on this page
    useEffect(() => {
        const el = pageRef.current
        if (!el) return
        const prevent = (e: WheelEvent) => {
            if (e.ctrlKey) e.preventDefault()
        }
        el.addEventListener("wheel", prevent, { passive: false })
        return () => el.removeEventListener("wheel", prevent)
    }, [])

    return (
        <div ref={pageRef}>
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-background/60 backdrop-blur-sm transition-opacity duration-500",
                    expandedId ? "opacity-100" : "opacity-0 pointer-events-none",
                )}
                onClick={() => setExpandedId(null)}
            />
            {/* Main 2x2 grid */}
            <div
                className={cn(
                    "grid gap-3 h-[calc(100vh-80px)]",
                    "grid-cols-1 md:grid-cols-2 grid-rows-2",
                )}
            >
                <ChartPanel expandedId={expandedId} panelId="income-expense" onToggle={setExpandedId}>
                    <IncomeExpenseChart />
                </ChartPanel>

                <ChartPanel expandedId={expandedId} panelId="candlestick" onToggle={setExpandedId}>
                    <CandlestickChart />
                </ChartPanel>

                <ChartPanel expandedId={expandedId} panelId="flow" onToggle={setExpandedId}>
                    <FlowChart />
                </ChartPanel>

                <ChartPanel expandedId={expandedId} panelId="ledger" onToggle={setExpandedId}>
                    <TransactionLedger />
                </ChartPanel>
            </div>

            {/* Bottom row - same height as grid rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pb-4 h-[calc((100vh-80px-12px)/2)]">
                <div className="grid grid-cols-2 gap-3 h-full">
                    <ChartPanel expandedId={expandedId} panelId="debtor" onToggle={setExpandedId}>
                        <DebtorCard />
                    </ChartPanel>
                    <ChartPanel expandedId={expandedId} panelId="creditor" onToggle={setExpandedId}>
                        <CreditorCard />
                    </ChartPanel>
                </div>
                <ChartPanel expandedId={expandedId} panelId="forecast" onToggle={setExpandedId}>
                    <CashflowForecast />
                </ChartPanel>
            </div>
        </div>
    )
}
