import PasteInput from "@/components/form/paste-input"
import { ImageIcon, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { RefObject } from "react"

export function ReysImagesSection({ previewItems, existingImages, images, setPreviewIndex, removeExistingImage, removeNewImage, addImages, rasmInputRef }: {
    previewItems: { key: string; url: string }[]
    existingImages: { id: number; image: string }[]
    images: File[]
    setPreviewIndex: (index: number) => void
    removeExistingImage: (id: number) => void
    removeNewImage: (index: number) => void
    addImages: (files: FileList | File[]) => void
    rasmInputRef: RefObject<HTMLInputElement>
}) {
    const { t } = useTranslation()
    return (
        <section className="md:col-span-2 rounded-lg border bg-muted/20 p-4">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{t("trips.create_reys.images")}</h3>
            <div className="grid grid-cols-1 gap-4">
                {previewItems.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {existingImages.map((img, index) => (
                            <div
                                key={`e-${img.id}`}
                                className="relative w-20 h-20 rounded-lg overflow-hidden border cursor-pointer"
                                onClick={() => setPreviewIndex(index)}
                            >
                                <img
                                    src={img.image}
                                    alt={t("trips.create_reys.image_alt", { n: img.id })}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        removeExistingImage(img.id)
                                    }}
                                    className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm rounded-full p-0.5 hover:bg-destructive hover:text-white transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        {images.map((file, index) => (
                            <div
                                key={`n-${index}`}
                                className="relative w-20 h-20 rounded-lg overflow-hidden border cursor-pointer"
                                onClick={() =>
                                    setPreviewIndex(existingImages.length + index)
                                }
                            >
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={t("trips.create_reys.image_alt", { n: index })}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        removeNewImage(index)
                                    }}
                                    className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm rounded-full p-0.5 hover:bg-destructive hover:text-white transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Rasm yuklash */}

                <PasteInput onFile={(file) => addImages([file])} />

                <div
                    className="border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors hover:border-primary/60 group"
                    style={{ minHeight: 100 }}
                    onClick={() => rasmInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault()
                        if (e.dataTransfer.files?.length) {
                            addImages(e.dataTransfer.files)
                        }
                    }}
                >
                    <div className="flex flex-col items-center justify-center gap-2 py-7 text-muted-foreground group-hover:text-primary transition-colors">
                        <ImageIcon size={28} strokeWidth={1.5} />
                        <span className="text-sm font-medium">
                            {t("form.upload_image")}
                        </span>
                        <span className="text-xs">
                            {t("form.upload_image_hint")}
                        </span>
                    </div>
                </div>

                <input
                    ref={rasmInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => {
                        if (e.target.files?.length) {
                            addImages(e.target.files)
                            e.target.value = ""
                        }
                    }}
                />
            </div>
        </section>
    )
}
