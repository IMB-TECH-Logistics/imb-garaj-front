import { useEffect, useRef, useState } from "react";
import {
    UseQueryOptions,
    UseQueryResult,
    useQueryClient,
} from "@tanstack/react-query";
import { isAllTenantsMode } from "@/lib/tenant-scope";
import { useInfiniteGet } from "./useInfiniteGet";

type UseGetOptions<T> = Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">;

type WebSocketState = {
    isConnected: boolean;
    sendMessage: (message: unknown) => void;
    wsError?: string;
    ref: (node?: Element | null) => void;
    hasNextPage?: boolean;
};

type QueryParams = Record<string, unknown>;

export function useInfiniteSocket<T = unknown>(
    url: string,
    wsUrl: string,
    params?: QueryParams,
    options?: UseGetOptions<T>
): UseQueryResult<T, Error> & WebSocketState {
    const [isConnected, setIsConnected] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [wsError, setWsError] = useState<string | undefined>(undefined);
    const wsRef = useRef<WebSocket | null>(null);
    const queryClient = useQueryClient();

    const queryKey = params
        ? [url, { ...params, page_tabs: undefined }]
        : [url];

    const query = useInfiniteGet<T>(url, params, options as UseGetOptions<T>);

    useEffect(() => {
        if (isAllTenantsMode()) return;

        let reconnectTimeout: NodeJS.Timeout | null = null;

        const connectWebSocket = () => {
            const userId = localStorage.getItem("user_id");
            if (!userId) {
                return;
            }

            const fullWsUrl = `${import.meta.env.VITE_SOCKET_URL}${wsUrl}?pk=${userId}`;
            const ws = new WebSocket(fullWsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                setRetryCount(0);
                setWsError(undefined);
            };

            ws.onmessage = (event) => {
                let data;
                try {
                    data = JSON.parse(event.data);
                    handleWebSocketMessage(data);
                } catch (e) {
                    console.error("Invalid WebSocket message format:", e);
                }
            };

            ws.onerror = () => {
                setWsError("WebSocket error occurred");
            };

            ws.onclose = () => {
                setIsConnected(false);
                if (retryCount < 5) {
                    const reconnectDelay = Math.min(
                        1000 * (retryCount + 1),
                        5000
                    );
                    reconnectTimeout = setTimeout(() => {
                        setRetryCount((prev) => prev + 1);
                        connectWebSocket();
                    }, reconnectDelay);
                } else {
                    setWsError(
                        "WebSocket connection failed after multiple retries"
                    );
                }
            };
        };

        if (wsUrl) {
            connectWebSocket();
        }

        return () => {
            wsRef.current?.close();
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };
    }, []);

    const handleWebSocketMessage = (message: {
        data: any;
        action: "c" | "d" | "u";
    }) => {
        switch (message.action) {
            case "c":
                addData(message.data);
                break;
            case "u":
                updateData(message.data);
                break;
            case "d":
                deleteData(message.data as number);
                break;
            default:
                console.warn(`Unhandled action type: ${message.action}`);
        }
    };

    const addData = (data: unknown) => {
        queryClient.setQueryData<T>(queryKey, (oldData: any) => {
            if (
                oldData?.results?.find(
                    (item: any) => item.id === (data as any)?.id
                )
            ) {
                return oldData;
            }
            return {
                ...oldData,
                results: [data, ...(oldData?.results || [])],
            } as T;
        });
    };

    const updateData = (data: any) => {
        queryClient.setQueryData<T>(queryKey, (oldData: any) => ({
            ...oldData,
            results: (oldData?.results || []).map((o: any) =>
                o.id === data.id ? data : o
            ),
        }));
    };

    const deleteData = (data: number | { id: number }) => {
        const newId = typeof data === "object" ? data.id : data;
        queryClient.setQueryData<T>(queryKey, (oldData: any) => ({
            ...oldData,
            results: (oldData?.results || []).filter(
                (o: any) => o.id !== newId
            ),
        }));
    };

    const sendMessage = (message: any) => {
        if (isConnected && wsRef.current) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            setWsError("Cannot send message. WebSocket is not connected.");
        }
    };

    return {
        ...query,
        isConnected,
        sendMessage,
        wsError,
    };
}
