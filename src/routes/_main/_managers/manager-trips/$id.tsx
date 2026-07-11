import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/_managers/manager-trips/$id')({
  component: lazyRouteComponent(
    () => import('@/pages/home/managers/managers-trips'),
  ),
})
