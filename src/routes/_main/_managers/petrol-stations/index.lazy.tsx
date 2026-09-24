import { createLazyFileRoute } from '@tanstack/react-router'
import PetrolStationsPage from '@/pages/home/settings/petrol-stations'

export const Route = createLazyFileRoute('/_main/_managers/petrol-stations/')({
  component: PetrolStationsPage,
})
