import { useTranslation } from "react-i18next"
import { CirclePlay, CirclePause, Trash, Mic, ArrowUpRight, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";

type Props = {
    handleSend: (file: File) => void
}

export default function VoiceRecorder({ handleSend }: Props) {
const { t } = useTranslation()
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);  // Streamni ref orqali boshqaramiz

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const resultRef = useRef<HTMLAudioElement | null>(null);

    // --- Mikrofonni faollashtirish (faqat Start bosilganida)
    const setupMicrophone = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { noiseSuppression: true, echoCancellation: true },
            });

            // Microphone streamni saqlash
            streamRef.current = stream;

            const AudioCtor: typeof AudioContext | undefined =
                (window as any).AudioContext || (window as any).webkitAudioContext;

            if (!AudioCtor) return;
            const audioCtx: AudioContext = new (AudioCtor as any)();
            audioCtxRef.current = audioCtx;

            const source = audioCtx.createMediaStreamSource(stream);
            sourceRef.current = source;

            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256; // freq barlar uchun yetarli
            analyser.smoothingTimeConstant = 0.8;
            source.connect(analyser);
            analyserRef.current = analyser;

            // MediaRecorder tayyorlash
            const mr = new MediaRecorder(stream);
            mr.ondataavailable = (e: BlobEvent) => {
                if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
            };
            mr.onstop = async () => {
                if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

                // Blobni File turiga aylantiramiz
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                chunksRef.current = [];

                const file = new File([blob], `audio_${Date.now()}.webm`, { type: "audio/webm", lastModified: Date.now() });

                // File bilan ishlash
                setFile(file);
                const url = URL.createObjectURL(file);
                setAudioUrl(url);
                setIsPlaying(false);

                // To'liq yozuvdan vaqt bo'yicha bar waveform chizish
                try {
                    const buf = await file.arrayBuffer();
                    const decoded = await audioCtx.decodeAudioData(buf);
                    drawStaticBarsFromPcm(file.size);
                } catch (e) {
                    console.error("Decode xatosi:", e);
                }
            };
            mediaRecorderRef.current = mr;
        } catch (e) {
            console.error("Mic ruxsat yoki setup xatosi", e);
        }
    };


    // --- Start Recording
    const startRecording = async (): Promise<void> => {
        if (audioUrl && file) {
            setIsRecording(false);
            handleSend(file)
            setAudioUrl(null)
            setFile(null)
        }
        else if (!streamRef.current) {
            // Mikrofonni faollashtirish (faqat recording boshlanganda)
            if (!streamRef.current) {
                await setupMicrophone(); // Faollashtirish
            }

            setIsRecording(true);
            try {
                mediaRecorderRef.current?.start(100);
            } catch (e) {
                console.error("MediaRecorder start xatosi", e);
            }
        }
    };

    // --- Stop Recording
    const stopRecording = (): void => {
        if (mediaRecorderRef.current) {
            setIsRecording(false);
            try {
                mediaRecorderRef.current.stop();
            } catch (e) {
                console.error("MediaRecorder stop xatosi", e);
            }

            // Mikrofonni to'xtatish
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;  // Streamni to'xtatamiz
            }
        }
    };

    // --- audio element event listeners -> icon holati
    useEffect(() => {
        const audioEl = resultRef.current;
        if (!audioEl) return;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => setIsPlaying(false);

        audioEl.addEventListener("play", handlePlay);
        audioEl.addEventListener("pause", handlePause);
        audioEl.addEventListener("ended", handleEnded);

        return () => {
            audioEl.removeEventListener("play", handlePlay);
            audioEl.removeEventListener("pause", handlePause);
            audioEl.removeEventListener("ended", handleEnded);
        };
    }, [audioUrl]);

    // --- Live EQUALIZER (freq barlar) faqat recording paytida
    useEffect(() => {
        if (!isRecording) {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            return;
        }
        drawLiveBars();
    }, [isRecording]);

    const drawLiveBars = (): void => {
        const analyser = analyserRef.current;
        const canvas = canvasRef.current;
        if (!analyser || !canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const threshold = 28;
        const barWidth = 4;
        const gap = 2;

        const draw = (): void => {
            if (!isRecording) return;
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const midY = canvas.height / 2;

            const maxBars = Math.floor(canvas.width / (barWidth + gap));
            const step = Math.max(1, Math.ceil(bufferLength / Math.max(1, maxBars)));

            let x = 0;
            for (let i = 0; i < bufferLength; i += step) {
                let sum = 0;
                let cnt = 0;
                for (let j = i; j < i + step && j < bufferLength; j++) {
                    sum += dataArray[j];
                    cnt++;
                }
                let v = cnt ? sum / cnt : 0;
                v = v < threshold ? 0 : v;

                const barHeight = (v / 255) * canvas.height * 0.9;
                const y = midY - barHeight / 2;

                ctx.fillStyle = "#60a5fa";
                ctx.fillRect(x, y, barWidth, barHeight);

                x += barWidth + gap;
            }

            rafRef.current = requestAnimationFrame(draw);
        };

        draw();
    };

    // --- Draw static waveform bars from recorded audio
    const drawStaticBarsFromPcm = useCallback((size: number): void => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = Number((size / 1024).toFixed(2))
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        const barWidth = 3;
        const gap = 1;
        const bars = Math.max(1, Math.floor(width / (barWidth + gap)));

        const midY = height / 2;
        let x = 0;
        let barHeightsStr = "";

        for (let i = 0; i < bars; i++) {
            // [0.1 - 4] random amplitude
            const randomAmp = 0.1 + Math.random() * (4 - 0.1);

            // balandlikni randomAmp asosida chizamiz
            const barHeight = randomAmp * (height / 4);
            const y = midY - barHeight / 2;

            barHeightsStr += `${barHeight.toFixed(1)} `;

            ctx.fillStyle = "#0ea5e9";
            ctx.fillRect(x, y, barWidth, barHeight);

            x += barWidth + gap;
        }
    }, [canvasRef])

    return (
        <div className="max-w-md">
            {(isRecording || audioUrl) && (
                <div className="absolute left-10 -bottom-0.5  px-3 bg-[#18222C] flex items-center gap-2">
                    {isRecording ? (
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <span className="flex h-3 w-3 items-center justify-center">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                aria-label={isPlaying ? "Pause" : "Play"}
                                className="text-primary"
                                onClick={() => {
                                    const el = resultRef.current;
                                    if (!el) return;
                                    if (el.paused) {
                                        el.play().catch(() => { });
                                    } else {
                                        el.pause();
                                    }
                                }}
                            >
                                {isPlaying ? <CirclePause size={18} /> : <CirclePlay size={18} />}
                            </button>
                            <button
                                type="button"
                                aria-label={t("ui.voice_recorder.delete_audio")}
                                className="text-rose-500"
                                onClick={() => {
                                    const el = resultRef.current;
                                    if (!el) return;
                                    el.pause();
                                    setAudioUrl(null);
                                    setFile(null)
                                }}
                            >
                                <Trash size={18} />
                            </button>
                        </div>
                    )}
                    <canvas ref={canvasRef} width={480} height={40} className="w-full" />
                </div>
            )}

            <div className="items-center">
                {isRecording ? (
                    <Button
                        type={"button"}
                        variant={"ghost"}
                        className="h-9 w-9 p-0 disabled:text-[#B1C3D4] text-[#2EA6FE]  hover:bg-transparent"
                        onClick={stopRecording}
                    >
                        <ArrowUpRight className="-rotate-45" size={22} />
                    </Button>
                ) : (
                    <Button
                        onClick={startRecording}
                        variant={"ghost"}
                        className="h-9 w-9 p-0 disabled:text-[#B1C3D4] text-[#2EA6FE]  hover:bg-transparent"
                    >
                        {audioUrl ? <Send className="rotate-45" size={22} /> : <Mic size={22} />}
                    </Button>
                )}
            </div>

            {/* audio element: UI ko'rinmaydi, lekin eventlar orqali play/pause boshqariladi */}
            {audioUrl && <audio src={audioUrl} controls className="hidden" ref={resultRef} />}
        </div>
    );
}
