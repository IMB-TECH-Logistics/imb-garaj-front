import { AxiosAdapter, AxiosResponse } from "axios"
import { authHandlers } from "./auth"
import { petrolStationHandlers } from "./petrol-stations"
import { Method, MockHandler, MockRequest, MockResponse } from "./types"

const HANDLERS: MockHandler[] = [...authHandlers, ...petrolStationHandlers]

const FALLBACK_LIST = {
    page_size: 10,
    total_pages: 1,
    count: 0,
    results: [],
}

const normalizeUrl = (url: string | undefined, baseURL: string | undefined) => {
    let u = url ?? "/"
    if (baseURL && u.startsWith(baseURL)) u = u.slice(baseURL.length)
    if (!u.startsWith("/")) u = "/" + u
    return u
}

const parseBody = (body: any) => {
    if (body == null) return {}
    if (body instanceof FormData) {
        const obj: Record<string, any> = {}
        body.forEach((v, k) => (obj[k] = v))
        return obj
    }
    if (typeof body === "string") {
        try {
            return JSON.parse(body)
        } catch {
            return body
        }
    }
    return body
}

const fallback = (req: MockRequest): MockResponse => {
    if (req.method !== "GET") return { status: 200, data: { ok: true } }
    if (req.url.includes("/selectable/")) {
        return { status: 200, data: { data: [] } }
    }
    return { status: 200, data: FALLBACK_LIST }
}

export const mockAdapter: AxiosAdapter = (config) =>
    new Promise((resolve, reject) => {
        const method = (config.method ?? "get").toUpperCase() as Method
        const url = normalizeUrl(config.url, config.baseURL)
        const req: MockRequest = {
            method,
            url,
            params: config.params ?? {},
            body: parseBody(config.data),
        }

        const handler = HANDLERS.find((h) => h.match(method, url, req))
        const result = handler ? handler.respond(req) : fallback(req)

        const response: AxiosResponse = {
            data: result.data,
            status: result.status,
            statusText: result.status >= 400 ? "ERROR" : "OK",
            headers: { "content-type": "application/json" },
            config,
            request: {},
        }

        const finalize =
            result.status >= 400
                ? () =>
                      reject({
                          response,
                          config,
                          message: `Mock ${result.status}`,
                          isAxiosError: true,
                      })
                : () => resolve(response)

        setTimeout(finalize, 120)
    })
