import { UseQueryOptions, UseQueryResult } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { isAllTenantsMode } from "@/lib/tenant-scope"
import { useGet } from "./useGet"
import { useUpdateQueryCache } from "./useUpdateQuery"

type QueryParams = Record<string, string | number | boolean | undefined>
type SkipAction = "create" | "update" | "delete"

interface SocketOptions {
    isPaginated?: boolean
    addToStart?: boolean
    ref?: (node?: Element | null) => void
    onMessage?: <D>(data: D) => void
}

interface UseSocketArgs<T> {
    url: string
    wsUrl: string
    params?: QueryParams
    options?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">
    myOptions?: SocketOptions
    skipActions?: SkipAction[]
}

interface WebSocketMessage<D> {
    action: SkipAction
    data: D
}

interface WebSocketState {
    isConnected: boolean
    sendMessage: (message: unknown) => void
    wsError?: string
    downloadProgress: number
}

type WithId = { id: string | number }
type MaybeWithId<T> =
    | (T extends WithId ? T : never)
    | (T extends (infer U)[] ?
          U extends WithId ?
              U
          :   never
      :   never)
    | (T extends { results: (infer U)[] } ?
          U extends WithId ?
              U
          :   never
      :   never)

export function useSocket<T>({
    url,
    wsUrl,
    params,
    options,
    myOptions,
    skipActions,
}: UseSocketArgs<T>): UseQueryResult<T, Error> & WebSocketState {
    const [isConnected, setIsConnected] = useState(false)
    const [retryCount, setRetryCount] = useState(0)
    const [wsError, setWsError] = useState<string | undefined>(undefined)
    const wsRef = useRef<WebSocket | null>(null)

    const isPaginated = myOptions?.isPaginated ?? true

    const query = useGet<T>(url, {
        params,
        options: {
            refetchOnMount: true,
            refetchOnWindowFocus: true,
            ...options,
        } as any,
    })

    const {
        addItemToQueryCache,
        updateItemInQueryCache,
        removeItemFromQueryCache,
    } = useUpdateQueryCache<MaybeWithId<T>>()

    useEffect(() => {
        if (!wsUrl || isAllTenantsMode()) return

        let reconnectTimeout: NodeJS.Timeout | null = null

        const connectWebSocket = () => {
            const userId = localStorage.getItem("user_id")
            if (!userId) {
                console.error("User ID is missing")
                return
            }

            const fullWsUrl = `${import.meta.env.VITE_SOCKET_URL}main/?cmd=${wsUrl}&pk=${userId}`

            const ws = new WebSocket(fullWsUrl)
            wsRef.current = ws

            ws.onopen = () => {
                setIsConnected(true)
                setRetryCount(0)
                setWsError(undefined)
            }

            ws.onmessage = (event) => {
                let data
                try {
                    data = JSON.parse(event.data)
                    handleWebSocketMessage(data)
                } catch (e) {
                    console.error("Invalid WebSocket message format:", e)
                    console.log(wsUrl, url)
                }
            }

            ws.onerror = () => setWsError("WebSocket error occurred")

            ws.onclose = () => {
                setIsConnected(false)
                if (retryCount < 5) {
                    const reconnectDelay = Math.min(
                        1000 * (retryCount + 1),
                        5000,
                    )
                    reconnectTimeout = setTimeout(() => {
                        setRetryCount((prev) => prev + 1)
                        connectWebSocket()
                    }, reconnectDelay)
                } else {
                    setWsError(
                        "WebSocket connection failed after multiple retries",
                    )
                }
            }
        }

        if (wsUrl) {
            connectWebSocket()
        }

        return () => {
            wsRef.current?.close()
            if (reconnectTimeout) clearTimeout(reconnectTimeout)
        }
    }, [])

    const handleWebSocketMessage = (message: WebSocketMessage<unknown>) => {
        if (skipActions?.includes(message.action)) return

        const baseOptions = {
            url,
            params,
            isPaginated,
            insertAtStart: myOptions?.addToStart,
        }

        const data = message.data as MaybeWithId<T>

        if (data && typeof data === "object" && "id" in data) {
            switch (message.action) {
                case "create":
                    addItemToQueryCache({ ...baseOptions, item: data })
                    break
                case "update":
                    updateItemInQueryCache({ ...baseOptions, item: data })
                    break
                case "delete":
                    removeItemFromQueryCache({ ...baseOptions, item: data })
                    break
                default:
                    console.warn(
                        `Unhandled WebSocket action: ${message.action}`,
                    )
            }
        }

        myOptions?.onMessage?.(message.data)
    }

    const sendMessage = (message: unknown) => {
        if (isConnected && wsRef.current) {
            wsRef.current.send(JSON.stringify(message))
        } else {
            setWsError("Cannot send message. WebSocket is not connected.")
        }
    }

    return {
        ...query,
        isConnected,
        sendMessage,
        wsError,
        downloadProgress: 0,
    }
}
