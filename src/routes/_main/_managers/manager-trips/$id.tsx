import ManagersTrips from '@/pages/home/managers/managers-trips'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/_managers/manager-trips/$id')({
  component: ManagersTrips,
})
