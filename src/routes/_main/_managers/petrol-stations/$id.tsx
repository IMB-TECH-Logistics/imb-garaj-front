import PetrolStationDetail from '@/pages/home/settings/petrol-stations/detail'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/_managers/petrol-stations/$id')({
  component: PetrolStationDetail,
})
