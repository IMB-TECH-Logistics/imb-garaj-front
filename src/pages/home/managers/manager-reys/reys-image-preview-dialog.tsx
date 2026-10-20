import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

export function ReysImagePreviewDialog({ previewIndex, setPreviewIndex, previewItems }: {
    previewIndex: number | null
    setPreviewIndex: (index: number | null) => void
    previewItems: { key: string; url: string }[]
}) {
    const { t } = useTranslation()
    return (
    <Dialog
        open={previewIndex !== null}
        onOpenChange={() => setPreviewIndex(null)}
    >
        <DialogContent className="max-w-2xl p-2">
            {previewIndex !== null && previewItems[previewIndex] && (
                <div className="relative flex items-center justify-center">
                    {previewItems.length > 1 && (
                        <button
                            type="button"
                            aria-label={t("trips.common.previous")}
                            onClick={() =>
                                setPreviewIndex(
                                    (previewIndex - 1 + previewItems.length) %
                                    previewItems.length,
                                )
                            }
                            className="absolute left-2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:bg-accent transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <img
                        src={previewItems[previewIndex].url}
                        alt={t("trips.common.preview")}
                        className="w-full h-auto rounded-lg"
                    />
                    {previewItems.length > 1 && (
                        <button
                            type="button"
                            aria-label={t("trips.common.next")}
                            onClick={() =>
                                setPreviewIndex(
                                    (previewIndex + 1) % previewItems.length,
                                )
                            }
                            className="absolute right-2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:bg-accent transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    )}
                </div>
            )}
        </DialogContent>
    </Dialog>
    )
}
