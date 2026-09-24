import React, { useState, useEffect, useRef } from "react"
import { Truck, MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"

interface TruckRoute {
  id: string
  owner: string
  driver: string
  from: string
  to: string
  lat: number
  lng: number
  distance: number
  income: number
  status: "Yo‘lda" | "Tushirishda" | "Yetib bordi"
  speed: number
}

declare global {
  interface Window {
    L: any
  }
}

const TruckRoutesMap: React.FC = () => {
  const { t } = useTranslation()
  const [routes, setRoutes] = useState<TruckRoute[]>([
    {
      id: "1",
      owner: "Azizbek Sattorov",
      driver: "Jahongir Karimov",
      from: "Toshkent",
      to: "Samarqand",
      lat: 41.2995,
      lng: 69.2401,
      distance: 320,
      income: 4000000,
      status: "Yo‘lda",
      speed: 60,
    },
    {
      id: "2",
      owner: "Oybek Normurodov",
      driver: "Sardor Akmalov",
      from: "Buxoro",
      to: "Navoiy",
      lat: 40.0949,
      lng: 65.3792,
      distance: 120,
      income: 2500000,
      status: "Yetib bordi",
      speed: 0,
    },
    {
      id: "3",
      owner: "Dilmurod Abdug‘afforov",
      driver: "Azizbek Sodiqov",
      from: "Farg‘ona",
      to: "Toshkent",
      lat: 40.3842,
      lng: 71.7843,
      distance: 320,
      income: 4500000,
      status: "Yo‘lda",
      speed: 55,
    },
    {
      id: "4",
      owner: "Baxtiyor Raximov",
      driver: "Oybek Po‘latov",
      from: "Nukus",
      to: "Xiva",
      lat: 42.4531,
      lng: 59.6108,
      distance: 280,
      income: 5000000,
      status: "Tushirishda",
      speed: 30,
    },
  ])

  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<{ [key: string]: any }>({})

  // Leaflet yuklash
  useEffect(() => {
    if (window.L) {
      setMapReady(true)
      return
    }

    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href =
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
    document.head.appendChild(link)

    const script = document.createElement("script")
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"
    script.onload = () => setMapReady(true)
    document.head.appendChild(script)
  }, [])

  // Xarita yaratish
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInstance.current) return

    const map = window.L.map(mapRef.current).setView([41.2995, 69.2401], 6)

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map)

    mapInstance.current = map
  }, [mapReady])

  // Markerlarni qo‘shish / yangilash
  useEffect(() => {
    if (!mapInstance.current) return

    routes.forEach((route) => {
      const isSelected = selectedRoute === route.id

      const color =
        route.status === "Yo‘lda"
          ? "#4CAF50"
          : route.status === "Tushirishda"
          ? "#FFD700"
          : "#2196F3"

      const icon = window.L.divIcon({
        html: `
          <div style="
            background-color: ${isSelected ? "#ff5722" : color};
            border: 2px solid #fff;
            border-radius: 50%;
            width: 42px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            🚚
          </div>
        `,
        className: "",
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      })

      if (!markersRef.current[route.id]) {
        const marker = window.L.marker([route.lat, route.lng], {
          icon,
        }).addTo(mapInstance.current)

        marker.bindPopup(
          `<b>${route.from} → ${route.to}</b><br>
          Haydovchi: ${route.driver}<br>
          Holati: ${route.status}<br>
          Tezlik: ${route.speed} km/h`
        )

        marker.on("click", () => setSelectedRoute(route.id))
        markersRef.current[route.id] = marker
      } else {
        const marker = markersRef.current[route.id]
        marker.setLatLng([route.lat, route.lng])
        marker.setIcon(icon)
      }
    })
  }, [routes, selectedRoute])

  // Har 3 soniyada joylashuvni o‘zgartirish
  useEffect(() => {
    const interval = setInterval(() => {
      setRoutes((prev) =>
        prev.map((r) => ({
          ...r,
          lat: r.lat + (Math.random() - 0.5) * 0.01,
          lng: r.lng + (Math.random() - 0.5) * 0.01,
          speed: Math.max(0, Math.min(80, r.speed + (Math.random() - 0.5) * 15)),
        }))
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-screen w-full bg-slate-900">
      {/* Xarita */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-white">
            <div className="text-center">
              <p className="text-xl mb-2">Xarita yuklanmoqda...</p>
              <p className="text-sm">{t("messages.loading")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-96 bg-slate-800 border-l border-slate-700 p-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-6">
          <Truck className="text-green-500" size={24} />
          <h1 className="text-2xl font-bold text-white">{t("page.trips_cargo")}</h1>
        </div>

        <h2 className="text-lg font-semibold text-green-400 mb-4">
          Faol reyslar
        </h2>

        <div className="space-y-3">
          {routes.map((route) => (
            <div
              key={route.id}
              onClick={() => setSelectedRoute(route.id)}
              className={`p-4 rounded-lg cursor-pointer transition-all transform hover:scale-105 ${
                selectedRoute === route.id
                  ? "bg-orange-500 text-slate-900 shadow-lg"
                  : "bg-slate-700 text-white hover:bg-slate-600"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={16} />
                <span className="font-bold text-lg">
                  {route.from} → {route.to}
                </span>
              </div>
              <div className="ml-6 text-sm opacity-90">
                <div>👤 Haydovchi: {route.driver}</div>
                <div>🚚 Egasi: {route.owner}</div>
                <div>⚡ Tezlik: {route.speed.toFixed(0)} km/h</div>
                <div>💰 Tushum: {route.income.toLocaleString()} so‘m</div>
                <div>📏 Masofa: {route.distance} km</div>
                <div>📦 Holat: {route.status}</div>
              </div>
            </div>
          ))}
        </div>

        {selectedRoute && (
          <div className="mt-6 p-4 bg-slate-700 rounded-lg border border-green-500">
            <h3 className="text-green-400 font-bold mb-2">{t("page.selected_trip")}</h3>
            <p className="text-white text-sm">
              {
                routes.find((r) => r.id === selectedRoute)?.from
              }{" "}
              →{" "}
              {routes.find((r) => r.id === selectedRoute)?.to}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TruckRoutesMap
