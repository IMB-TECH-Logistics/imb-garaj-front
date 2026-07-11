import BuxgalteriyaPage from '@/pages/home/buxgalteriya'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_main/buxgalteriya/')({
  component: BuxgalteriyaPage,
})
