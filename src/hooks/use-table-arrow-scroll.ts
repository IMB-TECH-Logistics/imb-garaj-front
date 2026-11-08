import { useEffect } from "react"

const STEP_X = 160
const STEP_Y = 120

type Axis = "x" | "y"

function isTypingTarget(el: Element | null): boolean {
    if (!el || el === document.body) return false
    if (el instanceof HTMLElement && el.isContentEditable) return true
    if (el.closest("input, textarea, select, [role='combobox'], [role='listbox'], [role='menu'], [role='slider'], [role='tablist']")) return true
    return false
}

function canScroll(el: Element, axis: Axis): el is HTMLElement {
    if (!(el instanceof HTMLElement)) return false
    const style = getComputedStyle(el)
    if (axis === "x") {
        if (el.scrollWidth - el.clientWidth < 2) return false
        return style.overflowX === "auto" || style.overflowX === "scroll"
    }
    if (el.scrollHeight - el.clientHeight < 2) return false
    return style.overflowY === "auto" || style.overflowY === "scroll"
}

function scrollableAncestor(el: Element | null, stop: Element, axis: Axis): HTMLElement | null {
    let node: Element | null = el
    while (node && node !== stop.parentElement) {
        if (node.querySelector("table") && canScroll(node, axis)) return node as HTMLElement
        node = node.parentElement
    }
    return null
}

function isVisible(el: HTMLElement): boolean {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight
}

function findTarget(scope: Element, hovered: Element | null, axis: Axis): HTMLElement | null {
    if (hovered && scope.contains(hovered)) {
        const fromHover = scrollableAncestor(hovered, scope, axis)
        if (fromHover) return fromHover
    }
    let best: HTMLElement | null = null
    let bestArea = 0
    scope.querySelectorAll("table").forEach((table) => {
        const box = scrollableAncestor(table, scope, axis)
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

function atEdge(box: HTMLElement, axis: Axis, forward: boolean): boolean {
    if (axis === "x") {
        return forward ? box.scrollLeft + box.clientWidth >= box.scrollWidth - 1 : box.scrollLeft <= 0
    }
    return forward ? box.scrollTop + box.clientHeight >= box.scrollHeight - 1 : box.scrollTop <= 0
}

export function useTableArrowScroll() {
    useEffect(() => {
        let hovered: Element | null = null
        const onMove = (e: MouseEvent) => {
            hovered = e.target instanceof Element ? e.target : null
        }
        const onKey = (e: KeyboardEvent) => {
            const axis: Axis | null =
                e.key === "ArrowLeft" || e.key === "ArrowRight" ? "x"
                : e.key === "ArrowUp" || e.key === "ArrowDown" ? "y"
                : null
            if (!axis) return
            if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
            if (isTypingTarget(document.activeElement)) return
            const dialogs = document.querySelectorAll("[role='dialog'], [role='alertdialog']")
            const scope = dialogs.length ? dialogs[dialogs.length - 1] : document.body
            const box = findTarget(scope, hovered, axis)
            if (!box) return
            const forward = e.key === "ArrowRight" || e.key === "ArrowDown"
            if (axis === "y" && atEdge(box, axis, forward)) return
            e.preventDefault()
            if (axis === "x") {
                box.scrollBy({ left: forward ? STEP_X : -STEP_X, behavior: "smooth" })
            } else {
                box.scrollBy({ top: forward ? STEP_Y : -STEP_Y, behavior: "smooth" })
            }
        }
        document.addEventListener("mousemove", onMove, { passive: true })
        window.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("mousemove", onMove)
            window.removeEventListener("keydown", onKey)
        }
    }, [])
}
