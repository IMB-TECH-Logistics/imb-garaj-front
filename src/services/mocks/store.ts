const PREFIX = "mock:"

export const loadStore = <T>(key: string, fallback: T): T => {
    try {
        const raw = localStorage.getItem(PREFIX + key)
        if (!raw) return fallback
        return JSON.parse(raw) as T
    } catch {
        return fallback
    }
}

export const saveStore = <T>(key: string, value: T) => {
    try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
        /* ignore */
    }
}

export const nextId = (rows: { id: number }[]) =>
    rows.reduce((m, r) => Math.max(m, r.id), 0) + 1

export const paginate = <T>(
    rows: T[],
    page: number,
    pageSize: number,
): { results: T[]; total_pages: number; count: number; page_size: number } => {
    const safeSize = Math.max(1, pageSize)
    const total_pages = Math.max(1, Math.ceil(rows.length / safeSize))
    const start = (Math.max(1, page) - 1) * safeSize
    return {
        results: rows.slice(start, start + safeSize),
        total_pages,
        count: rows.length,
        page_size: safeSize,
    }
}

export const matchSearch = (haystack: string | null | undefined, q?: string) => {
    if (!q) return true
    return (haystack ?? "").toLowerCase().includes(q.toLowerCase())
}
