import { isAllTenantsMode } from "@/lib/tenant-scope"
import { useEffect, useRef, useState } from "react"
import {
    keepPreviousData,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query"

type WebSocketState<T> = {
    data: T | undefined
    isConnected: boolean
    isFetching: boolean
    isPending: boolean
    isLoading: boolean
    sendMessage: (message: any) => void
    wsError?: string
}

export const useWebSocket = <T = unknown>(
    wsUrl: string,
    params?: any | undefined,
    pk?: 'token' | 'user_id'
): WebSocketState<T> => {
    const [isConnected, setIsConnected] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const [isPending, setIsPending] = useState(true)
    const [isLoading, setIsLoading] = useState(true)
    const [hasConnected, setHasConnected] = useState(false)
    const [retryCount, setRetryCount] = useState(0)
    const [wsError, setWsError] = useState<string | undefined>(undefined)
    const wsRef = useRef<WebSocket | null>(null)
    const queryClient = useQueryClient()

    const { data } = useQuery<T>({
        queryKey: [wsUrl, !!params ? params : {}],
        placeholderData: keepPreviousData,
    })

    useEffect(() => {
        if (isAllTenantsMode()) return

        const connectWebSocket = () => {
            setIsFetching(true)
            if (!hasConnected) {
                setIsLoading(true)
            }
            const ws = new WebSocket(
                `${import.meta.env.VITE_SOCKET_URL}ws/${wsUrl}${pk === 'token' ? `?token=${localStorage.getItem(
                    "token"
                )}` : `/?pk=${localStorage.getItem("user_id")}`}`,
            )
            wsRef.current = ws

            ws.onopen = () => {
                setIsConnected(true)
                setRetryCount(0)
                setWsError(undefined)
                setIsFetching(false)
                if (!hasConnected) {
                    setIsLoading(false)
                    setHasConnected(true)
                }
            }

            ws.onmessage = (event) => {
                try {
                    const message: any = JSON.parse(event.data)
                    handleWebSocketMessage(message)
                    setIsPending(false)
                    if (!hasConnected) {
                        setIsLoading(false)
                        setHasConnected(true)
                    }
                } catch (e) {
                    console.error("Failed to parse WebSocket message:", e)
                }
            }

            ws.onerror = () => {
                setWsError("WebSocket error occurred")
                setIsFetching(false)
                if (!hasConnected) {
                    setIsLoading(false)
                }
            }

            ws.onclose = () => {
                setIsConnected(false)
                setIsFetching(false)
                if (!hasConnected) {
                    setIsLoading(false)
                }
                if (retryCount < 5) {
                    setTimeout(() => {
                        setRetryCount((prev) => prev + 1)
                        connectWebSocket()
                    }, 2000)
                } else {
                    setWsError("WebSocket connection failed after 5 retries")
                }
            }
        }

        connectWebSocket()

        return () => {
            wsRef.current?.close()
        }
    }, [wsUrl])

    const handleWebSocketMessage = (message: T) => {
        queryClient.setQueryData<T>([wsUrl, !!params ? params : {}], () => message)
    }

    const sendMessage = (message: any) => {
        if (isConnected && wsRef.current) {
            wsRef.current.send(JSON.stringify(message))
        } else {
            console.error("WebSocket is not connected. Message not sent.")
            setWsError("Cannot send message. WebSocket is not connected.")
        }
    }

    return {
        data,
        isConnected,
        isFetching,
        isPending,
        isLoading: isLoading && !data,
        sendMessage,
        wsError,
    }
}
