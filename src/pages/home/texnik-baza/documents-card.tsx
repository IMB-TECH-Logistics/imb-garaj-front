import { useTranslation } from "react-i18next"
import { fmtDate } from "../ombor/utils"
import StatusDot from "./status-dot"
import type { PassportDocument } from "./types"

const DocumentsCard = ({ documents }: { documents: PassportDocument[] }) => {
    const { t } = useTranslation()

    return (
        <section className="rounded-lg border p-4 flex flex-col gap-3">
            <h2 className="font-semibold">📄 {t("tb.documents")}</h2>
            {!documents.length ?
                <p className="text-sm text-muted-foreground">
                    {t("tb.status_none")}
                </p>
            :   <ul className="flex flex-col divide-y">
                    {documents.map((doc, i) => (
                        <li
                            key={`${doc.type}-${i}`}
                            className="flex items-center justify-between gap-3 py-2 text-sm"
                        >
                            <div className="min-w-0">
                                <div className="font-medium">{doc.label}</div>
                                <div className="text-xs text-muted-foreground">
                                    {doc.number ? `${doc.number} · ` : ""}
                                    {t("tb.issued")}: {fmtDate(doc.issued_date)}
                                </div>
                            </div>
                            <StatusDot
                                status={doc.status}
                                label={fmtDate(doc.expires_date)}
                            />
                        </li>
                    ))}
                </ul>
            }
        </section>
    )
}

export default DocumentsCard
