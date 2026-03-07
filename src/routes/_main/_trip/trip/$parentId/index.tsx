import { createFileRoute, Outlet } from '@tanstack/react-router'
import TripOrders from '@/pages/home/trip-orders'

export const Route = createFileRoute('/_main/_trip/trip/$parentId/')({
  component: Parent,
})

function Parent() {
  return (
    <>
      <TripOrders />
      <Outlet />
    </>
  )
}
