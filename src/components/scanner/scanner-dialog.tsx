import Modal from "@/components/custom/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useModal } from "@/hooks/useModal"
import { CircleAlert, Keyboard, VideoOff } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
    BarcodeDetector,
    prepareZXingModule,
} from "barcode-detector/ponyfill"
import zxingWasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url"

prepareZXingModule({
    overrides: {
        locateFile: (path, prefix) =>
            path.endsWith(".wasm") ? zxingWasmUrl : prefix + path,
    },
})

const REPEAT_MS = 2500
const DETECT_INTERVAL_MS = 200

export type ScanHandler = (
    code: string,
) => Promise<string | null | void> | string | null | void

type Props = {
    modalKey: string
    title: string
    onScan: ScanHandler
}

const Corner = ({ className }: { className: string }) => (
    <span className={`absolute size-7 border-primary ${className}`} />
)

const ScannerBody = ({
    modalKey,
    onScan,
}: Pick<Props, "modalKey" | "onScan">) => {
    const { t } = useTranslation()
    const { closeModal } = useModal(modalKey)
    const videoRef = useRef<HTMLVideoElement>(null)
    const busy = useRef(false)
    const lastCode = useRef({ code: "", at: 0 })
    const handler = useRef(onScan)
    handler.current = onScan
    const close = useRef(closeModal)
    close.current = closeModal

    const [error, setError] = useState("")
    const [cameraError, setCameraError] = useState("")
    const [manual, setManual] = useState("")

    const submit = async (code: string) => {
        const value = code.trim()
        if (!value || busy.current) return
        const now = Date.now()
        if (
            lastCode.current.code === value &&
            now - lastCode.current.at < REPEAT_MS
        ) {
            return
        }
        lastCode.current = { code: value, at: now }
        busy.current = true
        try {
            const message = await handler.current(value)
            if (message) setError(message)
            else close.current()
        } finally {
            busy.current = false
        }
    }

    const submitRef = useRef(submit)
    submitRef.current = submit

    useEffect(() => {
        let stopped = false
        let stream: MediaStream | undefined
        let timer: number | undefined

        const start = async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                setCameraError(t("wh.scanner.no_camera"))
                return
            }
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "environment" } },
                    audio: false,
                })
                if (stopped) {
                    stream.getTracks().forEach((track) => track.stop())
                    return
                }
                const video = videoRef.current
                if (!video) return
                video.srcObject = stream
                await video.play()

                const detector = new BarcodeDetector({
                    formats: ["qr_code", "data_matrix"],
                })
                const tick = async () => {
                    if (stopped) return
                    if (!busy.current && video.readyState >= 2) {
                        const codes = await detector
                            .detect(video)
                            .catch(() => [])
                        const value = codes.find((c) => c.rawValue)?.rawValue
                        if (value) await submitRef.current(value)
                    }
                    timer = window.setTimeout(tick, DETECT_INTERVAL_MS)
                }
                tick()
            } catch {
                setCameraError(t("wh.scanner.camera_denied"))
            }
        }
        start()

        return () => {
            stopped = true
            window.clearTimeout(timer)
            stream?.getTracks().forEach((track) => track.stop())
        }
    }, [t])

    return (
        <div className="flex flex-col gap-3">
            <div className="relative h-64 rounded-lg overflow-hidden bg-zinc-950 select-none">
                <video
                    ref={videoRef}
                    className="absolute inset-0 size-full object-cover"
                    playsInline
                    muted
                />
                {cameraError ?
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-sm text-white/80">
                        <VideoOff size={28} />
                        {cameraError}
                    </div>
                :   <>
                        <div className="absolute left-1/2 top-1/2 h-40 w-64 -translate-x-1/2 -translate-y-1/2">
                            <Corner className="left-0 top-0 border-l-4 border-t-4 rounded-tl-md" />
                            <Corner className="right-0 top-0 border-r-4 border-t-4 rounded-tr-md" />
                            <Corner className="left-0 bottom-0 border-l-4 border-b-4 rounded-bl-md" />
                            <Corner className="right-0 bottom-0 border-r-4 border-b-4 rounded-br-md" />
                        </div>
                        <div className="absolute bottom-3 inset-x-0 text-center text-sm text-white/85">
                            {t("wh.scanner.aim")}
                        </div>
                    </>
                }
            </div>

            {error && (
                <div className="rounded-md border border-red-500/40 bg-red-500/5 p-2.5 text-sm text-red-500 flex gap-2">
                    <CircleAlert size={16} className="shrink-0 mt-0.5" />
                    <div>{error}</div>
                </div>
            )}

            <div className="flex flex-col gap-1.5">
                <label htmlFor="scanner-manual" className="text-sm font-medium">
                    {t("wh.scanner.manual")}
                </label>
                <div className="flex gap-2">
                    <Input
                        id="scanner-manual"
                        autoFocus
                        fullWidth
                        prefixIcon={<Keyboard size={16} />}
                        className="font-mono text-xs"
                        placeholder="(01)04640012345017(17)280310(10)L2503-051"
                        value={manual}
                        onChange={(e) => {
                            setManual(e.target.value)
                            setError("")
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                submit(manual)
                            }
                        }}
                    />
                    <Button type="button" onClick={() => submit(manual)}>
                        {t("wh.scanner.read")}
                    </Button>
                </div>
            </div>
        </div>
    )
}

const ScannerDialog = ({ modalKey, title, onScan }: Props) => (
    <Modal modalKey={modalKey} title={title} size="max-w-md">
        <ScannerBody modalKey={modalKey} onScan={onScan} />
    </Modal>
)

export default ScannerDialog
