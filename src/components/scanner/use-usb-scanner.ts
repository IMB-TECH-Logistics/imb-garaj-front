import { useEffect, useRef } from "react"
import { GS } from "./gs1"

const MAX_GAP_MS = 80
const MIN_LENGTH = 4

const isEditable = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false
    return (
        target.isContentEditable ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
    )
}

export const useUsbScanner = (
    onScan: (code: string) => void,
    enabled = true,
) => {
    const handler = useRef(onScan)
    handler.current = onScan

    useEffect(() => {
        if (!enabled) return
        let buffer = ""
        let last = 0

        const onKeyDown = (e: KeyboardEvent) => {
            if (isEditable(e.target)) return
            const now = Date.now()
            if (now - last > MAX_GAP_MS) buffer = ""
            last = now

            if (e.key === "Enter") {
                if (buffer.length >= MIN_LENGTH) {
                    e.preventDefault()
                    const code = buffer
                    buffer = ""
                    handler.current(code)
                }
                buffer = ""
                return
            }
            if (e.ctrlKey && e.key === "]") {
                buffer += GS
                return
            }
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                buffer += e.key
            }
        }

        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [enabled])
}
