import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

type NodeData = {
    id: string
    label: string
    value: number
    color: string
    children?: NodeData[]
}

const TUSHUM: NodeData = {
    id: "total", label: "Tushum", value: 170_000_000, color: "#00e5a0",
    children: [
        { id: "c1", label: "Yuk tashish", value: 85_000_000, color: "#00e5a0", children: [
            { id: "c1-1", label: "Toshkent–Samarqand", value: 32_000_000, color: "#00e5a0", children: [
                { id: "c1-1a", label: "Reys #45 — naqd", value: 18_000_000, color: "#00e5a0" },
                { id: "c1-1b", label: "Reys #47 — bank", value: 14_000_000, color: "#00e5a0" },
            ]},
            { id: "c1-2", label: "Buxoro–Navoiy", value: 28_000_000, color: "#00e5a0", children: [
                { id: "c1-2a", label: "Reys #46 — naqd", value: 15_000_000, color: "#00e5a0" },
                { id: "c1-2b", label: "Reys #48 — plastik", value: 13_000_000, color: "#00e5a0" },
            ]},
            { id: "c1-3", label: "Farg'ona yuk", value: 25_000_000, color: "#00e5a0" },
        ]},
        { id: "c2", label: "Shartnoma", value: 42_000_000, color: "#06b6d4", children: [
            { id: "c2-1", label: "Artel — oylik", value: 22_000_000, color: "#06b6d4" },
            { id: "c2-2", label: "Nestle — oylik", value: 20_000_000, color: "#06b6d4" },
        ]},
        { id: "c3", label: "Logistika", value: 28_000_000, color: "#8b5cf6", children: [
            { id: "c3-1", label: "Ombor xizmati", value: 16_000_000, color: "#8b5cf6" },
            { id: "c3-2", label: "Express yetkazish", value: 12_000_000, color: "#8b5cf6" },
        ]},
        { id: "c4", label: "Ijara", value: 15_000_000, color: "#f59e0b", children: [
            { id: "c4-1", label: "Furgon ijarasi", value: 15_000_000, color: "#f59e0b" },
        ]},
    ],
}

const XARAJAT: NodeData = {
    id: "total", label: "Xarajat", value: 140_000_000, color: "#f43f5e",
    children: [
        { id: "c1", label: "Yoqilg'i", value: 65_000_000, color: "#f43f5e", children: [
            { id: "c1-1", label: "Diesel", value: 32_000_000, color: "#f43f5e", children: [
                { id: "c1-1a", label: "Reys #45 — 120L", value: 14_000_000, color: "#f43f5e" },
                { id: "c1-1b", label: "Reys #47 — 95L", value: 11_000_000, color: "#f43f5e" },
                { id: "c1-1c", label: "Reys #49 — 60L", value: 7_000_000, color: "#f43f5e" },
            ]},
            { id: "c1-2", label: "Benzin AI-92", value: 18_000_000, color: "#f43f5e" },
            { id: "c1-3", label: "Gaz LPG", value: 15_000_000, color: "#f43f5e" },
        ]},
        { id: "c2", label: "Ta'mirlash", value: 35_000_000, color: "#f97316", children: [
            { id: "c2-1", label: "Dvigatel ta'miri", value: 20_000_000, color: "#f97316" },
            { id: "c2-2", label: "Shinalar", value: 15_000_000, color: "#f97316" },
        ]},
        { id: "c3", label: "Ish haqi", value: 28_000_000, color: "#a855f7", children: [
            { id: "c3-1", label: "Haydovchi maoshi", value: 18_000_000, color: "#a855f7" },
            { id: "c3-2", label: "Mexanik maoshi", value: 10_000_000, color: "#a855f7" },
        ]},
        { id: "c4", label: "Yo'l to'lovi", value: 12_000_000, color: "#ec4899", children: [
            { id: "c4-1", label: "Toshkent—Samarqand", value: 7_000_000, color: "#ec4899" },
            { id: "c4-2", label: "Buxoro—Navoiy", value: 5_000_000, color: "#ec4899" },
        ]},
    ],
}

const formatSum = (v: number) => {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M"
    if (v >= 1_000) return (v / 1_000).toFixed(0) + "K"
    return String(v)
}

function curvePath(x1: number, y1: number, x2: number, y2: number) {
    const cx = (x1 + x2) / 2
    return `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`
}

type VisualNode = { id: string; label: string; value: number; color: string; x: number; cy: number; w: number; h: number; hasChildren: boolean; depth: number }
type VisualLink = { x1: number; y1: number; x2: number; y2: number; color: string }

function buildTree(
    root: NodeData,
    expanded: Set<string>,
): { nodes: VisualNode[]; links: VisualLink[] } {
    const nodes: VisualNode[] = []
    const links: VisualLink[] = []
    const nodeH = 30
    const colGap = 160
    const rowGap = 8

    // Collect visible nodes per depth
    const columns: { node: NodeData; parentId: string | null; depth: number }[][] = []

    function walk(node: NodeData, depth: number, parentId: string | null) {
        if (!columns[depth]) columns[depth] = []
        columns[depth].push({ node, parentId, depth })
        if (node.children && expanded.has(node.id)) {
            for (const child of node.children) {
                walk(child, depth + 1, node.id)
            }
        }
    }
    walk(root, 0, null)

    // Layout each column
    const maxRows = Math.max(...columns.map((c) => c.length))
    const canvasH = Math.max(400, maxRows * (nodeH + rowGap) + 40)
    const nodeMap = new Map<string, VisualNode>()

    for (let d = 0; d < columns.length; d++) {
        const col = columns[d]
        const x = 20 + d * colGap
        const totalH = col.length * nodeH + (col.length - 1) * rowGap
        let startY = (canvasH - totalH) / 2

        for (const entry of col) {
            const w = Math.max(80, entry.node.label.length * 5.5 + 30)
            const cy = startY + nodeH / 2
            const vn: VisualNode = {
                id: entry.node.id,
                label: entry.node.label,
                value: entry.node.value,
                color: entry.node.color,
                x, cy, w, h: nodeH,
                hasChildren: !!(entry.node.children?.length),
                depth: d,
            }
            nodes.push(vn)
            nodeMap.set(entry.node.id, vn)

            if (entry.parentId) {
                const parent = nodeMap.get(entry.parentId)
                if (parent) {
                    links.push({ x1: parent.x + parent.w, y1: parent.cy, x2: x, y2: cy, color: entry.node.color })
                }
            }
            startY += nodeH + rowGap
        }
    }

    return { nodes, links }
}

export default function FlowChart() {
    const [mode, setMode] = useState<"tushum" | "xarajat">("tushum")
    const [expanded, setExpanded] = useState<Set<string>>(new Set(["total"]))
    const containerRef = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState({ w: 500, h: 280 })
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const isPanning = useRef(false)
    const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 })

    useEffect(() => {
        if (!containerRef.current) return
        const ro = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect
            if (width > 0 && height > 0) setSize({ w: width, h: height })
        })
        ro.observe(containerRef.current)
        return () => ro.disconnect()
    }, [])

    const isFullscreen = size.h > 400
    const root = mode === "tushum" ? TUSHUM : XARAJAT
    const { nodes, links } = useMemo(() => buildTree(root, expanded), [root, expanded])

    // Compute canvas bounds
    const canvasW = useMemo(() => Math.max(500, ...nodes.map((n) => n.x + n.w + 40)), [nodes])
    const canvasH = useMemo(() => {
        if (!nodes.length) return 400
        const minY = Math.min(...nodes.map((n) => n.cy - n.h / 2))
        const maxY = Math.max(...nodes.map((n) => n.cy + n.h / 2))
        return Math.max(400, maxY - minY + 80)
    }, [nodes])

    const fitView = useCallback(() => {
        const sx = size.w / canvasW
        const sy = size.h / canvasH
        const s = Math.min(sx, sy) * 0.9
        setPan({ x: (size.w - canvasW * s) / 2, y: (size.h - canvasH * s) / 2 })
        setZoom(s)
    }, [size.w, size.h, canvasW, canvasH])

    useEffect(() => { fitView() }, [fitView])

    // Reset expanded on mode change
    useEffect(() => { setExpanded(new Set(["total"])) }, [mode])

    useEffect(() => {
        if (!isFullscreen || !containerRef.current) return
        const el = containerRef.current
        const onWheel = (e: WheelEvent) => {
            if (e.ctrlKey || Math.abs(e.deltaY) < 4) {
                e.preventDefault()
                const factor = e.deltaY > 0 ? 0.92 : 1.08
                const rect = el.getBoundingClientRect()
                const mx = e.clientX - rect.left
                const my = e.clientY - rect.top
                setZoom((prev) => {
                    const next = Math.max(0.2, Math.min(4, prev * factor))
                    const s = next / prev
                    setPan((p) => ({ x: mx - s * (mx - p.x), y: my - s * (my - p.y) }))
                    return next
                })
            }
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => el.removeEventListener("wheel", onWheel)
    }, [isFullscreen])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        isPanning.current = true
        panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
    }, [pan])
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isPanning.current) return
        setPan({ x: panStart.current.px + (e.clientX - panStart.current.x), y: panStart.current.py + (e.clientY - panStart.current.y) })
    }, [])
    const handleMouseUp = useCallback(() => { isPanning.current = false }, [])

    const toggleNode = (id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const expandAll = () => {
        const all = new Set<string>()
        function walk(n: NodeData) { all.add(n.id); n.children?.forEach(walk) }
        walk(root)
        setExpanded(all)
    }

    const collapseAll = () => setExpanded(new Set(["total"]))

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-2 px-3 pt-2 shrink-0 flex-wrap">
                <div className="flex items-center gap-1">
                    <button onClick={() => setMode("tushum")} className={cn("px-3 py-1 rounded-md text-xs font-medium transition-all", mode === "tushum" ? "bg-emerald-500/15 text-emerald-500" : "text-muted-foreground hover:text-foreground")}>Tushum</button>
                    <button onClick={() => setMode("xarajat")} className={cn("px-3 py-1 rounded-md text-xs font-medium transition-all", mode === "xarajat" ? "bg-rose-500/15 text-rose-500" : "text-muted-foreground hover:text-foreground")}>Xarajat</button>
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-1">
                    <button onClick={expandAll} className="px-2 py-1 rounded-md text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted transition-all">Hammasi</button>
                    <button onClick={collapseAll} className="px-2 py-1 rounded-md text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted transition-all">Yig'ish</button>
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-1">
                    <button onClick={() => setZoom((z) => Math.min(3, z * 1.25))} className="size-6 rounded flex items-center justify-center text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">+</button>
                    <button onClick={() => setZoom((z) => Math.max(0.3, z * 0.8))} className="size-6 rounded flex items-center justify-center text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">−</button>
                    <button onClick={fitView} className="h-6 px-2 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">Reset</button>
                    <span className="text-[10px] text-muted-foreground/50">{Math.round(zoom * 100)}%</span>
                </div>
            </div>

            <div
                ref={containerRef}
                className="flex-1 min-h-0 cursor-grab active:cursor-grabbing overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <svg width={size.w} height={size.h} className="w-full h-full">
                    <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`} style={{ transition: isPanning.current ? "none" : "transform 60ms linear" }}>
                        {links.map((l, i) => (
                            <path key={i} d={curvePath(l.x1, l.y1, l.x2, l.y2)} fill="none" stroke={l.color} strokeWidth={1.2} opacity={0.2} className="hover:opacity-50 transition-opacity" style={{ pointerEvents: "visibleStroke" }} />
                        ))}
                        {nodes.map((n) => {
                            const isRoot = n.id === "total"
                            const isOpen = expanded.has(n.id)
                            const ny = n.cy - n.h / 2
                            return (
                                <g
                                    key={n.id}
                                    onClick={(e) => { if (n.hasChildren) { e.stopPropagation(); toggleNode(n.id) } }}
                                    className={n.hasChildren ? "cursor-pointer" : ""}
                                >
                                    <rect x={n.x} y={ny} width={n.w} height={n.h} rx={isRoot ? n.h / 2 : 6} fill={n.color} opacity={isRoot ? 0.15 : 0.08} />
                                    {isRoot && <rect x={n.x} y={ny} width={n.w} height={n.h} rx={n.h / 2} fill="none" stroke={n.color} strokeWidth={1.5} opacity={0.35} />}
                                    <text x={isRoot ? n.x + n.w / 2 : n.x + 8} y={n.cy - 3} fontSize={isRoot ? 11 : 9} fontWeight={isRoot ? 700 : 500} fill="currentColor" className="text-foreground" textAnchor={isRoot ? "middle" : "start"}>{n.label}</text>
                                    <text x={isRoot ? n.x + n.w / 2 : n.x + 8} y={n.cy + 10} fontSize={isRoot ? 10 : 8} fill={n.color} fontWeight={500} textAnchor={isRoot ? "middle" : "start"}>{formatSum(n.value)}</text>
                                    {/* Connection dots */}
                                    <circle cx={n.x + n.w} cy={n.cy} r={2.5} fill={n.color} opacity={0.5} />
                                    {!isRoot && <circle cx={n.x} cy={n.cy} r={2} fill={n.color} opacity={0.3} />}
                                    {/* Expand/collapse indicator */}
                                    {n.hasChildren && (
                                        <g transform={`translate(${n.x + n.w - 14},${n.cy - 4})`}>
                                            <text fontSize={8} fill={n.color} opacity={0.6} fontWeight={600}>{isOpen ? "−" : "+"}</text>
                                        </g>
                                    )}
                                </g>
                            )
                        })}
                    </g>
                </svg>
            </div>
        </div>
    )
}
