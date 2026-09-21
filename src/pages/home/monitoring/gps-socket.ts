import {
    MONITORING_GPS_LIVE,
    MONITORING_GPS_LIVE_TICKET,
} from "@/constants/api-endpoints"
import { buildQueryKey, getRequest } from "@/hooks/useGet"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import type { GpsLiveVehicle } from "./types"

type LiveItem = {
    imei: string
    name: string
    status: GpsLiveVehicle["status"]
    last_update: string | null
    position: {
        fix_time: string | null
        latitude: number
        longitude: number
        speed: number | null
        course: number | null
        ignition: boolean | null
    } | null
}

type LiveMessage =
    | { type: "snapshot"; devices: LiveItem[] }
    | ({ type: "update" } & LiveItem)

type Ticket = { url: string; ticket: string }

const MAX_RETRY_MS = 30_000

function socketUrl({ url, ticket }: Ticket) {
    const base = url.startsWith("/")
        ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}${url}`
        : url
    return `${base}?ticket=${encodeURIComponent(ticket)}`
}

function merge(list: GpsLiveVehicle[], item: LiveItem): GpsLiveVehicle[] {
    const p = item.position
    const patch = {
        imei: item.imei,
        tracker_name: item.name,
        status: item.status,
        last_update: item.last_update,
        lat: p?.latitude ?? null,
        lng: p?.longitude ?? null,
        speed: p?.speed ?? null,
        course: p?.course ?? null,
        ignition: p?.ignition ?? null,
        fix_time: p?.fix_time ?? null,
    }
    return list.some((g) => g.imei === item.imei)
        ? list.map((g) => (g.imei === item.imei ? { ...g, ...patch } : g))
        : [...list, { vehicle: null, vehicle_number: null, driver_name: null, ...patch }]
}

export function useGpsLiveSocket(enabled: boolean) {
    const queryClient = useQueryClient()
    const [connected, setConnected] = useState(false)

    useEffect(() => {
        if (!enabled) return
        const key = buildQueryKey(MONITORING_GPS_LIVE)
        let socket: WebSocket | null = null
        let retry: ReturnType<typeof setTimeout> | undefined
        let attempt = 0
        let stopped = false

        const apply = (items: LiveItem[]) =>
            queryClient.setQueryData<GpsLiveVehicle[]>(key, (old) =>
                items.reduce(merge, old ?? []),
            )

        const reconnect = () => {
            setConnected(false)
            if (stopped) return
            retry = setTimeout(open, Math.min(MAX_RETRY_MS, 1000 * 2 ** attempt))
            attempt += 1
        }

        const open = () => {
            getRequest(MONITORING_GPS_LIVE_TICKET).then((ticket: Ticket) => {
                if (stopped) return
                socket = new WebSocket(socketUrl(ticket))
                socket.onopen = () => {
                    attempt = 0
                    setConnected(true)
                }
                socket.onmessage = (event) => {
                    const message: LiveMessage = JSON.parse(event.data)
                    apply(message.type === "snapshot" ? message.devices : [message])
                }
                socket.onclose = reconnect
            }, reconnect)
        }

        open()
        return () => {
            stopped = true
            clearTimeout(retry)
            socket?.close()
        }
    }, [enabled, queryClient])

    return connected
}
