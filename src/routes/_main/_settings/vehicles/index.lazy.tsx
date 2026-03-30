import { createLazyFileRoute } from '@tanstack/react-router'
import VehiclesPage from '@/pages/home/settings/vehicles'

export const Route = createLazyFileRoute('/_main/_settings/vehicles/')({
    component: VehiclesPage,
})
