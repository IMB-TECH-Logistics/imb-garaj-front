import { createFileRoute } from '@tanstack/react-router'
import ViewPageCashFlows from '@/pages/home/trip-orders/view'

export const Route = createFileRoute('/_main/_trip/trip/$parentId/$childId')({
  component: ViewPageCashFlows,
})
