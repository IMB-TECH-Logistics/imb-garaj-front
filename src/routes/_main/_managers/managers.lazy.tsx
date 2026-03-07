import { createLazyFileRoute } from '@tanstack/react-router'
import Managers from '@/pages/home/managers'
export const Route = createLazyFileRoute('/_main/_managers/managers')({
  component: Managers,
})
