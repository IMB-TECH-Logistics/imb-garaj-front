import DocumentsPage from "@/pages/home/settings/documents"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/_settings/documents/")({
    component: DocumentsPage,
})
