/// <reference types="vite/client" />
interface ImportMetaEnv {
    readonly VITE_DEFAULT_URL: string;
    readonly VITE_MOBILE_URL: string;
    readonly VITE_FAST_URL: string;
    readonly VITE_SOCKET_URL: string;
    readonly VITE_HASHED_URL: string;
    readonly VITE_GOOGLE_MAP_API_KEY: string;
    readonly VITE_MAP_PROVIDER?: string;
    readonly VITE_MAP_STYLE_URL: string;
    readonly VITE_MAP_RASTER_TILES: string;
    readonly VITE_GEOCODE_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
