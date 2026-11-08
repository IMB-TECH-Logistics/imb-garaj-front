import { useEffect } from "react"

const STEP = 160

function isTypingTarget(el: Element | null): boolean {
    if (!el || el === document.body) return false
    if (el instanceof HTMLElement && el.isContentEditable) return true
    if (el.closest("input, textarea, select, [role='combobox'], [role='listbox'], [role='menu'], [role='slider'], [role='tablist']")) return true
    return false
}

function canScrollX(el: Element): el is HTMLElement {
    if (!(el instanceof HTMLElement)) return false
    if (el.scrollWidth - el.clientWidth < 2) return false
    const overflowX = getComputedStyle(el).overflowX
    return overflowX === "auto" || overflowX === "scroll"
}

function scrollableAncestor(el: Element | null, stop: Element): HTMLElement | null {
    let node: Element | null = el
    while (node && node !== stop.parentElement) {
        if (canScrollX(node)) return node
        node = node.parentElement
    }
    return null
}

function isVisible(el: HTMLElement): boolean {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight
}

function findTarget(scope: Element, hovered: Element | null): HTMLElement | null {
    if (hovered && scope.contains(hovered)) {
        const fromHover = scrollableAncestor(hovered, scope)
        if (fromHover && fromHover.querySelector("table")) return fromHover
    }
    let best: HTMLElement | null = null
    let bestArea = 0
    scope.querySelectorAll("table").forEach((table) => {
        const box = scrollableAncestor(table, scope)
        if (!box || !isVisible(box)) return
        const r = box.getBoundingClientRect()
        const area = r.width * (Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0))
        if (area > bestArea) {
            best = box
            bestArea = area
        }
    })
    return best
}

export function useTableArrowScroll() {
    useEffect(() => {
        let hovered: Element | null = null
        const onMove = (e: MouseEvent) => {
            hovered = e.target instanceof Element ? e.target : null
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
            if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
            if (isTypingTarget(document.activeElement)) return
            const dialogs = document.querySelectorAll("[role='dialog'], [role='alertdialog']")
            const scope = dialogs.length ? dialogs[dialogs.length - 1] : document.body
            const box = findTarget(scope, hovered)
            if (!box) return
            e.preventDefault()
            box.scrollBy({ left: e.key === "ArrowRight" ? STEP : -STEP, behavior: "smooth" })
        }
        document.addEventListener("mousemove", onMove, { passive: true })
        window.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("mousemove", onMove)
            window.removeEventListener("keydown", onKey)
        }
    }, [])
}
