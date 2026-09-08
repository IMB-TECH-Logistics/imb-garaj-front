/// <reference types="vite/client" />
interface ImportMetaEnv {
    readonly VITE_DEFAULT_URL: string;
    readonly VITE_MOBILE_URL: string;
    readonly VITE_FAST_URL: string;
    readonly VITE_SOCKET_URL: string;
    readonly VITE_HASHED_URL: string;
    readonly VITE_GOOGLE_MAPS_API_KEY: string;
    /** Xarita uslubi (style JSON) manzili. Bo'sh bo'lsa xarita o'chiriladi. */
    readonly VITE_MAP_STYLE_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
